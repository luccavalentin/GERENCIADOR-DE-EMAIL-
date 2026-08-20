import { createFileRoute } from "@tanstack/react-router";
import { getActiveConfigs, processEmailsForConfig } from "@/lib/email.functions";

export const Route = createFileRoute("/api/public/cron/monitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Simple apikey check
        const authHeader = request.headers.get("apikey");
        const publishableKey = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
        
        if (authHeader !== publishableKey && authHeader !== "sb_publishable_9klNiYfipDaAaS5soluiKg_7KA199Mv" && authHeader !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJid2luYmdkeWdvYm90a3ZwaGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzg3NzQsImV4cCI6MjEwMjgxNDc3NH0.E3TkqILiVGSbs2v9dyUMGEkUv1wQOfHJXCwVQqjoQDs") {
           return new Response("Unauthorized", { status: 401 });
        }

        console.log("Starting cron monitor...");
        try {
          const configs = await getActiveConfigs();
          console.log(`Processing ${configs?.length || 0} active configurations`);

          const results = [];
          for (const config of configs || []) {
            try {
              const res = await (processEmailsForConfig as any)({ data: { configId: config.id } });
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
