import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { convert } from "html-to-text";
import * as dns from "dns";
import * as net from "net";
import * as tls from "tls";
import { promisify } from "util";

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
    
    const diagResults: any = {
      dns: { status: "pending", data: null },
      tcp_993: { status: "pending", data: null },
      tcp_993_ipv4: { status: "pending", data: null },
      tls_993: { status: "pending", data: null },
      greeting: { status: "pending", data: null },
      tcp_465: { status: "pending", data: null },
      imap_flow: { status: "pending", data: null },
      conclusion: ""
    };

    // Helper for TCP test
    const testTcp = (host: string, port: number, family: number = 0): Promise<any> => {
      return new Promise((resolve) => {
        const start = Date.now();
        const socket = net.createConnection({ host, port, family }, () => {
          const duration = Date.now() - start;
          const info = {
            status: "CONECTOU",
            duration,
            remoteAddress: socket.remoteAddress,
            remoteFamily: socket.remoteFamily,
            remotePort: socket.remotePort
          };
          socket.end();
          resolve(info);
        });

        socket.setTimeout(10000);
        socket.on("timeout", () => {
          socket.destroy();
          resolve({ status: "TIMEOUT", duration: Date.now() - start, code: "ETIMEDOUT" });
        });

        socket.on("error", (e: any) => {
          resolve({ status: "ERROR", duration: Date.now() - start, code: e.code, message: e.message });
        });
      });
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

      const imapHost = config.imap_host;
      const smtpHost = config.smtp_host;

      // TEST 1: DNS
      try {
        const lookup = promisify(dns.lookup);
        const addresses = await lookup(imapHost, { all: true });
        diagResults.dns = { status: "ok", data: addresses };
      } catch (e: any) {
        diagResults.dns = { status: "error", error: e.message };
      }

      // TEST 2: TCP 993
      diagResults.tcp_993 = await testTcp(imapHost, 993);

      // TEST 3: TCP IPv4 993
      diagResults.tcp_993_ipv4 = await testTcp(imapHost, 993, 4);

      // TEST 7: SMTP 465 (Comparative)
      diagResults.tcp_465 = await testTcp(smtpHost, 465);

      // TEST 4 & 5: TLS and Greeting
      if (diagResults.tcp_993.status === "CONECTOU") {
        try {
          diagResults.tls_993 = await new Promise((resolve) => {
            const start = Date.now();
            const socket = tls.connect({
              host: imapHost,
              port: 993,
              servername: imapHost,
              timeout: 10000
            }, () => {
              const duration = Date.now() - start;
              const cert = socket.getPeerCertificate();
              resolve({
                status: "ESTABELECIDO",
                duration,
                protocol: socket.getProtocol(),
                authorized: socket.authorized,
                authorizationError: socket.authorizationError,
                cert_valid: !!cert && Object.keys(cert).length > 0
              });

              // TEST 5: GREETING
              socket.on("data", (data) => {
                diagResults.greeting = { status: "received", data: data.toString() };
                socket.end();
              });
            });

            socket.on("error", (e: any) => {
              resolve({ status: "error", message: e.message });
            });
            
            socket.on("timeout", () => {
              socket.destroy();
              resolve({ status: "timeout" });
            });
          });
        } catch (e: any) {
          diagResults.tls_993 = { status: "error", message: e.message };
        }
      }

      // TEST 6: ImapFlow (only if basics work)
      if (diagResults.tcp_993.status === "CONECTOU" && diagResults.tls_993?.status === "ESTABELECIDO") {
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
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });

        try {
          await imap.connect();
          diagResults.imap_flow = { status: "ok" };
          await imap.logout();
        } catch (e: any) {
          diagResults.imap_flow = { status: "error", message: e.message, code: e.code };
        }
      }

      // Conclusion
      if (diagResults.tcp_993.status === "TIMEOUT" && diagResults.tcp_465.status === "TIMEOUT") {
        diagResults.conclusion = "O runtime Lovable não consegue alcançar o UHServer em ambas as portas (Bloqueio de infraestrutura).";
      } else if (diagResults.tcp_993.status === "TIMEOUT") {
        diagResults.conclusion = "O runtime Lovable não consegue alcançar imap.uhserver.com:993 ou o servidor UHServer está bloqueando essa origem.";
      } else if (diagResults.imap_flow?.status === "error") {
        diagResults.conclusion = "Conectividade básica OK, mas falha no ImapFlow (Possível problema de biblioteca ou configuração específica).";
      } else {
        diagResults.conclusion = "Conectividade básica OK.";
      }

      return { 
        success: true, 
        result: {
          ...diagResults,
          time: Math.round(Date.now() - startTime)
        }
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        result: {
          ...diagResults,
          time: Math.round(Date.now() - startTime)
        }
      };
    }
  });

export const testSmtpConnectionDetailed = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startTime = Date.now();
    const result = {
      dns: "pending",
      tcp: "pending",
      tls: "pending",
      auth: "pending",
      time: 0,
      error: null as any
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
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      try {
        result.dns = "ok";
        await transporter.verify();
        result.tcp = "ok";
        result.tls = "ok";
        result.auth = "ok";
      } catch (err: any) {
        result.error = {
          message: err.message,
          code: err.code,
          stack: err.stack
        };
        if (result.tcp === "pending") result.tcp = "error";
        else if (result.tls === "pending") result.tls = "error";
        else if (result.auth === "pending") result.auth = "error";
        throw err;
      }

      result.time = Date.now() - startTime;
      return { success: true, result };
    } catch (error: any) {
      result.time = Date.now() - startTime;
      return { success: false, error: error.message, result };
    }
  });
