import * as React from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  Mail, 
  Activity, 
  History, 
  Users, 
  Server, 
  Settings, 
  LogOut,
  ChevronDown,
  Plus,
  RefreshCw,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkerStatus, restartWorker } from "@/lib/email.functions";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import logoPrimary from "@/assets/logo-original.png.asset.json";

interface EmailConfig {
  id: string;
  email_user: string;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Contas de E-mail", icon: Mail, to: "/accounts" },
  { label: "Monitoramento", icon: Activity, to: "/monitoring" },
  { label: "Logs", icon: History, to: "/logs" },
  { label: "Usuários", icon: Users, to: "/users" },
  { label: "Servidor", icon: Server, to: "/server" },
  { label: "Configurações", icon: Settings, to: "/settings" },
];

function LastHeartbeat({ time }: { time?: string }) {
  const [formattedTime, setFormattedTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (time) {
      setFormattedTime(new Date(time).toLocaleTimeString());
    }
  }, [time]);

  if (!formattedTime) {
    return (
      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
        Aguardando heartbeat...
      </span>
    );
  }

  return (
    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
      Última atualização: {formattedTime}
    </span>
  );
}

// Global state for selected account to sync across pages
const ActiveAccountContext = React.createContext<{
  selectedConfigId: string | null;
  setSelectedConfigId: (id: string | null) => void;
  configs: EmailConfig[];
  refreshConfigs: () => Promise<void>;
}>({
  selectedConfigId: null,
  setSelectedConfigId: () => {},
  configs: [],
  refreshConfigs: async () => {},
});

export const useActiveAccount = () => React.useContext(ActiveAccountContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = React.useState<any>(null);
  const [configs, setConfigs] = React.useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  const { data: workerStatus } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 10000
  });

  const queryClient = useQueryClient();
  const restartMutation = useMutation({
    mutationFn: () => restartWorker({}),
    onSuccess: () => {
      toast.success("Comando de reinício enviado ao worker");
      queryClient.invalidateQueries({ queryKey: ['workerStatus'] });
    },
    onError: () => {
      toast.error("Falha ao enviar comando de reinício");
    }
  });


  const fetchConfigs = React.useCallback(async () => {
    const { data } = await supabase
      .from("email_configurations")
      .select("id, email_user")
      .order("created_at", { ascending: false });
    
    if (data) {
      const typedConfigs = data as EmailConfig[];
      setConfigs(typedConfigs);
      if (typedConfigs.length > 0) {
        setSelectedConfigId((prev: string | null) => {
          if (prev !== null && typedConfigs.some(c => c.id === prev)) return prev;
          return typedConfigs[0]?.id || null;
        });
      }
    }
  }, []);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchConfigs();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchConfigs();
    });

    return () => subscription.unsubscribe();
  }, [fetchConfigs]);

  const selectedConfig = React.useMemo(() => {
    if (!selectedConfigId || !configs.length) return null;
    return configs.find(c => c.id === selectedConfigId) || null;
  }, [selectedConfigId, configs]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const handleAccountChange = (id: string | null) => {
    setSelectedConfigId(id);
    // If we are on a specific log page, we might want to navigate
    if (id && location.pathname.startsWith('/logs/')) {
      navigate({ to: `/logs/${id}` });
    }
  };

  return (
    <ActiveAccountContext.Provider value={{ selectedConfigId, setSelectedConfigId: handleAccountChange, configs, refreshConfigs: fetchConfigs }}>
      <div className="flex min-h-screen bg-[#f8fafc] font-sans">
        {/* Sidebar */}
        <aside 
          className={cn(
            "border-r border-white/5 bg-[#000033] flex flex-col fixed inset-y-0 shadow-2xl z-50 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-64"
          )}
        >
          <div className={cn(
            "p-8 mb-4 flex items-center justify-center border-b border-white/5 bg-white/[0.02] relative",
            isCollapsed && "p-4"
          )}>
            {!isCollapsed ? (
              <img src={logoPrimary.url} alt="Agilliza" className="h-10 object-contain transition-all" />
            ) : (
              <img src={logoPrimary.url} alt="A" className="h-8 w-8 object-contain" />
            )}
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-10 h-6 w-6 rounded-full bg-[#0000A0] text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform z-50"
            >
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to === '/logs' && location.pathname.startsWith('/logs/'));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-all duration-200",
                    isCollapsed && "justify-center px-0",
                    isActive
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                      : "text-blue-100/60 hover:bg-white/5 hover:text-white"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-blue-100/50")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-white/10">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full text-blue-100/70 hover:text-white hover:bg-white/5 font-medium",
                isCollapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={handleSignOut}
              title={isCollapsed ? "Sair da conta" : undefined}
            >
              <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>Sair da conta</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            isCollapsed ? "pl-20" : "pl-64"
          )}
        >
          {/* Top Header */}
          <header className="h-14 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3 gap-3 hover:bg-slate-50 transition-all">
                      <div className="p-1.5 bg-blue-50 rounded-md">
                        <Mail className="h-4 w-4 text-[#0000A0]" />
                      </div>
                      <div className="text-left hidden sm:block">
                        <div className="text-xs font-bold text-slate-900 leading-none mb-0.5">
                          {selectedConfig ? selectedConfig.email_user : "Selecione uma conta"}
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
                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minhas Contas</DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    {configs.map((config) => (
                      <DropdownMenuItem 
                        key={config.id}
                        onClick={() => handleAccountChange(config.id)}
                        className="cursor-pointer font-semibold rounded-lg py-2 focus:bg-slate-50 focus:text-[#0000A0]"
                      >
                        <Mail className="mr-2 h-4 w-4 opacity-50" />
                        {config.email_user}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="my-1" />
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

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-inner">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    workerStatus?.status === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                  )} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {workerStatus?.message || "Worker Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-none mb-1">
                  {session?.user?.user_metadata?.full_name || session?.user?.email || "Usuário"}
                </span>
                <LastHeartbeat time={workerStatus?.last_heartbeat} />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 p-0 rounded-full border border-slate-200 hover:border-[#0000A0] transition-colors overflow-hidden">
                    <div className="h-full w-full bg-slate-50 flex items-center justify-center text-[#0000A0] font-bold text-xs">
                      {(session?.user?.user_metadata?.full_name || "U")[0]}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-slate-200 rounded-xl">
                  <DropdownMenuLabel className="font-bold">Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })} className="cursor-pointer rounded-lg">
                    <Settings className="mr-2 h-4 w-4" /> Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <div className="h-px bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />

          {/* Page Body */}
          <div className="p-8 max-w-[1600px] w-full mx-auto">
            {children}
          {/* Footer */}
          <footer className="py-6 px-8 border-t bg-white">
            <div className="max-w-[1600px] mx-auto flex justify-center items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Desenvolvido por Lucca Santana
              </p>
            </div>
          </footer>
        </main>
      </div>
    </ActiveAccountContext.Provider>
  );
}
