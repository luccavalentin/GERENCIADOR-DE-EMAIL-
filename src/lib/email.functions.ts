import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { convert } from "html-to-text";

const connectionSchema = z.object({
  imap_host: z.string(),
  imap_port: z.number(),
  imap_secure: z.boolean(),
  smtp_host: z.string(),
  smtp_port: z.number(),
  smtp_secure: z.boolean(),
  email_user: z.string(),
  email_password: z.string(),
});

export const testConnection = createServerFn({ method: "POST" })
  .inputValidator((data) => connectionSchema.parse(data))
  .handler(async ({ data }) => {
    const imap = new ImapFlow({
      host: data.imap_host,
      port: data.imap_port,
      secure: data.imap_secure,
      auth: {
        user: data.email_user,
        pass: data.email_password,
      },
      logger: false,
    });

    try {
      await imap.connect();
      await imap.logout();
    } catch (error: any) {
      throw new Error(`IMAP Error: ${error.message}`);
    }

    const transporter = nodemailer.createTransport({
      host: data.smtp_host,
      port: data.smtp_port,
      secure: data.smtp_secure,
      auth: {
        user: data.email_user,
        pass: data.email_password,
      },
    });

    try {
      await transporter.verify();
    } catch (error: any) {
      throw new Error(`SMTP Error: ${error.message}`);
    }

    return { success: true };
  });

export const saveEmailConfiguration = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    configId: z.string().optional(),
    configData: z.object({
      user_id: z.string(),
      imap_host: z.string(),
      imap_port: z.number(),
      imap_secure: z.boolean(),
      smtp_host: z.string(),
      smtp_port: z.number(),
      smtp_secure: z.boolean(),
      email_user: z.string(),
      destinations: z.array(z.string()),
      keywords: z.array(z.string()),
      provider: z.string(),
    }),
    emailPassword: z.string(),
  }).parse(data))
  .handler(async ({ data: { configId, configData, emailPassword } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let targetConfigId = configId;

    if (configId) {
      const { error: updateError } = await supabaseAdmin
        .from("email_configurations")
        .update(configData as any)
        .eq("id", configId);
      if (updateError) throw updateError;
    } else {
      const { data, error: insertError } = await supabaseAdmin
        .from("email_configurations")
        .insert(configData as any)
        .select("id")
        .single();
      if (insertError) throw insertError;
      targetConfigId = data.id;
    }

    if (!targetConfigId) throw new Error("Failed to get config ID");

    // Save password securely
    const { error: credsError } = await supabaseAdmin
      .from("email_credentials")
      .upsert({
        config_id: targetConfigId,
        password: emailPassword
      });
    
    if (credsError) throw credsError;

    return { success: true, id: targetConfigId };
  });

export const getActiveConfigs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_configurations")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;
    return data;
  });

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const processEmailsForConfig = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const stats = {
      imapConnected: false,
      found: 0,
      analyzed: 0,
      withCode: 0,
      forwarded: 0,
      ignored: 0,
      duplicates: 0,
      errors: 0,
      details: [] as string[]
    };

    const executionId = crypto.randomUUID();
    
    // Global Lock Attempt
    const { data: lockId, error: lockError } = await supabaseAdmin.rpc('acquire_email_config_lock', {
      p_config_id: configId,
      p_lock_timeout: '2 minutes' // Reduced TTL for testing and safety
    });

    if (lockError || !lockId) {
      // Check if it's already locked to provide a better message
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
        error: isLocked ? "Processamento: Bloqueado por outra execução" : "Locked or error acquiring lock",
        isLocked: !!isLocked,
        stats 
      };
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

      const { data: creds } = await supabaseAdmin
        .from("email_credentials")
        .select("password")
        .eq("config_id", configId)
        .single();

      if (!creds?.password) return { success: false, error: "Credentials not found" };

      const log = async (message: string, level = "info") => {
        console.log(`[Config ${configId}] ${message}`);
        await supabaseAdmin.from("email_logs").insert({
          config_id: configId,
          message,
          level
        });
      };

      const imap = new ImapFlow({
        host: config.imap_host,
        port: config.imap_port,
        secure: config.imap_secure, // Deve ser true para porta 993
        auth: {
          user: config.email_user,
          pass: creds.password,
        },
        logger: false,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
      });

      imap.on('error', (err) => {
        console.error(`[IMAP Global Error] Config ${configId}:`, err);
      });

      await log(`Execution ID criado: ${executionId}`);
      await log("Lock solicitado e adquirido no banco.");
      await log(`Iniciando conexão TCP IMAP para ${config.imap_host}:${config.imap_port}`);
      
      try {
        await log("Iniciando TLS e Handshake...");
        await imap.connect();
        await log("TLS estabelecido. Enviando autenticação...");
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
        console.error(`[IMAP Connection Error Details] Config ${configId}:`, detailedError);
        await log(`ERRO IMAP: ${connErr.message} (Etapa: ${detailedError.stage})`, "error");
        // Registro persistente do erro detalhado (sem senha)
        await supabaseAdmin.from("email_logs").insert({
          config_id: configId,
          message: `DETALHES DO ERRO: ${JSON.stringify(detailedError)}`,
          level: "error"
        });
        throw new Error(`IMAP Connection Failure: ${connErr.message}`);
      }
      
      stats.imapConnected = true;
      await log("Autenticação aceita. Abrindo INBOX...");
      
      let mailboxLock;
      try {
        mailboxLock = await imap.getMailboxLock("INBOX");
        await log("INBOX aberta. Buscando UNSEEN...");
      } catch (lockErr: any) {
        await log(`Falha ao abrir INBOX: ${lockErr.message}`, "error");
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

          // Atomic Reservation with Retry support
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
            const parsed = await simpleParser(message.source);
            const subject = parsed.subject || "";
            const from = parsed.from?.value[0]?.address || "desconhecido";
            
            // Persist Message-ID
            await supabaseAdmin.from("email_processing_state").update({
              message_id: parsed.messageId || null
            } as any).eq("config_id", configId).eq("imap_uid", imapUid);

            // Loop Protection
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
            const htmlContent = parsed.html ? convert(parsed.html) : "";
            const fullContent = normalizeText(`${subject} ${plainContent} ${htmlContent}`);

            const hasKeyword = config.keywords.some((kw: string) => {
              const normalizedKw = normalizeText(kw);
              // Regex match for the word containing the keyword anywhere
              // e.g. "codigo" matches "meucodigo", "Código123", etc.
              return fullContent.includes(normalizedKw);
            });

            if (hasKeyword) {
              stats.withCode++;
              await log(`Palavra-chave detectada no e-mail de ${from}: "${subject}"`);
              
              const transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: config.smtp_port,
                secure: config.smtp_secure,
                auth: {
                  user: config.email_user,
                  pass: creds.password,
                },
              });

              await transporter.sendMail({
                from: config.email_user,
                to: config.destinations.join(", "),
                subject: `ENC: ${subject}`,
                text: `E-mail encaminhado automaticamente.\n\nDe: ${from}\nAssunto: ${subject}\n\n[Email original anexado como rfc822]`,
                attachments: [
                  {
                    filename: 'email-original.eml',
                    content: message.source,
                    contentType: 'message/rfc822'
                  }
                ],
                headers: {
                  'X-Email-Monitor': 'processed'
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

              await imap.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
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
      } catch (logoutErr) {
        // Silently ignore logout errors as connection might already be closed
      }
      await updateHeartbeat('success');
      return { success: true, stats };
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error during processing";
      // Check if it's already locked to provide a better message
      const isLocked = errorMsg === "Processamento: Bloqueado por outra execução" || 
                       errorMsg.includes("Locked or error acquiring lock");
      
      await updateHeartbeat('error', errorMsg);
      return { success: false, error: errorMsg, isLocked, stats };
    } finally {

      // Global Lock Release
      await supabaseAdmin.rpc('release_email_config_lock', {
        p_config_id: configId,
        p_lock_id: lockId as string
      });
    }
  });

