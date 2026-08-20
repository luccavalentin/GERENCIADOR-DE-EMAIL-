import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Server, Cpu, HardDrive, ShieldCheck, RefreshCcw, Clock, Activity, Database, Mail, Power, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkerStatus, restartWorker } from "@/lib/email.functions";
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

  const isOnline = workerStatus?.status === 'online';
  const cpu = workerStatus?.cpu_usage || 0;
  const ram = workerStatus?.ram_usage || 0;
  const disk = 45; // Placeholder for real telemetry if available

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Infraestrutura</h1>
          <p className="text-slate-500 mt-1">Gerenciamento de hardware e serviços da VPS Agilliza.</p>
        </div>
        <Badge variant="outline" className={cn(
          "px-3 py-1 font-bold tracking-wider",
          isOnline ? "text-green-600 border-green-200 bg-green-50" : "text-slate-400 border-slate-200 bg-slate-50"
        )}>
          {isOnline ? "● VPS ONLINE" : "○ VPS DESCONECTADA"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status da VPS */}
        <Card className="lg:col-span-3 premium-card">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status da VPS Hostinger</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <span>{isOnline ? `${disk}%` : "—"}</span>
                </div>
                <Progress value={isOnline ? disk : 0} className="h-1.5 bg-slate-100" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-12">
               <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest mb-1">Hostname</span>
                  <span className="text-sm font-semibold text-slate-700">{workerStatus?.hostname || "Aguardando dados..."}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest mb-1">Uptime</span>
                  <span className="text-sm font-semibold text-slate-700">{workerStatus?.uptime || "—"}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Controles de Serviço */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Controles</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-[#0000A0] border-[#0000A0]/10 hover:bg-blue-50 font-bold text-xs h-10"
                  disabled={!isOnline || isRestarting}
                >
                  <RefreshCcw className={cn("mr-3 h-4 w-4", isRestarting && "animate-spin")} />
                  Reiniciar Worker
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reiniciar o Worker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação interromperá o processamento atual. O sistema tentará reconectar em alguns segundos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => restartMutation.mutate()} className="bg-[#0000A0]">Confirmar Reinício</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              variant="outline" 
              className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs h-10"
              disabled={!isOnline}
            >
              <Power className="mr-3 h-4 w-4" />
              Parar Worker
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs h-10"
              disabled={!isOnline}
            >
              <Activity className="mr-3 h-4 w-4" />
              Verificar Saúde
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Serviços */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Serviços Agilliza</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Worker Core", status: isOnline ? 'online' : 'offline', icon: Activity, desc: "Processador de E-mail" },
            { label: "Engine IMAP", status: isOnline ? 'online' : 'aguardando', icon: Mail, desc: "Protocolo de Entrada" },
            { label: "Engine SMTP", status: isOnline ? 'online' : 'aguardando', icon: ShieldCheck, desc: "Protocolo de Saída" },
            { label: "Banco de Dados", status: 'online', icon: Database, desc: "Serviço de Dados" },
          ].map((service, i) => (
            <Card key={i} className="shadow-sm border-slate-200">
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
