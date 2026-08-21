import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string(), email: z.string().email() }).parse(data))
  .handler(async ({ data: { email } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });
    if (error) throw error;
    return { success: true };
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
