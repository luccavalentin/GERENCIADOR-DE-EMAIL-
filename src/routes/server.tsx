import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Server, Cpu, HardDrive, ShieldCheck, RefreshCcw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkerStatus, restartWorker } from "@/lib/email.functions";
import { cn } from "@/lib/utils";

import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/server")({
  component: () => (
    <AppLayout>
      <ServerPage />
    </AppLayout>
  ),
});

function ServerPage() {
  const queryClient = useQueryClient();
  const [isRestarting, setIsRestarting] = useState(false);

  const { data: workerStatus, isLoading } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 10000
  });

  const restartMutation = useMutation({
    mutationFn: () => restartWorker({}),
    onSuccess: () => {
      setIsRestarting(true);
      toast.success("Solicitação de reinício enviada");
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['workerStatus'] });
        setIsRestarting(false);
      }, 5000);
    },
    onError: () => {
      toast.error("Erro ao solicitar reinício");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000A0]"></div>
      </div>
    );
  }

  const isOnline = workerStatus?.status === 'online';
  const cpu = workerStatus?.cpu_usage;
  const ram = workerStatus?.ram_usage;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Infraestrutura do Servidor</h1>
          <p className="text-slate-500 mt-1">Monitoramento de hardware e recursos da VPS Hostinger.</p>
        </div>
        <div className="flex gap-2">
          {isOnline && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-[#0000A0] border-[#0000A0]/20 hover:bg-blue-50 font-bold" disabled={isRestarting}>
                  <RefreshCcw className={cn("mr-2 h-4 w-4", isRestarting && "animate-spin")} />
                  {isRestarting ? "Reiniciando..." : "Reiniciar Worker"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja reiniciar o worker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação interromperá o processamento atual de e-mails. O worker tentará retornar automaticamente em seguida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => restartMutation.mutate()} className="bg-[#0000A0]">Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Badge variant="outline" className={cn("font-bold", isOnline ? "text-green-600 border-green-200 bg-green-50" : "text-slate-400 border-slate-200 bg-slate-50")}>
            <ShieldCheck className="w-3 h-3 mr-1" /> {isOnline ? "Protegido" : "Offline"}
          </Badge>
        </div>
      </div>

      {!isOnline && !isLoading && (
        <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <Server className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Aguardando integração com VPS</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            As métricas de hardware e botões de comando estarão disponíveis assim que o worker estabelecer conexão.
          </p>
        </div>
      )}

      {isOnline && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-500">Uso de CPU</CardTitle>
              <Cpu className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cpu !== undefined ? `${cpu}%` : "---"}</div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${cpu || 0}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">{workerStatus?.hostname || "VPS Hostinger"}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-500">Memória RAM</CardTitle>
              <HardDrive className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ram !== undefined ? `${ram}%` : "---"}</div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3">
                <div className="bg-indigo-500 h-full transition-all" style={{ width: `${ram || 0}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">Uso percentual reportado</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-500">Uptime Worker</CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workerStatus?.uptime || "Indisponível"}</div>
              <div className="flex gap-2 mt-4">
                <Badge variant="outline" className="text-[10px] font-bold text-green-600 border-green-200 bg-green-50">
                  🟢 ONLINE
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isOnline && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server className="h-5 w-5 text-slate-900" />
            <h2 className="font-bold text-slate-900">Processos Operacionais</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <div className="font-semibold text-sm text-slate-900">agilliza-worker-core</div>
                  <div className="text-xs text-slate-500">Node.js Engine</div>
                </div>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Versão</span>
                  <span className="text-xs font-medium">{workerStatus?.worker_version || "---"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-xs font-medium uppercase">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
