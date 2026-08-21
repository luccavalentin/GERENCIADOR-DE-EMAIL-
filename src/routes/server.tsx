import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Server, Cpu, HardDrive, Shield, RefreshCcw, Clock, Activity, Database, Mail, Power, AlertCircle, PlayCircle, PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkerStatus, updateWorkerState, waitForWorkerState } from "@/lib/email.functions";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";


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
import { createFileRoute as createTanstackFileRoute } from "@tanstack/react-router";

export const Route = createTanstackFileRoute("/server")({
  component: () => (
    <AppLayout>
      <ServerPage />
    </AppLayout>
  ),
});

function ServerPage() {
  const queryClient = useQueryClient();
  const [operationState, setOperationState] = useState<{
    command: 'pause' | 'start' | 'restart' | null;
    status: 'idle' | 'requesting' | 'waiting' | 'success' | 'error';
    message?: string;
  }>({ command: null, status: 'idle' });

  const { data: workerStatus, isLoading } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: operationState.status === 'idle' ? 10000 : 2000
  });

  const controlMutation = useMutation({
    mutationFn: async (command: 'pause' | 'start' | 'restart') => {
      setOperationState({ command, status: 'requesting' });
      const { requestId } = await updateWorkerState({ data: { command } });
      
      setOperationState({ command, status: 'waiting', message: `Solicitação enviada. Aguardando worker...` });
      
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
      toast.success(`Serviço ${labels[command]} com sucesso`);
      setOperationState({ command: null, status: 'idle' });
      queryClient.invalidateQueries({ queryKey: ['workerStatus'] });
    },
    onError: (error: any, command) => {
      toast.error(`Falha ao ${command}: ${error.message}`);
      setOperationState({ command: null, status: 'idle' });
    }
  });

  const workerState = workerStatus?.status || 'offline';
  const isOnline = workerState === 'online';
  const isPaused = workerState === 'paused';
  const isStopped = workerState === 'offline';
  const isPending = operationState.status !== 'idle';

  const cpu = workerStatus?.cpu_usage;
  const ram = workerStatus?.ram_usage;
  const disk = workerStatus?.disk_usage;


  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Infraestrutura do Servidor</h1>
          <p className="text-slate-500 mt-1 font-medium">Controle operacional e telemetria da infraestrutura.</p>
        </div>
        <Badge variant="outline" className={cn(
          "px-3 py-1 font-bold tracking-wider",
          isOnline ? "text-green-600 border-green-200 bg-green-50" : 
          isPaused ? "text-yellow-600 border-yellow-200 bg-yellow-50" :
          "text-slate-400 border-slate-200 bg-slate-50"
        )}>
          {isOnline ? "● WORKER EM EXECUÇÃO" : isPaused ? "● WORKER PAUSADO" : "○ WORKER DESCONECTADO"}
        </Badge>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status da VPS */}
        <Card className="lg:col-span-3 premium-card overflow-hidden w-full">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Telemetria de Hardware</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3 w-3 text-blue-500" />
                    Processamento (CPU)
                  </div>
                  <span>{isOnline ? `${cpu}%` : "—"}</span>
                </div>
                <Progress value={isOnline ? cpu : 0} className="h-1.5 bg-slate-100" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3 w-3 text-indigo-500" />
                    Memória (RAM)
                  </div>
                  <span>{isOnline ? `${ram}%` : "—"}</span>
                </div>
                <Progress value={isOnline ? ram : 0} className="h-1.5 bg-slate-100" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-slate-400" />
                    Armazenamento (Disco)
                  </div>
                  <span>{isOnline && disk !== undefined ? `${disk}%` : "Não disponível"}</span>
                </div>
                <Progress value={isOnline && disk !== undefined ? disk : 0} className="h-1.5 bg-slate-100" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 md:gap-12">
               <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest mb-1">Hostname do Servidor</span>
                  <span className="text-sm font-semibold text-slate-700">{workerStatus?.hostname || "Aguardando dados..."}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest mb-1">Tempo Ativo</span>
                  <span className="text-sm font-semibold text-slate-700">{workerStatus?.uptime || "Aguardando dados..."}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Controles de Serviço */}
        <Card className="premium-card">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Controle do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {/* INICIAR */}
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start font-bold text-xs h-10 transition-all",
                (isOnline || isPending) ? "text-slate-400 opacity-50" : "text-green-600 border-green-100 hover:bg-green-50"
              )}
              disabled={isOnline || isPending}
              onClick={() => controlMutation.mutate('start')}
            >
              <PlayCircle className="mr-3 h-4 w-4" />
              {operationState.command === 'start' ? "Iniciando..." : "Iniciar Serviço"}
            </Button>

            {/* PAUSAR */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start font-bold text-xs h-10 transition-all",
                    (!isOnline || isPending) ? "text-slate-400 opacity-50" : "text-yellow-600 border-yellow-100 hover:bg-yellow-50"
                  )}
                  disabled={!isOnline || isPending}
                >
                  <PauseCircle className="mr-3 h-4 w-4" />
                  {operationState.command === 'pause' ? "Pausando..." : "Pausar Serviço"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pausar o Worker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pausar o serviço interromperá temporariamente o processamento de novos e-mails. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => controlMutation.mutate('pause')} className="bg-yellow-600 hover:bg-yellow-700">Confirmar Pausa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {/* REINICIAR */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start font-bold text-xs h-10 transition-all",
                    isPending ? "text-slate-400 opacity-50" : "text-[#0000a2] border-blue-100 hover:bg-blue-50"
                  )}
                  disabled={isPending}
                >
                  <RefreshCcw className={cn("mr-3 h-4 w-4", operationState.command === 'restart' && "animate-spin")} />
                  {operationState.command === 'restart' ? "Reiniciando..." : "Reiniciar Serviço"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reiniciar o Serviço?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O serviço ficará indisponível por alguns segundos durante a reinicialização. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => controlMutation.mutate('restart')} className="bg-[#0000a2]">Confirmar Reinício</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {operationState.message && (
              <div className="mt-2 text-[10px] text-center font-bold text-slate-400 animate-pulse">
                {operationState.message}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Serviços */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Serviços do Motor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Worker Core", status: isOnline ? 'online' : 'offline', icon: Activity, desc: "Processador de E-mail" },
            { 
              label: "Engine IMAP", 
              status: !workerStatus?.configs?.length ? 'aguardando' : workerStatus.configs.some((c: any) => c.status === 'error') ? 'offline' : 'online', 
              icon: Mail, 
              desc: "Protocolo de Entrada" 
            },
            { 
              label: "Engine SMTP", 
              status: !workerStatus?.configs?.length ? 'aguardando' : workerStatus.configs.some((c: any) => c.status === 'error') ? 'offline' : 'online', 
              icon: Shield, 
              desc: "Protocolo de Saída" 
            },
            { label: "Banco de Dados", status: workerStatus?.db_status || 'aguardando', icon: Database, desc: "Serviço de Dados" },
          ].map((service, i) => (
            <Card key={i} className="premium-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  service.status === 'online' ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                )}>
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{service.label}</span>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      service.status === 'online' ? "bg-green-500" : "bg-slate-300"
                    )} />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{service.desc}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
