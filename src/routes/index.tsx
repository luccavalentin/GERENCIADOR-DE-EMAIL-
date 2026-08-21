import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Mail, 
  Activity, 
  History, 
  AlertCircle,
  CheckCircle2,
  Server,
  Database,
  Shield,
  ArrowRight,
  TrendingUp,
  XCircle,
  Copy
} from "lucide-react";
import { AppLayout, useActiveAccount } from "@/components/layout/AppLayout";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


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
  const { selectedConfigId } = useActiveAccount();
  const { data: session } = useQuery({ 
    queryKey: ['session'], 
    queryFn: async () => (await supabase.auth.getSession()).data.session 
  });
  
  const { data: stats } = useQuery({
    queryKey: ['stats', selectedConfigId],
    queryFn: () => getDailyStats({ data: { userId: session?.user?.id || '', configId: selectedConfigId } }),
    enabled: !!session?.user?.id
  });


  const { data: workerStatus } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 30000
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['recentLogs', selectedConfigId],
    queryFn: () => getLogs({ data: { limit: 10, configId: selectedConfigId || undefined } }),
  });

  const isWorkerOnline = workerStatus?.status === 'online';
  const isDbOnline = workerStatus?.db_status === 'online';
  
  // SMTP/IMAP logic based on actual last check results
  const hasConfigs = workerStatus?.configs && workerStatus.configs.length > 0;
  
  const imapStatus = !hasConfigs ? 'aguardando' : 
    workerStatus.configs.every((c: any) => c.status === 'success') ? 'operacional' : 
    workerStatus.configs.some((c: any) => c.status === 'error') ? 'falha' : 'operacional';
    
  const smtpStatus = !hasConfigs ? 'aguardando' : 
    workerStatus.configs.every((c: any) => c.status === 'success') ? 'operacional' : 
    workerStatus.configs.some((c: any) => c.status === 'error') ? 'falha' : 'operacional';

  const isSystemHealthy = isWorkerOnline && isDbOnline && imapStatus === 'operacional' && smtpStatus === 'operacional';
  const globalStatusLabel = isWorkerOnline ? "Worker Operacional" : "Atenção Requerida";
  const globalStatusColor = isWorkerOnline ? "text-green-600" : "text-red-600";
  const globalStatusIcon = isWorkerOnline ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />;
  const globalStatusBg = isWorkerOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Monitoramento</h1>
          <p className="text-slate-500 mt-1 font-medium">Infraestrutura e timeline operacional de e-mails.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Global</span>
            <span className={cn("text-xs font-bold", globalStatusColor)}>
              {globalStatusLabel}
            </span>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
            globalStatusBg
          )}>
            {globalStatusIcon}
          </div>
        </div>
      </div>

      {/* Infraestrutura Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Saúde da Infraestrutura</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: "Worker", status: isWorkerOnline ? 'operacional' : 'falha', icon: Activity },
            { label: "IMAP", status: imapStatus, icon: Mail },
            { label: "SMTP", status: smtpStatus, icon: Shield },
            { label: "Banco de Dados", status: isDbOnline ? 'operacional' : 'falha', icon: Database },
            { label: "VPS Hostinger", status: isWorkerOnline ? 'operacional' : 'aguardando telemetria', icon: Server },
          ].map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-[#0000A0] transition-all">
              <div className={cn(
                "p-2 rounded-lg",
                item.status === 'operacional' ? "bg-green-50 text-green-600" : 
                item.status === 'falha' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                <div className={cn(
                  "text-[10px] md:text-xs font-bold capitalize",
                  item.status === 'operacional' ? "text-slate-900" : 
                  item.status === 'falha' ? "text-red-600" : "text-slate-400"
                )}>
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Métricas Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { 
            label: "Processados hoje", 
            value: stats ? stats.found : "—", 
            icon: Mail, 
            color: "text-blue-600", 
            bg: "bg-blue-50/50" 
          },
          { 
            label: "Encaminhados", 
            value: stats ? stats.forwarded : "—", 
            icon: TrendingUp, 
            color: "text-green-600", 
            bg: "bg-green-50/50" 
          },
          { 
            label: "Ignorados", 
            value: stats ? stats.ignored : "—", 
            icon: XCircle, 
            color: "text-slate-400", 
            bg: "bg-slate-50/50" 
          },
          { 
            label: "Duplicados", 
            value: stats ? stats.duplicates : "—", 
            icon: Copy, 
            color: "text-amber-600", 
            bg: "bg-amber-50/50" 
          },
          { 
            label: "Erros", 
            value: stats ? stats.errors : "—", 
            icon: AlertCircle, 
            color: "text-red-600", 
            bg: "bg-red-50/50" 
          },
        ].map((stat, i) => (
          <Card key={i} className="premium-card group">
            <CardContent className="p-4 md:p-6">
              <div className={cn("p-3 w-fit rounded-xl mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                {stat.value === "—" ? <span className="text-slate-200">—</span> : stat.value}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Atividade Recente Section */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Atividade Recente</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Timeline operacional de eventos processados.</p>
          </div>
          <Button variant="outline" size="sm" className="text-[#0000A0] border-[#0000A0]/20 font-bold hover:bg-blue-50" asChild>
            <Link 
              to="/logs" 
              search={{ configId: selectedConfigId || undefined }}
              className="flex items-center gap-2"
            >
              Ver Histórico Completo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 hidden md:table-header-group">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[120px] font-bold text-slate-500 pl-6">Horário</TableHead>
                <TableHead className="font-bold text-slate-500">Evento / Descrição</TableHead>
                <TableHead className="w-[120px] text-right font-bold text-slate-500 pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs?.logs?.length ? recentLogs.logs.map((log: any) => (
                <TableRow key={log.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100 md:table-row flex flex-col p-4 md:p-0">
                  <TableCell className="text-xs text-slate-400 font-mono pl-6 md:table-cell flex justify-between items-center w-full md:w-[120px]">
                    <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[10px]">Horário</span>
                    {log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "--:--:--"}
                  </TableCell>
                  <TableCell className="py-2 md:py-4 md:table-cell block">
                    <div className="text-sm font-semibold text-slate-900 leading-none mb-1">
                      {log.message.split(' - ')[0] || "Processamento"}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[600px]">
                      {log.message.includes(' - ') ? log.message.split(' - ').slice(1).join(' - ') : log.message}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 md:table-cell flex justify-between items-center w-full md:w-[120px]">
                    <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</span>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter rounded-md border-none",
                        log.level === 'error' ? "bg-red-50 text-red-600" : 
                        log.level === 'success' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      )}
                    >
                      {log.level || 'info'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (

                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <History className="h-8 w-8" />
                      <p className="text-xs font-bold uppercase tracking-widest">Aguardando dados...</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>

  );
}