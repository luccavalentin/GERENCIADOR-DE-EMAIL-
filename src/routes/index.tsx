import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Mail, 
  Activity, 
  History, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDailyStats, getWorkerStatus, getLogs } from "@/lib/email.functions";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

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
  const { data: session } = useQuery({ 
    queryKey: ['session'], 
    queryFn: async () => (await supabase.auth.getSession()).data.session 
  });
  
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => getDailyStats({ data: { userId: session?.user?.id || '' } }),
    enabled: !!session?.user?.id
  });

  const { data: workerStatus } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 30000
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['recentLogs'],
    queryFn: () => getLogs({ data: { limit: 10 } }),
  });

  const isOnline = workerStatus?.status === 'online';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Painel Operacional</h1>
          <p className="text-slate-500 mt-1">Visão geral da infraestrutura e processamento Agilliza.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase",
            isOnline ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}>
            {isOnline ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {workerStatus?.message || "Aguardando dados..."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Mensagens Hoje", 
            value: stats ? stats.found : "...", 
            icon: Mail, 
            color: "text-blue-600", 
            bg: "bg-blue-50" 
          },
          { 
            label: "Palavras-Chave", 
            value: stats ? stats.keywords : "...", 
            icon: Activity, 
            color: "text-green-600", 
            bg: "bg-green-50" 
          },
          { 
            label: "Encaminhadas", 
            value: stats ? stats.forwarded : "...", 
            icon: History, 
            color: "text-[#0000A0]", 
            bg: "bg-slate-50" 
          },
          { 
            label: "Erros", 
            value: stats ? stats.errors : "...", 
            icon: AlertCircle, 
            color: "text-red-600", 
            bg: "bg-red-50" 
          },
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
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Últimos Encaminhamentos</h3>
          <Button variant="ghost" size="sm" className="text-[#0000A0] font-bold" asChild>
            <a href="/logs">Ver tudo</a>
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Horário</TableHead>
              <TableHead>Assunto / Mensagem</TableHead>
              <TableHead>Nível</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLogs?.logs?.length ? recentLogs.logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "-"}
                </TableCell>
                <TableCell className="text-sm truncate max-w-[500px]">{log.message}</TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[10px] capitalize",
                      log.level === 'error' ? "bg-red-50 text-red-700" : 
                      log.level === 'success' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                    )}
                  >
                    {log.level || 'info'}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-slate-400 text-xs italic">
                  {recentLogs ? "Nenhuma atividade recente encontrada." : "Carregando atividade..."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}