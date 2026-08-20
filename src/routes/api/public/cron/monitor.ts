import { createFileRoute } from "@tanstack/react-router";
import { getActiveConfigs, processEmailsForConfig } from "@/lib/email.functions";

export const Route = createFileRoute("/api/public/cron/monitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = request.headers.get("x-cron-secret");
        const serverSecret = process.env["EMAIL_MONITOR_CRON_SECRET"];
        
        if (!serverSecret || cronSecret !== serverSecret) {
           return new Response("Unauthorized", { status: 401 });
        }

        console.log("Starting cron monitor...");
        try {
          const configs = await (getActiveConfigs as any)();
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