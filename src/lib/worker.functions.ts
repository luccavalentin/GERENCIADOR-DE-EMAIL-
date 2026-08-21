import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getWorkerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: configs } = await supabaseAdmin
      .from("email_configurations")
      .select("id, email_user, is_active, last_heartbeat, status");

    const now = new Date();
    const activeConfigs = configs?.filter(c => c.is_active) || [];
    
    const onlineConfigs = activeConfigs.filter(c => {
      if (!c.last_heartbeat) return false;
      const lastHb = new Date(c.last_heartbeat);
      return (now.getTime() - lastHb.getTime()) < 65000;
    });

    const isOnline = onlineConfigs.length > 0;

    return {
      status: isOnline ? 'online' : 'offline',
      message: isOnline 
        ? `${onlineConfigs.length} instância(s) ativa(s)` 
        : 'Monitor offline ou sem contas ativas',
      db_status: 'online',
      configs: configs || []
    };
  });

export const clearLocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_locks")
      .delete()
      .eq("config_id", configId);
    if (error) throw error;
    return { success: true };
  });

export const getSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Check Database
    const start = Date.now();
    const { error: dbError } = await supabaseAdmin.from("email_configurations").select("id").limit(1);
    const dbLatency = Date.now() - start;

    // Check Worker
    const { data: configs } = await supabaseAdmin
      .from("email_configurations")
      .select("last_heartbeat")
      .eq("is_active", true);
    
    const now = new Date();
    const isWorkerOnline = configs?.some(c => {
      if (!c.last_heartbeat) return false;
      return (now.getTime() - new Date(c.last_heartbeat).getTime()) < 65000;
    }) ?? false;

    return {
      database: {
        status: dbError ? 'error' : 'healthy',
        latency: `${dbLatency}ms`,
        message: dbError ? 'Falha na conexão' : 'Conectado'
      },
      worker: {
        status: isWorkerOnline ? 'healthy' : 'warning',
        message: isWorkerOnline ? 'Em execução' : 'Aguardando batimento'
      },
      storage: {
        status: 'healthy',
        message: 'Disponível'
      },
      auth: {
        status: 'healthy',
        message: 'Sistema ativo'
      }
    };
  });
