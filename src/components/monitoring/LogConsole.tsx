import { useRef, useEffect } from "react";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from "@/lib/types";

interface LogConsoleProps {
  logs: LogEntry[];
  autoScroll?: boolean;
}

export function LogConsole({ logs, autoScroll = true }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <Card className="premium-card bg-slate-900 text-slate-100 overflow-hidden relative border-none shadow-xl ring-1 ring-slate-800">
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
        className="p-4 md:p-6 relative z-10 font-mono text-[10px] md:text-[11px] leading-loose h-[400px] md:h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 bg-transparent"
      >
        <div className="space-y-2">
          {logs.slice().reverse().map((log) => (
            <div key={log.id} className="flex flex-col md:flex-row gap-1 md:gap-4 group hover:bg-white/5 transition-colors p-2 md:p-1 rounded border-b border-white/5 md:border-none">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-500 select-none">
                  {log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "--:--:--"}
                </span>
                <span className={cn(
                  "font-bold uppercase tracking-tighter w-16 text-center rounded px-1 text-[9px]",
                  log.level === 'error' ? "text-red-400 bg-red-400/10" : 
                  log.level === 'success' ? "text-green-500 bg-green-500/10" : 
                  log.level === 'warning' ? "text-yellow-500 bg-yellow-500/10" : 
                  "text-slate-400 bg-slate-800"
                )}>
                  {log.level || 'INFO'}
                </span>
              </div>
              <span className={cn(
                "break-all",
                log.level === 'error' ? "text-red-200" : 
                log.level === 'success' ? "text-green-300" : "text-slate-200"
              )}>
                {log.message}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-slate-700 italic flex items-center gap-2 py-20 justify-center flex-col uppercase tracking-widest text-[10px] font-bold">
              <Activity className="h-8 w-8 opacity-10 animate-pulse" />
              Aguardando telemetria...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
