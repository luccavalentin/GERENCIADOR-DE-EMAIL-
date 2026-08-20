import { createFileRoute } from "@tanstack/react-router";
import { 
  Activity, 
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { getLogs, getWorkerStatus } from "@/lib/email.functions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/monitoring")({
  component: () => (
    <AppLayout>
      <MonitoringPage />
    </AppLayout>
  ),
});

function MonitoringPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ["monitoringLogs"],
    queryFn: () => getLogs({ data: { limit: 100 } }),
  });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_logs'
        },
        () => {
          refetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchLogs]);

  const { data: workerStatus } = useQuery({
    queryKey: ["workerStatus"],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 10000
  });

  const isOnline = workerStatus?.status === 'online';

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
          <p className="text-slate-500 mt-1">Visão operacional em tempo real dos logs do sistema.</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold uppercase text-xs transition-all",
          isOnline ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        )}>
          <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
          <span>{workerStatus?.message || "Buscando status..."}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200 bg-[#000033] text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(0,0,160,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,160,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10 bg-white/5 backdrop-blur-sm relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#4D4DFF]">
              Console Agilliza / Eventos
            </CardTitle>
            <Activity className="h-4 w-4 text-[#4D4DFF] animate-pulse" />
          </CardHeader>
          <CardContent 
            ref={scrollRef}
            className="p-4 relative z-10 font-mono text-xs leading-relaxed h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 bg-black/20"
          >
            <div className="space-y-1">
              {logsData?.logs?.slice().reverse().map((log: any) => (
                <div key={log.id} className={cn(
                  "flex gap-2",
                  log.level === 'error' ? "text-red-400" : 
                  log.level === 'success' ? "text-green-400" : "text-blue-300"
                )}>
                  <span className="text-white/30 shrink-0">
                    [{log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "--:--:--"}]
                  </span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}

              {!logsData?.logs?.length && (
                <div className="text-white/30 italic">Aguardando eventos do sistema...</div>
              )}

              <div className="text-[#4D4DFF] animate-pulse mt-4">
                &gt; Monitorando...
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Status da VPS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0000A0]" />
                  <span className="text-sm font-semibold truncate max-w-[120px]">{workerStatus?.hostname || "VPS Hostinger"}</span>
                </div>
                <Badge className={cn(
                  isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {workerStatus?.status?.toUpperCase() || "OFFLINE"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Uptime</span>
                  <span className="text-sm font-medium">{workerStatus?.uptime || "Indisponível"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Heartbeat</span>
                  <span className="text-sm font-medium">
                    {workerStatus?.last_heartbeat ? format(new Date(workerStatus.last_heartbeat), "HH:mm:ss") : "Indisponível"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Métricas Reais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">CPU Usage</span>
                  <span className="font-bold">{workerStatus?.cpu_usage !== undefined ? `${workerStatus.cpu_usage}%` : "Aguardando..."}</span>
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
                  <span className="font-bold">{workerStatus?.ram_usage !== undefined ? `${workerStatus.ram_usage}%` : "Aguardando..."}</span>
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