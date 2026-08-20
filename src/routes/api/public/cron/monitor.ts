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
        // TEMPORARILY DISABLED FOR MANUAL TESTING
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Cron monitor is TEMPORARILY DISABLED for manual testing phase." 
        }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
