import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    configId: z.string().optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
    level: z.string().optional(),
    executionId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    clearView: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: userConfigs } = await supabaseAdmin
      .from("email_configurations")
      .select("id")
      .eq("user_id", context.userId);
    
    const configIds = userConfigs?.map(c => c.id) || [];
    
    let query = supabaseAdmin
      .from("email_logs")
      .select("*", { count: "exact" });

    if (data.configId) {
      if (!configIds.includes(data.configId)) {
        throw new Error("Unauthorized: Config not found");
      }
      query = query.eq("config_id", data.configId);
    } else {
      query = query.in("config_id", configIds);
    }

    if (data.level && data.level !== 'all') query = query.eq("level", data.level);
    if (data.executionId) query = query.eq("execution_id" as any, data.executionId);
    if (data.startDate) query = query.gte("created_at", data.startDate);
    if (data.endDate) query = query.lte("created_at", data.endDate);
    if (data.search) query = query.ilike("message", `%${data.search}%`);

    const { data: logs, error, count } = await query
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (error) throw error;
    return { logs: logs as any[], count };
  });

export const getDailyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string(), configId: z.string().optional().nullable() }).parse(data))
  .handler(async ({ data: { userId, configId }, context }) => {
    if (userId !== context.userId) {
      throw new Error("Unauthorized");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString();

    let configIds = (await supabaseAdmin
      .from("email_configurations")
      .select("id")
      .eq("user_id", userId))
      .data?.map(c => c.id) || [];
      
    if (configId) {
      if (!configIds.includes(configId)) {
        throw new Error("Unauthorized: Config not found");
      }
      configIds = [configId];
    }

    const { data: logs } = await supabaseAdmin
      .from("email_logs")
      .select("level, message")
      .in("config_id", configIds)
      .gte("created_at", todayStr);

    const { data: forwarded } = await supabaseAdmin
      .from("forwarded_emails")
      .select("id")
      .in("config_id", configIds)
      .gte("created_at", todayStr);

    const { data: procState } = await supabaseAdmin
      .from("email_processing_state")
      .select("status")
      .in("config_id", configIds)
      .gte("created_at", todayStr);

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
