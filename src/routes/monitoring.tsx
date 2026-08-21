import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  Pause,
  Trash2,
  Play,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { getLogs, getWorkerStatus } from "@/lib/email.functions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { LogConsole } from "@/components/monitoring/LogConsole";
import { LogEntry } from "@/lib/types";

export const Route = createFileRoute("/monitoring")({
  component: () => (
    <AppLayout>
      <MonitoringPage />
    </AppLayout>
  ),
});

function MonitoringPage() {
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

  const handleClear = () => {
    if (logsData?.logs) {
      const newHidden = new Set(hiddenLogs);
      logsData.logs.forEach((log: any) => newHidden.add(log.id));
      setHiddenLogs(newHidden);
    }
  };

  const visibleLogs = (logsData?.logs?.filter((log: any) => !hiddenLogs.has(log.id)) || []) as LogEntry[];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoramento ao Vivo</h1>
          <p className="text-slate-500 mt-1 font-medium">Console operacional de eventos do sistema.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start sm:justify-end">
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
            className={cn("h-8 text-[10px] font-bold uppercase tracking-widest transition-colors", isPaused && "bg-blue-50 border-blue-200 text-[#0000a2]")}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <LogConsole logs={visibleLogs} autoScroll={autoScroll} />
          <div className="mt-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="autoscroll" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-300 text-[#0000a2] focus:ring-[#0000a2]"
            />
            <label htmlFor="autoscroll" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer">
              Auto-scroll Habilitado
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-slate-400">Infraestrutura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0000a2]" />
                  <span className="text-sm font-semibold truncate max-w-[120px]">{workerStatus?.hostname || "Servidor Central"}</span>
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
                  <span className="text-sm font-medium">{workerStatus?.uptime || "Aguardando dados"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Heartbeat</span>
                  <span className="text-sm font-medium">
                    {workerStatus?.last_heartbeat ? format(new Date(workerStatus.last_heartbeat), "HH:mm:ss") : "Aguardando dados"}
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
                    role="progressbar"
                    aria-valuenow={workerStatus?.cpu_usage || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
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
                    role="progressbar"
                    aria-valuenow={workerStatus?.ram_usage || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
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
