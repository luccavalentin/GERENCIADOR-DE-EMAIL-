import type { ImapFlow as ImapFlowType } from "imapflow";
import type nodemailerType from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";



export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface ProcessingStats {
  imapConnected: boolean;
  found: number;
  analyzed: number;
  withCode: number;
  forwarded: number;
  ignored: number;
  duplicates: number;
  errors: number;
  details: string[];
}

export async function processEmailsForConfigLogic(
  configId: string,
  supabaseAdmin: SupabaseClient,
  executionId: string = crypto.randomUUID()
) {
  const stats: ProcessingStats = {
    imapConnected: false,
    found: 0,
    analyzed: 0,
    withCode: 0,
    forwarded: 0,
    ignored: 0,
    duplicates: 0,
    errors: 0,
    details: []
  };

  // Global Lock Attempt
  let lockId: string | null = null;
  try {
    const { data: acquiredLockId, error: lockError } = await supabaseAdmin.rpc('acquire_email_config_lock', {
      p_config_id: configId,
      p_lock_timeout: '5 minutes' // Aumentado para 5 minutos para processos longos
    });

    if (lockError || !acquiredLockId) {
      const { data: currentConfig } = await supabaseAdmin
        .from("email_configurations")
        .select("processing_lock_id, processing_lock_until")
        .eq("id", configId)
        .single();

      const isLocked = currentConfig?.processing_lock_id && 
                       currentConfig.processing_lock_until && 
                       new Date(currentConfig.processing_lock_until) > new Date();

      return { 
        success: false, 
        error: isLocked ? "Processamento: Bloqueado por outra execução ativa" : "Erro ao adquirir lock de processamento",
        isLocked: !!isLocked,
        stats 
      };
    }
    lockId = acquiredLockId;
  } catch (err: any) {
    return { success: false, error: `Falha na infraestrutura de lock: ${err.message}`, stats };
  }


  const updateHeartbeat = async (status: string, errorMsg?: string) => {
    await supabaseAdmin.from("email_configurations").update({
      last_heartbeat: new Date().toISOString(),
      last_check_at: new Date().toISOString(),
      status,
      last_error: errorMsg || null,
      ...(status === 'success' ? { last_success_at: new Date().toISOString() } : {})
    }).eq("id", configId);
  };

  try {
    const { data: config, error: configError } = await supabaseAdmin
      .from("email_configurations")
      .select("*")
      .eq("id", configId)
      .single();
    
    if (configError || !config) return { success: false, error: "Config not found" };

    // Migração em tempo real de configurações antigas (Legacy separation by ; or ,)
    const normalizeConfigArray = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      if (arr.length === 1 && (arr[0].includes(';') || arr[0].includes(','))) {
        return arr[0].split(/[;,\n\r]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
      return arr;
    };

    config.destinations = normalizeConfigArray(config.destinations);
    config.keywords = normalizeConfigArray(config.keywords);

    const { data: creds } = await supabaseAdmin
      .from("email_credentials")
      .select("password")
      .eq("config_id", configId)
      .single();

    if (!creds?.password) return { success: false, error: "Credentials not found" };

    const log = async (message: string, level = "info", details: any = null) => {
      console.log(`[Config ${configId}] ${message}`);
      await supabaseAdmin.from("email_logs").insert({
        config_id: configId,
        message,
        level,
        details
      });
    };

    const { ImapFlow } = await import("imapflow");
    const { simpleParser } = await import("mailparser");
    const { convert } = await import("html-to-text");
    const nodemailer = (await import("nodemailer")).default;

    const imap = new ImapFlow({
      host: config.imap_host,
      port: config.imap_port,
      secure: config.imap_secure,
      auth: {
        user: config.email_user,
        pass: creds.password,
      },
      logger: false,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    imap.on('error', (err: any) => {
      console.error(`[IMAP Global Error] Config ${configId}:`, err);
    });


    await log(`Identificador de Processamento: ${executionId}`, "info", { executionId });
    await log("Acesso ao banco de dados garantido.");
    await log(`Estabelecendo conexão com o servidor de e-mail (${config.imap_host})...`);
    
    try {
      await log("Iniciando camada de segurança (TLS)...");
      await imap.connect();
      await log("Conexão segura estabelecida. Autenticando usuário...");
    } catch (connErr: any) {
      const detailedError = {
        message: connErr.message,
        code: connErr.code,
        command: connErr.command,
        response: connErr.response,
        responseCode: connErr.responseCode,
        stack: connErr.stack,
        stage: "connection/auth"
      };
      await log(`Falha na conexão: ${connErr.message}`, "error", detailedError);
      throw new Error(`IMAP Connection Failure: ${connErr.message}`);
    }
    
    stats.imapConnected = true;
    await log("Acesso à conta autorizado. Lendo caixa de entrada...");
    
    let mailboxLock;
    try {
      mailboxLock = await imap.getMailboxLock("INBOX");
      await log("Caixa de entrada aberta. Verificando novos e-mails...");
    } catch (lockErr: any) {
      await log(`Não foi possível ler a caixa de entrada: ${lockErr.message}`, "error");
      throw new Error(`IMAP Mailbox Lock Failure: ${lockErr.message}`);
    }
    
    try {
      const fetchOptions = { seen: false };
      const fetchQuery = { envelope: true, source: true, uid: true, flags: true };

      for await (let message of imap.fetch(fetchOptions, fetchQuery)) {
        stats.found++;
        if (!message.envelope || !message.source || !message.uid) continue;

        const imapUid = Number(message.uid);
        const mailbox = "INBOX";

        const { data: reserved, error: reserveError } = await supabaseAdmin.rpc('reserve_email_for_processing', {
          p_config_id: configId,
          p_mailbox: mailbox,
          p_imap_uid: imapUid
        });

        if (reserveError || !reserved) {
          stats.duplicates++;
          continue;
        }

        stats.analyzed++;

        try {
          const parsed = await simpleParser(message.source as any);
          const subject = parsed.subject || "";
          const from = parsed.from?.value[0]?.address || "desconhecido";
          
          await supabaseAdmin.from("email_processing_state").update({
            message_id: parsed.messageId || null
          } as any).eq("config_id", configId).eq("imap_uid", imapUid);

          const isLoop = 
            from.toLowerCase() === config.email_user.toLowerCase() ||
            subject.toUpperCase().startsWith("ENC:") ||
            parsed.headers.get('auto-submitted') === 'auto-generated' ||
            parsed.headers.get('x-email-monitor') === 'processed';

          if (isLoop) {
            await supabaseAdmin.from("email_processing_state").update({ status: 'ignored' }).eq("config_id", configId).eq("imap_uid", imapUid);
            continue;
          }

          const plainContent = parsed.text || "";
          const htmlContent = parsed.html ? convert(parsed.html as string) : "";
          const fullContent = normalizeText(`${subject} ${plainContent} ${htmlContent}`);

          const hasKeyword = config.keywords.some((kw: string) => {
            const normalizedKw = normalizeText(kw);
            // Busca por inclusão da forma normalizada
            return fullContent.includes(normalizedKw);
          });

          if (hasKeyword) {
            stats.withCode++;
            await log(`Palavra-chave detectada no e-mail de ${from}: "${subject}"`);
            
            const transporter = (nodemailer as any).createTransport({
              host: config.smtp_host,
              port: config.smtp_port,
              secure: config.smtp_secure,
              auth: {
                user: config.email_user,
                pass: creds.password,
              },
              connectionTimeout: 20000, // 20s timeout
              greetingTimeout: 20000,
              socketTimeout: 30000,
            });

            await transporter.sendMail({
              from: config.email_user,
              to: config.destinations.join(", "),
              subject: `ENC: ${subject}`,
              text: `E-mail encaminhado automaticamente.\n\nDe: ${from}\nAssunto: ${subject}\n\n[Email original anexado como rfc822]`,
              attachments: [
                {
                  filename: `${normalizeText(subject.substring(0, 30)) || 'email-original'}.eml`,
                  content: message.source as Buffer,
                  contentType: 'message/rfc822'
                }
              ],
              headers: {
                'X-Email-Monitor': 'processed',
                'X-Original-Message-ID': parsed.messageId || ''
              }
            });


            await supabaseAdmin.from("forwarded_emails").insert({
              config_id: configId,
              original_subject: subject,
              original_from: from,
            });

            await supabaseAdmin.from("email_processing_state").update({ 
              status: 'forwarded',
              forwarded_at: new Date().toISOString()
            }).eq("config_id", configId).eq("imap_uid", imapUid);

            await imap.messageFlagsAdd(message.uid.toString(), ['\\Seen'], { uid: true });
            stats.forwarded++;
            await log(`E-mail encaminhado com sucesso para ${config.destinations.join(", ")}`, "success");
          } else {
            stats.ignored++;
            await supabaseAdmin.from("email_processing_state").update({ status: 'ignored' }).eq("config_id", configId).eq("imap_uid", imapUid);
          }
        } catch (msgError: any) {
          stats.errors++;
          const detailedMsgError = {
            message: msgError.message,
            code: msgError.code,
            stack: msgError.stack
          };
          await log(`Erro no processamento individual (UID ${message.uid}): ${msgError.message}`, "error");
          await supabaseAdmin.from("email_processing_state").update({ 
            status: 'error',
            last_error: JSON.stringify(detailedMsgError)
          }).eq("config_id", configId).eq("imap_uid", imapUid);
        }
      }
    } finally {
      if (mailboxLock) mailboxLock.release();
    }

    try {
      await imap.logout();
    } catch (logoutErr) {}
    
    await updateHeartbeat('success');
    return { success: true, stats };
  } catch (error: any) {
    const errorMsg = error.message || "Unknown error during processing";
    const isLocked = errorMsg === "Processamento: Bloqueado por outra execução" || 
                     errorMsg.includes("Locked or error acquiring lock");
    
    await updateHeartbeat('error', errorMsg);
    return { success: false, error: errorMsg, isLocked, stats };
  } finally {
    await supabaseAdmin.rpc('release_email_config_lock', {
      p_config_id: configId,
      p_lock_id: lockId as string
    });
  }
}
