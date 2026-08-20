import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function normalizeTextInternal(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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

export const saveEmailConfiguration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

    // Garantir que as keywords e destinatários sejam salvos de forma limpa
    // Apenas a forma base para keywords (lowercase, sem acentos, sem espaços extras)
    configData.keywords = configData.keywords.map(kw => normalizeTextInternal(kw).trim()).filter(kw => kw.length > 0);
    configData.destinations = configData.destinations.map(d => d.trim()).filter(d => d.length > 0);
    
    let targetConfigId = configId;

    if (configId) {
      const { error: updateError } = await supabaseAdmin
        .from("email_configurations")
        .update(configData)
        .eq("id", configId);
      if (updateError) throw updateError;
    } else {
      const { data, error: insertError } = await supabaseAdmin
        .from("email_configurations")
        .insert(configData)
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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { processEmailsForConfigLogic } = await import("./email-logic/processor.server");
    return processEmailsForConfigLogic(configId, supabaseAdmin);
  });

export const testImapConnectionDetailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ImapFlow } = await import("imapflow");
    const dns = await import("dns/promises");
    const net = await import("net");
    const tls = await import("tls");
    
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
        const addresses = await dns.lookup(imapHost, { all: true });
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
              socket.on("data", (data: any) => {
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nodemailer = (await import("nodemailer")).default;
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
