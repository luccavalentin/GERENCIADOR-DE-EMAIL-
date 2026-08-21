import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { 
  Mail, 
  ChevronDown,
  Plus,
  Menu,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailConfig, WorkerStatus } from "@/lib/types";

interface TopHeaderProps {
  selectedConfig: EmailConfig | null;
  configs: EmailConfig[];
  workerStatus: WorkerStatus | undefined;
  session: any;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onAccountChange: (id: string | null) => void;
  onSignOut: () => void;
}

export function TopHeader({
  selectedConfig,
  configs,
  workerStatus,
  session,
  isCollapsed,
  setIsCollapsed,
  onAccountChange,
  onSignOut
}: TopHeaderProps) {
  const navigate = useNavigate();

  const LastHeartbeat = React.useMemo(() => {
    const time = workerStatus?.last_heartbeat;
    if (!time) {
      return (
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
          Aguardando heartbeat...
        </span>
      );
    }
    return (
      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
        Última atualização: {new Date(time).toLocaleTimeString()}
      </span>
    );
  }, [workerStatus?.last_heartbeat]);

  return (
    <header className="h-14 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-1 sm:gap-6 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-600"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 gap-2 sm:gap-3 hover:bg-slate-50 transition-all max-w-[150px] sm:max-w-none">
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <Mail className="h-4 w-4 text-[#0000A0]" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-900 leading-none mb-0.5 truncate max-w-[80px] sm:max-w-none">
                    {selectedConfig ? selectedConfig.email_user : "Conta"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-1.5 w-1.5 rounded-full", selectedConfig ? "bg-green-500" : "bg-slate-300")} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ativo</span>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2 shadow-xl border-slate-200 rounded-xl">
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mails de Saída</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              {configs.map((config) => (
                <DropdownMenuItem 
                  key={config.id}
                  onClick={() => onAccountChange(config.id)}
                  className="cursor-pointer font-semibold rounded-lg py-2 focus:bg-slate-50 focus:text-[#0000A0]"
                >
                  <Mail className="mr-2 h-4 w-4 opacity-50" />
                  {config.email_user}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem 
                className="cursor-pointer text-[#0000A0] font-bold rounded-lg py-2 focus:bg-blue-50 focus:text-[#0000A0]"
                onClick={() => navigate({ to: "/accounts" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar nova conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-inner">
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              workerStatus?.status === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
            )} />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {workerStatus?.message === "Worker Online" ? "Worker Ativo" : workerStatus?.message || "Worker Inativo"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-900 leading-none mb-1">
            {session?.user?.user_metadata?.full_name || session?.user?.email || "Usuário"}
          </span>
          {LastHeartbeat}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 p-0 rounded-full border border-slate-200 hover:border-[#0000A0] transition-colors overflow-hidden">
              <div className="h-full w-full bg-slate-50 flex items-center justify-center text-[#0000A0] font-bold text-xs">
                {(session?.user?.user_metadata?.full_name || session?.user?.email || "U")[0]}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-slate-200 rounded-xl">
            <DropdownMenuLabel className="font-bold">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })} className="cursor-pointer rounded-lg">
              <Settings className="mr-2 h-4 w-4" /> Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive focus:text-destructive rounded-lg">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
