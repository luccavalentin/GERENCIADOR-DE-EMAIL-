import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Activity, 
  History, 
  Server,
  Shield,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Painel Operacional</h1>
          <p className="text-slate-500 mt-1">Visão geral da infraestrutura e processamento Agilliza.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white border-blue-100 text-[#0000A0] font-bold py-1 px-3">
            v2.0 Production
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Contas Ativas", value: "Ativas", icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Processamento", value: "24h/7d", icon: Activity, color: "text-green-600", bg: "bg-green-50" },
          { label: "Integridade", value: "100%", icon: History, color: "text-[#0000A0]", bg: "bg-slate-50" },
          { label: "Servidor VPS", value: "Online", icon: Server, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#0000A0] transition-all">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className={cn("p-3 rounded-lg transition-colors", stat.bg, stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0000A0]" />
                Monitoramento Operacional
              </h2>
              <Button variant="ghost" size="sm" className="text-[#0000A0] font-bold">Ver tudo</Button>
            </div>
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 text-slate-400 gap-3">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Server className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm font-medium">Aguardando fluxo de telemetria da VPS...</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Requisitos de Normalização Determinística</h3>
            <div className="font-mono text-[10px] leading-relaxed text-slate-400 max-h-[200px] overflow-y-auto custom-scrollbar">
              <div className="text-green-400 opacity-80 mb-2">// Módulo de Identificação Inteligente v2.0</div>
              {`8. VARIAÇÕES DA PALAVRA "CÓDIGO"
Normalização automática baseada em Unicode NFD.
Matches confirmados:
- codigo, Código, CÓDIGO, código, codigos, códigos...
- meucodigo, codigo123, seu código é 123456...

Lógica: Lowercase + NFD Strip + Substring Search.`}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Últimos Eventos</h3>
            <div className="space-y-4">
              {[
                { type: 'success', msg: 'Worker conectado com sucesso', time: '2m atrás' },
                { type: 'info', msg: 'Nova conta monitorada adicionada', time: '1h atrás' },
                { type: 'success', msg: 'Normalização de keywords aplicada', time: '3h atrás' },
              ].map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-1.5 shrink-0",
                    event.type === 'success' ? "bg-green-500" : "bg-blue-500"
                  )} />
                  <div>
                    <p className="text-xs font-medium text-slate-700">{event.msg}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0000A0] p-6 rounded-xl shadow-lg text-white relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Shield className="h-24 w-24" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Segurança Agilliza</h3>
            <p className="text-2xl font-bold mt-2">100%</p>
            <p className="text-xs mt-1 opacity-70">Privacidade & Criptografia</p>
            <Button className="w-full mt-6 bg-white text-[#0000A0] hover:bg-blue-50 font-bold text-xs h-8">
              Auditar Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


