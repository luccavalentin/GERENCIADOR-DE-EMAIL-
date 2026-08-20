import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  ShieldCheck,
  Pause,
  Trash2,
  Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { getLogs, getWorkerStatus } from "@/lib/email.functions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/monitoring")({
  component: () => (
    <AppLayout>
      <MonitoringPage />
    </AppLayout>
  ),
});

function MonitoringPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hiddenLogs, setHiddenLogs] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);

  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ["monitoringLogs"],
    queryFn: () => getLogs({ data: { limit: 100 } }),
    enabled: !isPaused
  });

  useEffect(() => {
    if (isPaused) return;

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
  }, [refetchLogs, isPaused]);

  const { data: workerStatus } = useQuery({
    queryKey: ["workerStatus"],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 10000
  });

  const isOnline = workerStatus?.status === 'online';

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logsData, autoScroll]);

  const handleClear = () => {
    if (logsData?.logs) {
      const newHidden = new Set(hiddenLogs);
      logsData.logs.forEach((log: any) => newHidden.add(log.id));
      setHiddenLogs(newHidden);
    }
  };

  const visibleLogs = logsData?.logs?.filter((log: any) => !hiddenLogs.has(log.id)) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central Operacional</h1>
          <p className="text-slate-500 mt-1">Logs em tempo real visualmente sofisticados.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold uppercase text-[10px] tracking-widest transition-all",
            isOnline ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}>
            <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span>{isOnline ? "AO VIVO" : "OFFLINE"}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn("h-8 text-[10px] font-bold uppercase tracking-widest transition-colors", isPaused && "bg-blue-50 border-blue-200 text-[#0000A0]")}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="mr-2 h-3 w-3" /> : <Pause className="mr-2 h-3 w-3" />}
            {isPaused ? "Retomar" : "Pausar"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] font-bold uppercase tracking-widest"
            onClick={handleClear}
          >
            <Trash2 className="mr-2 h-3 w-3" /> Limpar Visualização
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 premium-card bg-slate-900 text-slate-100 overflow-hidden relative border-none shadow-xl ring-1 ring-slate-800">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Console Operacional / Eventos Reais
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <Activity className="h-4 w-4 text-slate-500 opacity-50" />
            </div>
          </CardHeader>
          <CardContent 
            ref={scrollRef}
            className="p-6 relative z-10 font-mono text-[11px] leading-loose h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 bg-transparent"
          >
            <div className="space-y-2">
              {visibleLogs.slice().reverse().map((log: any) => (
                <div key={log.id} className="flex gap-4 group hover:bg-white/5 transition-colors p-1 rounded">
                  <span className="text-white/20 shrink-0 select-none">
                    {log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "--:--:--"}
                  </span>
                  <span className={cn(
                    "font-bold uppercase tracking-tighter shrink-0 w-16 text-center rounded px-1",
                    log.level === 'error' ? "text-red-400 bg-red-400/10" : 
                    log.level === 'success' ? "text-green-400 bg-green-400/10" : 
                    log.level === 'warning' ? "text-yellow-400 bg-yellow-400/10" : 
                    "text-slate-400 bg-slate-800"
                  )}>
                    {log.level || 'INFO'}
                  </span>
                  <span className={cn(
                    "break-all",
                    log.level === 'error' ? "text-red-200" : 
                    log.level === 'success' ? "text-green-300" : "text-slate-200"
                  )}>
                    {log.message}
                  </span>
                </div>
              ))}

              {!logsData?.logs?.length && (
                <div className="text-slate-700 italic flex items-center gap-2 py-20 justify-center flex-col uppercase tracking-widest text-[10px] font-bold">
                  <Activity className="h-8 w-8 opacity-10 animate-pulse" />
                  Aguardando telemetria...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="premium-card">
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

          <Card className="premium-card">
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