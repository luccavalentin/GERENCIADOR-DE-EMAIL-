import { createFileRoute } from "@tanstack/react-router";
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/monitoring")({
  component: () => (
    <AppLayout>
      <MonitoringPage />
    </AppLayout>
  ),
});

function MonitoringPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Status de Monitoramento</h1>
          <p className="text-slate-500 mt-1">Visão operacional em tempo real de todos os trabalhadores.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-green-700 uppercase">Sistema Operacional</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200 bg-[#000033] text-white overflow-hidden relative group">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,0,160,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,160,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10 bg-white/5 backdrop-blur-sm relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#4D4DFF]">
              Console Agilliza / Monitoramento Matricial
            </CardTitle>
            <Activity className="h-4 w-4 text-[#4D4DFF] animate-pulse" />
          </CardHeader>
          <CardContent className="p-4 relative z-10 font-mono text-xs leading-relaxed h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
            <div className="space-y-1">
              <div className="text-white/40 mb-2 border-b border-white/10 pb-1">
                [SISTEMA AGILLIZA INICIALIZADO - AGUARDANDO FLUXO]
              </div>
              <div className="text-green-400">
                <span className="text-white/30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                Verificando integridade dos canais...
              </div>
              <div className="text-green-400">
                <span className="text-white/30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                Monitor ativo. Escutando eventos IMAP/SMTP.
              </div>
              <div className="text-[#4D4DFF] animate-pulse mt-4">
                &gt; Próximo ciclo de varredura agendado...
              </div>
              
              {/* Estilo Matrix / Terminal */}
              <div className="mt-8 text-white/20 italic">
                Aguardando nova execução para renderização de logs amigáveis...
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Worker Status (VPS)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold">Agilliza-Node-Worker-01</span>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Running</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Uptime</span>
                  <span className="text-sm font-medium">12d 4h 32m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Last Heartbeat</span>
                  <span className="text-sm font-medium">Agora mesmo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Eficiência Operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Taxa de Sucesso</span>
                <span className="text-sm font-bold text-green-600">99.8%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[99.8%]" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>1,240 Sucedidos</span>
                <span>2 Falhas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