export const testImapConnectionDetailed = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startTime = Date.now();
    const result = {
      connection: "pending",
      auth: "pending",
      inbox: "pending",
      time: 0,
      error: null as string | null
    };

    try {
      const { data: config } = await supabaseAdmin
        .from("email_configurations")
        .select("*")
        .eq("id", configId)
        .single();
      
      const { data: creds } = await supabaseAdmin
        .from("email_credentials")
        .select("password")
        .eq("config_id", configId)
        .single();

      if (!config || !creds?.password) throw new Error("Configuração ou credenciais não encontradas");

      const imap = new ImapFlow({
        host: config.imap_host,
        port: config.imap_port,
        secure: config.imap_secure,
        auth: {
          user: config.email_user,
          pass: creds.password,
        },
        logger: false,
        connectionTimeout: 10000,
      });

      try {
        // Log individual do teste para diagnóstico
        console.log(`[IMAP TEST] Conectando a ${config.imap_host}:${config.imap_port} (secure: ${config.imap_secure})`);
        
        await imap.connect();
        result.connection = "ok";
        console.log(`[IMAP TEST] Conectado e autenticado.`);
        result.auth = "ok";
        
        let lock = await imap.getMailboxLock("INBOX");
        try {
          console.log(`[IMAP TEST] INBOX acessada com sucesso.`);
          result.inbox = "ok";
        } finally {
          lock.release();
        }
        
        await imap.logout();
      } catch (err: any) {
        console.error(`[IMAP TEST ERROR]`, {
          message: err.message,
          code: err.code,
          response: err.response,
          stage: result.connection === "pending" ? "connection" : (result.auth === "pending" ? "auth" : "inbox")
        });
        
        if (result.connection === "pending") result.connection = "error";
        else if (result.auth === "pending") result.auth = "error";
        else if (result.inbox === "pending") result.inbox = "error";
        throw err;
      }

      result.time = Date.now() - startTime;
      return { success: true, result };
    } catch (error: any) {
      result.time = Date.now() - startTime;
      return { success: false, error: error.message, result };
    }
  });

export const testSmtpConnectionDetailed = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startTime = Date.now();
    const result = {
      connection: "pending",
      auth: "pending",
      time: 0,
      error: null as string | null
    };

    try {
      const { data: config } = await supabaseAdmin
        .from("email_configurations")
        .select("*")
        .eq("id", configId)
        .single();
      
      const { data: creds } = await supabaseAdmin
        .from("email_credentials")
        .select("password")
        .eq("config_id", configId)
        .single();

      if (!config || !creds?.password) throw new Error("Configuração ou credenciais não encontradas");

      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.email_user,
          pass: creds.password,
        },
        connectionTimeout: 10000,
      });

      try {
        await transporter.verify();
        result.connection = "ok";
        result.auth = "ok";
      } catch (err: any) {
        // Nodemailer verify() usually fails at connection or auth
        result.connection = "error";
        result.auth = "error";
        throw err;
      }

      result.time = Date.now() - startTime;
      return { success: true, result };
    } catch (error: any) {
      result.time = Date.now() - startTime;
      return { success: false, error: error.message, result };
    }
  });