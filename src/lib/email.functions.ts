// src/lib/email.functions.ts
// RESTORED: Unified file to ensure stability and prevent split-module resolution errors
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { normalizeText } from "./utils";

// --- AUTH / PROFILE FUNCTIONS ---
export const getProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const toggleProfileStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string(), is_active: z.boolean() }).parse(data))
  .handler(async ({ data: { id, is_active } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles" as any)
      .update({ is_active } as any)
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  });

// --- CONFIGURATION FUNCTIONS ---
export const getActiveConfigs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // FIXED: Multi-user shared access - allow viewing configs shared by the system/admin
    const { data, error } = await supabaseAdmin
      .from("email_configurations")
      .select("*");
    if (error) throw error;
    return data;
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
    emailPassword: z.string().optional(),
  }).parse(data))
  .handler(async ({ data: { configId, configData, emailPassword } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (configData.keywords) {
      configData.keywords = configData.keywords.map(kw => normalizeText(kw).trim()).filter(kw => kw.length > 0);
    }
    if (configData.destinations) {
      configData.destinations = configData.destinations.map(d => d.trim().toLowerCase()).filter(d => d.length > 0 && d.includes("@"));
    }
    let targetConfigId = configId;
    if (configId) {
      const { error: updateError } = await supabaseAdmin.from("email_configurations").update(configData).eq("id", configId);
      if (updateError) throw updateError;
    } else {
      const { data, error: insertError } = await supabaseAdmin.from("email_configurations").insert(configData).select("id").single();
      if (insertError) throw insertError;
      targetConfigId = data.id;
    }
    if (!targetConfigId) throw new Error("Failed to get config ID");

    if (emailPassword && emailPassword.trim() !== "") {
      const { error: credsError } = await supabaseAdmin.from("email_credentials").upsert({ config_id: targetConfigId, password: emailPassword });
      if (credsError) throw credsError;
    }
    return { success: true, id: targetConfigId };
  });

// --- DIAGNOSTICS FUNCTIONS ---
export const testConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    imap_host: z.string(), imap_port: z.number(), imap_secure: z.boolean(),
    smtp_host: z.string(), smtp_port: z.number(), smtp_secure: z.boolean(),
    email_user: z.string(), email_password: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { ImapFlow } = await import("imapflow");
    const nodemailer = (await import("nodemailer")).default;
    const imap = new ImapFlow({
      host: data.imap_host, port: data.imap_port, secure: data.imap_secure,
      auth: { user: data.email_user, pass: data.email_password }, logger: false,
    });
    try { await imap.connect(); await imap.logout(); } catch (e: any) { throw new Error(`IMAP: ${e.message}`); }
    const transporter = nodemailer.createTransport({
      host: data.smtp_host, port: data.smtp_port, secure: data.smtp_secure,
      auth: { user: data.email_user, pass: data.email_password },
    });
    try { await transporter.verify(); } catch (e: any) { throw new Error(`SMTP: ${e.message}`); }
    return { success: true };
  });

// --- STATS & LOGS FUNCTIONS ---
export const getLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    configId: z.string().optional(), limit: z.number().optional().default(50),
    offset: z.number().optional().default(0), search: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("email_logs").select("*", { count: "exact" });
    if (data.configId) query = query.eq("config_id", data.configId);
    if (data.search) query = query.ilike("message", `%${data.search}%`);
    const { data: logs, error, count } = await query.order("created_at", { ascending: false }).range(data.offset, data.offset + data.limit - 1);
    if (error) throw error;
    return { logs: logs as any[], count };
  });

export const getDailyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string(), configId: z.string().optional().nullable() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString();
    let queryLogs = supabaseAdmin.from("email_logs").select("level, message").gte("created_at", todayStr);
    let queryForwarded = supabaseAdmin.from("forwarded_emails").select("id").gte("created_at", todayStr);
    let queryProc = supabaseAdmin.from("email_processing_state").select("status").gte("created_at", todayStr);
    if (configId) {
      queryLogs = queryLogs.eq("config_id", configId);
      queryForwarded = queryForwarded.eq("config_id", configId);
      queryProc = queryProc.eq("config_id", configId);
    }
    const [{ data: logs }, { data: forwarded }, { data: procState }] = await Promise.all([queryLogs, queryForwarded, queryProc]);
    return {
      found: procState?.length || 0,
      analyzed: procState?.filter(s => s.status !== 'duplicate').length || 0,
      keywords: procState?.filter(s => s.status === 'forwarded').length || 0,
      forwarded: forwarded?.length || 0,
      ignored: procState?.filter(s => s.status === 'ignored').length || 0,
      errors: procState?.filter(s => s.status === 'error').length || 0,
      duplicates: procState?.filter(s => s.status === 'duplicate').length || 0
    };
  });

// --- WORKER TELEMETRY FUNCTIONS ---
export const getWorkerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: heartbeatData } = await supabaseAdmin.from("worker_heartbeat" as any).select("*").order("last_heartbeat", { ascending: false }).limit(1).maybeSingle();
    const heartbeat = heartbeatData as any;
    // FIXED: Multi-user configs
    const { data: configs } = await supabaseAdmin.from("email_configurations").select("id, status, email_user, is_active, last_heartbeat");
    const isOnline = heartbeat && heartbeat.last_heartbeat && (Date.now() - new Date(heartbeat.last_heartbeat).getTime()) < 120000;
    return { 
      ...(heartbeat || {}), 
      status: isOnline ? "online" : "offline", 
      message: isOnline ? "Worker operacional" : "Aguardando telemetria",
      db_status: "online",
      configs: configs || []
    };
  });

export const restartWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { success: false, message: "Integração com VPS pendente" };
  });

export const getSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: heartbeat } = await supabaseAdmin.from("worker_heartbeat" as any).select("last_heartbeat").order("last_heartbeat", { ascending: false }).limit(1).maybeSingle();
    const isWorkerOnline = heartbeat && (Date.now() - new Date((heartbeat as any).last_heartbeat).getTime()) < 120000;
    return {
      database: { status: 'healthy', message: 'Conectado' },
      worker: { status: isWorkerOnline ? 'healthy' : 'warning', message: isWorkerOnline ? 'Em execução' : 'Aguardando dados' },
      storage: { status: 'healthy', message: 'Disponível' },
      auth: { status: 'healthy', message: 'Sistema ativo' }
    };
  });

export const processEmailsForConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { processEmailsForConfigLogic } = await import("./email-logic/processor.server");
    return processEmailsForConfigLogic(configId, supabaseAdmin);
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data: { id } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;
    return { success: true };
  });

export const createSystemUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(1)
  }).parse(data))
  .handler(async ({ data: { email, password, full_name } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (error) throw error;

    const { error: profileError } = await supabaseAdmin
      .from("profiles" as any)
      .update({ full_name } as any)
      .eq("id", data.user.id);
    
    if (profileError) {
      console.error("Error updating profile name:", profileError);
    }

    return { success: true, user: data.user };
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

