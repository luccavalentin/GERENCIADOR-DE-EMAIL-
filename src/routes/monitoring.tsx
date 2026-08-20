import { createFileRoute } from "@tanstack/react-router";
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  BarChart3,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { getLogs, getWorkerStatus } from "@/lib/email.functions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/monitoring")({
  component: () => (
    <AppLayout>
      <MonitoringPage />
    </AppLayout>
  ),
});

function MonitoringPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: logsData } = useQuery({
    queryKey: ["monitoringLogs"],
    queryFn: () => getLogs({ data: { limit: 50 } }),
    refetchInterval: 5000
  });

  const { data: workerStatus } = useQuery({
    queryKey: ["workerStatus"],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 10000
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logsData]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Status de Monitoramento</h1>
          <p className="text-slate-500 mt-1">Visão operacional em tempo real de todos os trabalhadores.</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold uppercase text-xs transition-all",
          workerStatus?.status === 'online' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        )}>
          <div className={cn("h-2 w-2 rounded-full", workerStatus?.status === 'online' ? "bg-green-500 animate-pulse" : "bg-red-500")} />
          <span>{workerStatus?.message || "Buscando status..."}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200 bg-[#000033] text-white overflow-hidden relative group">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,0,160,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,160,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10 bg-white/5 backdrop-blur-sm relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#4D4DFF]">
              Console Agilliza / Monitoramento Real
            </CardTitle>
            <Activity className="h-4 w-4 text-[#4D4DFF] animate-pulse" />
          </CardHeader>
          <CardContent 
            ref={scrollRef}
            className="p-4 relative z-10 font-mono text-xs leading-relaxed h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 bg-black/20"
          >
            <div className="space-y-1">
              <div className="text-white/40 mb-2 border-b border-white/10 pb-1">
                [SISTEMA AGILLIZA - CONSOLE OPERACIONAL]
              </div>
              
              {logsData?.logs?.slice().reverse().map((log: any) => (
                <div key={log.id} className={cn(
                  "flex gap-2",
                  log.level === 'error' ? "text-red-400" : 
                  log.level === 'success' ? "text-green-400" : "text-blue-300"
                )}>
                  <span className="text-white/30 shrink-0">[{format(new Date(log.created_at), "HH:mm:ss")}]</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}

              <div className="text-[#4D4DFF] animate-pulse mt-4">
                &gt; Escutando eventos...
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
                  <ShieldCheck className="h-4 w-4 text-[#0000A0]" />
                  <span className="text-sm font-semibold truncate max-w-[120px]">{workerStatus?.hostname || "Agilliza-Worker"}</span>
                </div>
                <Badge className={cn(
                  workerStatus?.status === 'online' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {workerStatus?.status?.toUpperCase() || "OFFLINE"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Uptime</span>
                  <span className="text-sm font-medium">{workerStatus?.uptime || "-"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Heartbeat</span>
                  <span className="text-sm font-medium">
                    {workerStatus?.last_heartbeat ? format(new Date(workerStatus.last_heartbeat), "HH:mm:ss") : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Métricas do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">CPU Usage</span>
                  <span className="font-bold">{workerStatus?.cpu_usage || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-1000" 
                    style={{ width: `${workerStatus?.cpu_usage || 0}%` }} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">RAM Usage</span>
                  <span className="font-bold">{workerStatus?.ram_usage || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-1000" 
                    style={{ width: `${workerStatus?.ram_usage || 0}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
