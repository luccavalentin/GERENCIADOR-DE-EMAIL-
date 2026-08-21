import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => connectionSchema.parse(data))
  .handler(async ({ data }) => {
    const { ImapFlow } = await import("imapflow");
    const nodemailer = (await import("nodemailer")).default;

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

export const testImapConnectionDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ImapFlow } = await import("imapflow");
    const dns = await import("dns/promises");
    const net = await import("net");

    type DiagnosticStep = { step: string; status: 'pending' | 'success' | 'error'; details?: string };
    const steps: DiagnosticStep[] = [];
    
    try {
      const { data: config } = await supabaseAdmin
        .from("email_configurations")
        .select("*")
        .eq("id", configId)
        .single();
        
      if (!config) throw new Error("Config not found");
      
      const { data: creds } = await supabaseAdmin
        .from("email_credentials")
        .select("password")
        .eq("config_id", configId)
        .single();
        
      if (!creds) throw new Error("Credentials not found");

      // 1. DNS Lookup
      const dnsStep: DiagnosticStep = { step: "Resolução DNS", status: 'pending' };
      steps.push(dnsStep);
      try {
        const addresses = await dns.resolve4(config.imap_host);
        dnsStep.status = 'success';
        dnsStep.details = `Resolvido para: ${addresses.join(', ')}`;
      } catch (err: any) {
        dnsStep.status = 'error';
        dnsStep.details = `Erro DNS: ${err.message}`;
        return { success: false, steps };
      }

      // 2. TCP Connectivity
      const tcpStep: DiagnosticStep = { step: "Conexão TCP", status: 'pending' };
      steps.push(tcpStep);
      try {
        await new Promise((resolve, reject) => {
          const socket = net.createConnection(config.imap_port, config.imap_host, () => {
            socket.end();
            resolve(true);
          });
          socket.setTimeout(5000);
          socket.on('error', reject);
          socket.on('timeout', () => reject(new Error("Timeout de conexão TCP")));
        });
        tcpStep.status = 'success';
      } catch (err: any) {
        tcpStep.status = 'error';
        tcpStep.details = `Erro TCP: ${err.message}`;
        return { success: false, steps };
      }

      // 3. IMAP Auth
      const authStep: DiagnosticStep = { step: "Autenticação IMAP", status: 'pending' };
      steps.push(authStep);
      const imap = new ImapFlow({
        host: config.imap_host,
        port: config.imap_port,
        secure: config.imap_secure,
        auth: {
          user: config.email_user,
          pass: creds.password,
        },
        logger: false,
        clientInfo: { name: 'Agilliza Diagnostics' }
      });

      try {
        await imap.connect();
        await imap.logout();
        authStep.status = 'success';
      } catch (err: any) {
        authStep.status = 'error';
        authStep.details = `Erro IMAP: ${err.message}`;
        return { success: false, steps };
      }

      return { success: true, steps };
    } catch (error: any) {
      return { success: false, error: error.message, steps };
    }
  });

export const testSmtpConnectionDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nodemailer = (await import("nodemailer")).default;
    const dns = await import("dns/promises");

    type DiagnosticStep = { step: string; status: 'pending' | 'success' | 'error'; details?: string };
    const steps: DiagnosticStep[] = [];
    
    try {
      const { data: config } = await supabaseAdmin
        .from("email_configurations")
        .select("*")
        .eq("id", configId)
        .single();
        
      if (!config) throw new Error("Config not found");
      
      const { data: creds } = await supabaseAdmin
        .from("email_credentials")
        .select("password")
        .eq("config_id", configId)
        .single();
        
      if (!creds) throw new Error("Credentials not found");

      // 1. DNS Lookup
      const dnsStep: DiagnosticStep = { step: "Resolução DNS", status: 'pending' };
      steps.push(dnsStep);
      try {
        const addresses = await dns.resolve4(config.smtp_host);
        dnsStep.status = 'success';
        dnsStep.details = `Resolvido para: ${addresses.join(', ')}`;
      } catch (err: any) {
        dnsStep.status = 'error';
        dnsStep.details = `Erro DNS: ${err.message}`;
        return { success: false, steps };
      }

      // 2. SMTP Auth
      const authStep: DiagnosticStep = { step: "Autenticação SMTP", status: 'pending' };
      steps.push(authStep);
      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.email_user,
          pass: creds.password,
        },
        connectionTimeout: 10000
      });

      try {
        await transporter.verify();
        authStep.status = 'success';
      } catch (err: any) {
        authStep.status = 'error';
        authStep.details = `Erro SMTP: ${err.message}`;
        return { success: false, steps };
      }

      return { success: true, steps };
    } catch (error: any) {
      return { success: false, error: error.message, steps };
    }
  });
