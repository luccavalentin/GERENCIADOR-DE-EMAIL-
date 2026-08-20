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
    
    const { data: config, error: configError } = await supabaseAdmin
      .from("email_configurations")
      .select("*")
      .eq("id", configId)
      .single();

    if (configError || !config) return { success: false, error: "Config not found" };

    const log = async (message: string, level = "info") => {
      console.log(`[Config ${configId}] ${message}`);
      await supabaseAdmin.from("email_logs").insert({
        config_id: configId,
        message,
        level
      });
    };

    const updateHeartbeat = async (status: string, errorMsg?: string) => {
      await supabaseAdmin.from("email_configurations").update({
        last_heartbeat: new Date().toISOString(),
        last_check_at: new Date().toISOString(),
        status,
        last_error: errorMsg || null,
        ...(status === 'success' ? { last_success_at: new Date().toISOString() } : {})
      }).eq("id", configId);
    };

    const imap = new ImapFlow({
      host: config.imap_host,
      port: config.imap_port,
      secure: config.imap_secure,
      auth: {
        user: config.email_user,
        pass: config.email_password,
      },
      logger: false,
    });

    try {
      await imap.connect();
      await log("Conectado ao IMAP. Verificando novos e-mails...");

      let lock = await imap.getMailboxLock("INBOX");
      try {
        // Fetch only UNSEEN emails
        const fetchOptions = { seen: false };
        const fetchQuery = { envelope: true, source: true, uid: true, flags: true };

        for await (let message of imap.fetch(fetchOptions, fetchQuery)) {
          if (!message.envelope || !message.source || !message.uid) continue;

          const imapUid = BigInt(message.uid);
          const mailbox = "INBOX";

          // 1. Atomic Reservation (Deduplication)
          const { data: reserved, error: reserveError } = await supabaseAdmin.rpc('reserve_email_for_processing', {
            p_config_id: configId,
            p_mailbox: mailbox,
            p_imap_uid: imapUid
          });

          if (reserveError || !reserved) {
            // Already processing or processed
            continue;
          }

          try {
            // 2. Parse Email properly
            const parsed = await simpleParser(message.source);
            const subject = parsed.subject || "";
            const from = parsed.from?.value[0]?.address || "desconhecido";
            
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

            // Regex for keyword matching: \w*codigo\w*
            const hasKeyword = config.keywords.some((kw: string) => {
              const normalizedKw = normalizeText(kw);
              const regex = new RegExp(`\\w*${normalizedKw}\\w*`, 'i');
              return regex.test(fullContent);
            });

            if (hasKeyword) {
              await log(`Palavra-chave detectada no e-mail de ${from}: "${subject}"`);
              
              const transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: config.smtp_port,
                secure: config.smtp_secure,
                auth: {
                  user: config.email_user,
                  pass: config.email_password,
                },
              });

              // 3. Send via SMTP with original email attached as .eml
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

              // 4. Register Success in DB
              await supabaseAdmin.from("forwarded_emails").insert({
                config_id: configId,
                original_subject: subject,
                original_from: from,
              });

              await supabaseAdmin.from("email_processing_state").update({ 
                status: 'forwarded',
                forwarded_at: new Date().toISOString()
              }).eq("config_id", configId).eq("imap_uid", imapUid);

              // 5. Mark as Seen ONLY after success
              await imap.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
              await log(`E-mail encaminhado com sucesso para ${config.destinations.join(", ")}`, "success");
            } else {
              await supabaseAdmin.from("email_processing_state").update({ status: 'ignored' }).eq("config_id", configId).eq("imap_uid", imapUid);
            }
          } catch (msgError: any) {
            await log(`Erro no processamento individual (UID ${message.uid}): ${msgError.message}`, "error");
            await supabaseAdmin.from("email_processing_state").update({ 
              status: 'error',
              last_error: msgError.message
            }).eq("config_id", configId).eq("imap_uid", imapUid);
          }
        }
      } finally {
        lock.release();
      }

      await imap.logout();
      await updateHeartbeat('success');
      return { success: true };
    } catch (error: any) {
      await log(`Erro ao processar e-mails: ${error.message}`, "error");
      await updateHeartbeat('error', error.message);
      return { success: false, error: error.message };
    }
  });