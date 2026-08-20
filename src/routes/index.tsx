import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Mail, 
  Activity, 
  History, 
  Server,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDailyStats, getWorkerStatus, getLogs } from "@/lib/email.functions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    queryFn: () => getLogs({ data: { limit: 5 } }),
  });

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
            workerStatus?.status === 'online' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}>
            {workerStatus?.status === 'online' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {workerStatus?.message || "Carregando..."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Mensagens Hoje", value: stats?.found || 0, icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Palavras-Chave", value: stats?.keywords || 0, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
          { label: "Encaminhadas", value: stats?.forwarded || 0, icon: History, color: "text-[#0000A0]", bg: "bg-slate-50" },
          { label: "Erros", value: stats?.errors || 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Últimos Encaminhamentos</h3>
            <Button variant="ghost" size="sm" className="text-[#0000A0] font-bold">Ver tudo</Button>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs?.logs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-500 font-mono">{format(new Date(log.created_at), "HH:mm:ss")}</TableCell>
                  <TableCell className="text-sm">{log.message.substring(0, 30)}...</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">OK</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Requisitos de Evolução Agilliza</h3>
          <div className="font-mono text-[10px] leading-relaxed text-slate-400 max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="text-green-400 opacity-80 mb-2">// Especificações Técnicas e Funcionais</div>
            {`MONITORAMENTO AO VIVO
Exibir uma interface semelhante a console profissional.
18:42:01  Worker ativo
18:42:02  Conectando IMAP...

STATUS DO WORKER
Indicador permanente no topo:
🟢 Sistema operacional
🟡 Atenção
🔴 Worker offline

DASHBOARD OPERACIONAL
Indicadores reais: Sistema, IMAP, SMTP, Supabase.
Tabela de encaminhamentos real.

TELA DE LOGS
Atualização automática, filtros avançados.
Timeline de execução.`}
          </div>
        </div>
      </div>
    </div>
  );
}
