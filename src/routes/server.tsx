import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Server, Cpu, HardDrive, Shield, RefreshCcw, Clock, Activity, Database, Mail, Power, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkerStatus, updateWorkerState } from "@/lib/email.functions";
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
  const [isOperating, setIsOperating] = useState(false);

  const { data: workerStatus, isLoading } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 10000
  });

  const workerMutation = useMutation({
    mutationFn: (action: 'start' | 'stop' | 'restart' | 'pause') => 
      updateWorkerState({ data: { action } }),
    onMutate: () => {
      setIsOperating(true);
    },
    onSuccess: (data, action) => {
      const messages = {
        start: "Serviço iniciado com sucesso.",
        stop: "Serviço parado com sucesso.",
        restart: "Serviço reiniciado com sucesso.",
        pause: "Serviço pausado com sucesso."
      };
      toast.success(messages[action]);
      
      // Wait for heartbeat if start/restart
      if (action === 'start' || action === 'restart') {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['workerStatus'] });
          setIsOperating(false);
        }, 3000);
      } else {
        queryClient.invalidateQueries({ queryKey: ['workerStatus'] });
        setIsOperating(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro na operação");
      setIsOperating(false);
    }
  });

  const isOnline = workerStatus?.status === 'online';
  const isPaused = workerStatus?.status === 'pause';
  const isStopped = workerStatus?.status === 'stop';
  
  const cpu = workerStatus?.cpu_usage || 0;
  const ram = workerStatus?.ram_usage || 0;
  const disk = workerStatus?.disk_usage;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'pause': return 'text-yellow-500';
      case 'stop': return 'text-red-500';
      default: return 'text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Em execução';
      case 'pause': return 'Pausado';
      case 'stop': return 'Parado';
      default: return 'Estado desconhecido';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Infraestrutura do Servidor</h1>
          <p className="text-slate-500 mt-1 font-medium">Controle operacional e telemetria da infraestrutura.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Worker Status</span>
                <span className={cn("text-xs font-bold", getStatusColor(workerStatus?.status))}>
                    {getStatusLabel(workerStatus?.status)}
                </span>
            </div>
            <Badge variant="outline" className={cn(
            "px-3 py-1 font-bold tracking-wider",
            isOnline ? "text-green-600 border-green-200 bg-green-50" : "text-slate-400 border-slate-200 bg-slate-50"
            )}>
            {isOnline ? "● VPS ONLINE" : "○ VPS DESCONECTADA"}
            </Badge>
        </div>
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
                  <span>{isOnline && disk !== undefined ? `${disk}%` : "—"}</span>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs h-10"
                  disabled={isOperating || isPaused || isStopped}
                >
                  <Clock className="mr-3 h-4 w-4" />
                  Pausar Serviço
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
                  <AlertDialogAction onClick={() => workerMutation.mutate('pause')} className="bg-[#0000a2]">Confirmar Pausa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              variant="outline" 
              className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs h-10"
              onClick={() => workerMutation.mutate('start')}
              disabled={isOperating || isOnline}
            >
              <Power className="mr-3 h-4 w-4" />
              {isOperating ? "Iniciando..." : "Iniciar Serviço"}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs h-10"
                  disabled={isOperating}
                >
                  <RefreshCcw className="mr-3 h-4 w-4" />
                  {isOperating ? "Reiniciando..." : "Reiniciar Serviço"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reiniciar o Worker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O serviço ficará indisponível por alguns segundos durante a reinicialização. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => workerMutation.mutate('restart')} className="bg-[#0000a2]">Confirmar Reinício</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
