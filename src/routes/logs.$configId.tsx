import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, AlertCircle, Info, CheckCircle2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/logs/$configId")({
  component: LogsPage,
});

function LogsPage() {
  const { configId } = Route.useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConfig();
    fetchInitialLogs();

    const channel = supabase
      .channel('email_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_logs',
          filter: `config_id=eq.${configId}`,
        },
        (payload) => {
          console.log("Realtime log received:", payload.new);
          setLogs((prev) => [...prev, payload.new]);
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [configId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("email_configurations")
      .select("*")
      .eq("id", configId)
      .single();
    setConfig(data);
  };

  const fetchInitialLogs = async () => {
    const { data } = await supabase
      .from("email_logs")
      .select("*")
      .eq("config_id", configId)
      .order("created_at", { ascending: true })
      .limit(100);
    setLogs(data || []);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf8] p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            Logs em Tempo Real
          </h1>
          {config && (
            <p className="text-gray-600">
              Monitorando: <span className="font-medium text-gray-900">{config.email_user}</span>
            </p>
          )}
        </header>

        <Card className="bg-slate-950 border-slate-800 text-slate-50 font-mono text-sm shadow-2xl">
          <CardHeader className="border-b border-slate-800 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-slate-400 ml-2">monitor-session.log</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] w-full p-4" ref={scrollRef}>
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-500 italic">Aguardando eventos...</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 py-0.5 px-2 rounded">
                      <span className="text-slate-500 shrink-0">
                        [{format(new Date(log.created_at), "HH:mm:ss")}]
                      </span>
                      <span className="shrink-0 mt-0.5">{getLevelIcon(log.level)}</span>
                      <span className={log.level === 'error' ? 'text-red-400' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}