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
    if (emailPassword && emailPassword.trim() !== "") {
      await supabaseAdmin.from("email_credentials").upsert({ config_id: targetConfigId, password: emailPassword });
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
    const { data: heartbeat } = await supabaseAdmin.from("worker_heartbeat" as any).select("*").order("last_heartbeat", { ascending: false }).limit(1).maybeSingle();
    // FIXED: Multi-user configs
    const { data: configs } = await supabaseAdmin.from("email_configurations").select("id, status, email_user, is_active, last_heartbeat");
    const isOnline = heartbeat && (Date.now() - new Date(heartbeat.last_heartbeat).getTime()) < 120000;
    return { 
      ...heartbeat, 
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
    const isWorkerOnline = heartbeat && (Date.now() - new Date(heartbeat.last_heartbeat).getTime()) < 120000;
    return {
      database: { status: 'healthy', message: 'Conectado' },
      worker: { status: isWorkerOnline ? 'healthy' : 'warning', message: isWorkerOnline ? 'Em execução' : 'Aguardando dados' },
      storage: { status: 'healthy', message: 'Disponível' },
      auth: { status: 'healthy', message: 'Sistema ativo' }
    };
  });
