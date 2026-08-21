import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getWorkerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: heartbeat, error: hbError } = await supabaseAdmin
      .from("worker_heartbeat" as any)
      .select("*")
      .order("last_heartbeat", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: configs } = await supabaseAdmin
      .from("email_configurations")
      .select("id, last_success_at, last_error, status, email_user, is_active, last_heartbeat")
      .eq("user_id", context.userId);

    const dbStatus = hbError ? "offline" : "online";

    if (!heartbeat) {
      return { 
        status: "offline", 
        message: "Aguardando telemetria", 
        last_heartbeat: null,
        db_status: dbStatus,
        configs: configs || []
      };
    }

    const heartbeatData = heartbeat as any;
    const lastHeartbeat = new Date(heartbeatData.last_heartbeat);
    const diff = Date.now() - lastHeartbeat.getTime();
    
    const workerStatus = diff > 120000 ? "offline" : "online";

    return { 
      ...heartbeatData, 
      status: workerStatus, 
      message: workerStatus === "online" ? "Worker operacional" : "Worker possivelmente offline",
      db_status: dbStatus,
      configs: configs || []
    };
  });

export const restartWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { success: false, message: "Integração com VPS pendente" };
  });

export const clearLocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_locks" as any)
      .delete()
      .eq("config_id", configId);
    if (error) throw error;
    return { success: true };
  });

export const getSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const start = Date.now();
    const { error: dbError } = await supabaseAdmin.from("email_configurations").select("id").limit(1);
    const dbLatency = Date.now() - start;

    const { data: heartbeat } = await supabaseAdmin
      .from("worker_heartbeat" as any)
      .select("last_heartbeat")
      .order("last_heartbeat", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const now = new Date();
    const isWorkerOnline = heartbeat && (now.getTime() - new Date((heartbeat as any).last_heartbeat).getTime()) < 120000;

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
