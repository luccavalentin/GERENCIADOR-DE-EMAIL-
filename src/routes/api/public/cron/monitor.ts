import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getActiveConfigs, processEmailsForConfig } from "@/lib/email.functions";

export const Route = createFileRoute("/api/public/cron/monitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Simple apikey check
        const authHeader = request.headers.get("apikey");
        if (authHeader !== process.env.VITE_SUPABASE_PUBLISHABLE_KEY && authHeader !== "sb_publishable_9klNiYfipDaAaS5soluiKg_7KA199Mv") {
           return new Response("Unauthorized", { status: 401 });
        }

        console.log("Starting cron monitor...");
        try {
          // In a real app, this would use the server function directly or a shared utility
          const configs = await getActiveConfigs();
          console.log(`Processing ${configs?.length || 0} active configurations`);

          const results = [];
          for (const config of configs || []) {
            try {
              const res = await processEmailsForConfig({ data: { configId: config.id } });
              results.push({ id: config.id, success: res.success });
            } catch (err: any) {
              results.push({ id: config.id, success: false, error: err.message });
            }
          }

          return new Response(JSON.stringify({ success: true, results }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
