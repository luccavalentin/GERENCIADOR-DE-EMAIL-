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
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-slate-50/30">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Fluxo de Processamento</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] flex items-center justify-center text-slate-400 italic">
              Gráfico de volumetria em tempo real (Emails monitorados vs Encaminhados)
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
