import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";

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
    // 1. Test IMAP
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

    // 2. Test SMTP
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
        for await (let message of imap.fetch({ seen: false }, { envelope: true, source: true })) {
          if (!message.envelope || !message.source) continue;

          const subject = message.envelope.subject || "";
          const from = message.envelope.from?.[0]?.address || "desconhecido";
          const bodyText = message.source.toString().toLowerCase();

          const hasKeyword = config.keywords.some((kw: string) => bodyText.includes(kw.toLowerCase()));

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

            await transporter.sendMail({
              from: config.email_user,
              to: config.destinations.join(", "),
              subject: `ENC: ${subject}`,
              text: `E-mail encaminhado automaticamente.\n\nDe: ${from}\nAssunto: ${subject}\n\nCorpo:\n${bodyText}`,
            });

            await supabaseAdmin.from("forwarded_emails").insert({
              config_id: configId,
              original_subject: subject,
              original_from: from,
            });

            await log(`E-mail encaminhado com sucesso para ${config.destinations.join(", ")}`, "success");
          }
        }
      } finally {
        lock.release();
      }

      await imap.logout();
      return { success: true };
    } catch (error: any) {
      await log(`Erro ao processar e-mails: ${error.message}`, "error");
      return { success: false, error: error.message };
    }
  });
