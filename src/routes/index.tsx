import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Activity, 
  History, 
  Server,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: DashboardPageWithLayout,
});

function DashboardPageWithLayout() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Contas Ativas", value: "12", icon: Mail, color: "text-blue-600" },
          { label: "E-mails Processados", value: "1,240", icon: Activity, color: "text-green-600" },
          { label: "Logs de Erro", value: "3", icon: History, color: "text-red-600" },
          { label: "Uptime do Servidor", value: "99.9%", icon: Server, color: "text-indigo-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className={cn("p-3 bg-slate-50 rounded-lg", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Monitoramento em Tempo Real</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg mt-6 text-slate-400">
          Visualização de dados (logs/gráficos) futura
        </div>
      </div>
    </div>
  );
}
