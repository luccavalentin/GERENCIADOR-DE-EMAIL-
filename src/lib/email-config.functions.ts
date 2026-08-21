import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { normalizeText } from "./utils";

export const getActiveConfigs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_configurations")
      .select("*")
      .eq("user_id", context.userId);

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
      configData.keywords = configData.keywords
        .map(kw => normalizeText(kw).trim())
        .filter(kw => kw.length > 0);
    }
    
    if (configData.destinations) {
      configData.destinations = configData.destinations
        .map(d => d.trim().toLowerCase())
        .filter(d => d.length > 0 && d.includes("@"));
    }
    
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

    if (emailPassword && emailPassword.trim() !== "") {
      const { error: credsError } = await supabaseAdmin
        .from("email_credentials")
        .upsert({
          config_id: targetConfigId,
          password: emailPassword
        });
      
      if (credsError) throw credsError;
    }

    return { success: true, id: targetConfigId };
  });

export const processEmailsForConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ configId: z.string() }).parse(data))
  .handler(async ({ data: { configId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { processEmailsForConfigLogic } = await import("./email-logic/processor.server");
    return processEmailsForConfigLogic(configId, supabaseAdmin);
  });
