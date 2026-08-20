import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/monitor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = request.headers.get("x-cron-secret");
        const serverSecret = process.env["EMAIL_MONITOR_CRON_SECRET"];
        
        if (!serverSecret || cronSecret !== serverSecret) {
           return new Response("Unauthorized", { status: 401 });
        }

        console.log("Starting cron monitor check...");
        const { getActiveConfigs, processEmailsForConfig } = await import("@/lib/email.functions");
        
        try {
          const configs = await getActiveConfigs();
          console.log(`Cron found ${configs.length} active configs.`);
          
          const results = [];
          for (const config of configs) {
            console.log(`Cron processing config: ${config.id} (${config.email_user})`);
            const result = await processEmailsForConfig({ data: { configId: config.id } });
            results.push({ id: config.id, success: result.success, stats: result.stats, error: result.error });
          }

          return new Response(JSON.stringify({ 
            success: true, 
            processed: results.length,
            results
          }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Cron monitor error:", error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
