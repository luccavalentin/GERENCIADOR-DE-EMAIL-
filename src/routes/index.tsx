import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { AppLayout, useActiveAccount } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { getDailyStats, getWorkerStatus, getLogs } from "@/lib/email.functions";
import { InfrastructureHealth } from "@/components/dashboard/InfrastructureHealth";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SystemStats, LogEntry } from "@/lib/types";

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
  }) as { data: SystemStats | undefined };

  const { data: workerStatus } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 30000
  });

  const { data: recentLogsData } = useQuery({
    queryKey: ['recentLogs', selectedConfigId],
    queryFn: () => getLogs({ data: { limit: 10, configId: selectedConfigId || undefined } }),
  });

  const recentLogs = recentLogsData?.logs as LogEntry[] | undefined;

  const isWorkerOnline = workerStatus?.status === 'online';
  const isDbOnline = workerStatus?.db_status === 'online';
  const hasConfigs = workerStatus?.configs && workerStatus.configs.length > 0;
  
  const imapStatus = !hasConfigs ? 'aguardando' : 
    workerStatus.configs.every((c: any) => c.status === 'success') ? 'operacional' : 
    workerStatus.configs.some((c: any) => c.status === 'error') ? 'falha' : 'operacional';
    
  const smtpStatus = !hasConfigs ? 'aguardando' : 
    workerStatus.configs.every((c: any) => c.status === 'success') ? 'operacional' : 
    workerStatus.configs.some((c: any) => c.status === 'error') ? 'falha' : 'operacional';

  const globalStatusLabel = isWorkerOnline ? "Worker Operacional" : "Atenção Requerida";
  const globalStatusColor = isWorkerOnline ? "text-green-600" : "text-red-600";
  const globalStatusIcon = isWorkerOnline ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />;
  const globalStatusBg = isWorkerOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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

      <InfrastructureHealth 
        isWorkerOnline={isWorkerOnline}
        isDbOnline={isDbOnline}
        imapStatus={imapStatus}
        smtpStatus={smtpStatus}
      />

      <StatCards stats={stats} />
      
      <RecentActivity logs={recentLogs} />
    </div>
  );
}
