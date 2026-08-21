import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Pause, 
  RefreshCcw, 
  Activity,
  Terminal,
  Clock,
  AlertCircle,
  CheckCircle2,
  Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWorkerStatus, getLogs, updateWorkerState, waitForWorkerState } from "@/lib/email.functions";
import { LogEntry, WorkerStatus } from "@/lib/types";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function MonitorPage() {
  const queryClient = useQueryClient();
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [operationState, setOperationState] = useState<{
    command: 'pause' | 'start' | 'restart' | null;
    status: 'idle' | 'requesting' | 'waiting' | 'success' | 'error';
  }>({ command: null, status: 'idle' });

  // 1. Worker Status (Real-time polling)
  const { data: workerStatus } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 5000
  }) as { data: WorkerStatus | undefined };

  // 2. Real Logs (Real-time Subscription + Polling)
  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ["monitorLogs"],
    queryFn: () => getLogs({ data: { limit: 100 } }),
    refetchInterval: 10000
  });

  useEffect(() => {
    const channel = supabase
      .channel('monitor-logs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_logs' },
        () => { refetchLogs(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchLogs]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logsData?.logs, autoScroll]);

  const controlMutation = useMutation({
    mutationFn: async (command: 'pause' | 'start' | 'restart') => {
      setOperationState({ command, status: 'requesting' });
      const { requestId } = await updateWorkerState({ data: { command } });
      
      setOperationState({ command, status: 'waiting' });
      
      const expectedStatus = command === 'pause' ? 'paused' : 'running';
      const result = await waitForWorkerState({ 
        data: { 
          requestId, 
          expectedStatus,
          timeoutMs: command === 'restart' ? 60000 : 30000 
        } 
      });

      if (!result.success) throw new Error(result.error || result.message || "Operação expirou");
      return result;
    },
    onSuccess: (_, command) => {
      const labels = { pause: 'pausado', start: 'iniciado', restart: 'reiniciado' };
      toast.success(`Monitor ${labels[command]} com sucesso`);
      setOperationState({ command: null, status: 'idle' });
      queryClient.invalidateQueries({ queryKey: ['workerStatus'] });
    },
    onError: (error: any, command) => {
      toast.error(`Falha ao ${command}: ${error.message}`);
      setOperationState({ command: null, status: 'idle' });
    }
  });

  const status = workerStatus?.status || 'offline';
  const isOnline = status === 'online';
  const isPaused = status === 'paused';
  const isPending = operationState.status !== 'idle';

  const logs = (logsData?.logs || []) as LogEntry[];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Topo: Branding & Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#0000a2] p-1.5 rounded-lg shadow-blue-900/20 shadow-lg">
              <img src="/logo-agilliza.png" alt="" className="h-5 w-auto brightness-0 invert" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0000a2]">Agilliza</h2>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Monitor de E-mail</h1>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status do Monitor</span>
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full border-2 font-black text-xs tracking-wider transition-all shadow-sm",
            isOnline ? "bg-green-50 border-green-200 text-green-700" : 
            isPaused ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
            status === 'offline' ? "bg-slate-50 border-slate-200 text-slate-500" :
            "bg-red-50 border-red-200 text-red-700"
          )}>
            <div className={cn(
              "h-2.5 w-2.5 rounded-full",
              isOnline ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
              isPaused ? "bg-yellow-500" : "bg-slate-300"
            )} />
            <span>
              {isOnline ? "EM EXECUÇÃO" : 
               isPaused ? "PAUSADO" : 
               status === 'offline' ? "PARADO / DESCONECTADO" : "ERRO DE CONEXÃO"}
            </span>
          </div>
        </div>
      </div>

      {/* Controles Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button 
            variant="default" 
            className="bg-[#0000a2] hover:bg-[#000082] text-white font-black text-xs px-6 h-11 shadow-lg shadow-blue-900/10 active:scale-95 transition-all disabled:opacity-50"
            disabled={isOnline || isPending}
            onClick={() => controlMutation.mutate('start')}
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            INICIAR MONITORAMENTO
          </Button>

          <Button 
            variant="outline" 
            className="border-slate-200 text-slate-600 font-black text-xs px-6 h-11 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            disabled={(!isOnline && !isPaused) || isPending}
            onClick={() => controlMutation.mutate('pause')}
          >
            <Pause className="mr-2 h-4 w-4 fill-current" />
            PARAR MONITORAMENTO
          </Button>

          <Button 
            variant="outline" 
            className="border-blue-100 text-[#0000a2] font-black text-xs px-6 h-11 hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50"
            disabled={isPending}
            onClick={() => controlMutation.mutate('restart')}
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", operationState.command === 'restart' && "animate-spin")} />
            REINICIAR
          </Button>
        </div>

        <Link 
          to="/settings"
          className="flex items-center justify-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#0000a2] hover:text-[#0000a2] transition-all group font-black text-xs text-slate-600"
        >
          <SettingsIcon className="h-4 w-4 group-hover:rotate-45 transition-transform" />
          CONFIGURAÇÕES
        </Link>
      </div>

      {/* Processamento em Tempo Real */}
      <div className="flex flex-col bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden ring-1 ring-white/5">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Processamento em Tempo Real
            </h3>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Última Atividade:</span>
                <span className="text-[10px] font-mono text-slate-300">
                  {workerStatus?.last_heartbeat ? format(new Date(workerStatus.last_heartbeat), "HH:mm:ss") : "--:--:--"}
                </span>
             </div>
             <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="autoscroll-monitor" 
                checked={autoScroll} 
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-[#0000a2] focus:ring-[#0000a2] h-3 w-3"
              />
              <label htmlFor="autoscroll-monitor" className="text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                Auto-scroll
              </label>
            </div>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="h-[500px] md:h-[650px] overflow-y-auto p-6 font-mono text-[11px] md:text-[12px] selection:bg-blue-500/30 scrollbar-thin scrollbar-thumb-white/10"
        >
          <div className="space-y-1">
            {logs.slice().reverse().map((log) => (
              <div key={log.id} className="flex gap-4 group hover:bg-white/5 transition-colors px-2 py-0.5 rounded">
                <span className="text-slate-600 shrink-0 select-none">
                  {log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "--:--:--"}
                </span>
                
                <span className={cn(
                  "font-black uppercase w-14 shrink-0",
                  log.level === 'error' ? "text-red-500" : 
                  log.level === 'success' ? "text-green-500" : 
                  log.level === 'warning' ? "text-yellow-500" : 
                  "text-blue-400"
                )}>
                  {log.level === 'success' ? 'OK' : (log.level || 'INFO').toUpperCase()}
                </span>

                <span className={cn(
                  "break-words flex-1",
                  log.level === 'error' ? "text-red-200" : 
                  log.level === 'success' ? "text-green-200" : 
                  "text-slate-300"
                )}>
                  {log.message}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <Activity className="h-10 w-10 text-slate-800 animate-pulse" />
                <p className="text-slate-700 font-black uppercase tracking-[0.2em] text-[10px]">
                  Aguardando sinal do monitor...
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-900/30 border-t border-white/5 flex justify-between items-center">
            <div className="flex gap-4">
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Conexão IMAP: <span className={cn(isOnline ? "text-green-600" : "text-slate-500")}>{isOnline ? "ESTABELECIDA" : "OFFLINE"}</span></span>
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Conexão SMTP: <span className={cn(isOnline ? "text-green-600" : "text-slate-500")}>{isOnline ? "ESTABELECIDA" : "OFFLINE"}</span></span>
            </div>
            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Agilliza Engine v2.0.4</span>
        </div>
      </div>
    </div>
  );
}
