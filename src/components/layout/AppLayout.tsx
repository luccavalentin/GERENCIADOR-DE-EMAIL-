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
  RefreshCw
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
import logoPrimary from "@/assets/logo-primary.png.asset.json";

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
      <div className="flex min-h-screen bg-[#fcfbf8]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white flex flex-col fixed inset-y-0 shadow-sm z-50">
          <div className="p-6 border-b flex items-center justify-center">
            <img src={logoPrimary.url} alt="Agilliza" className="h-8 object-contain" />
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.to || (item.to === '/logs' && location.pathname.startsWith('/logs/'))
                    ? "bg-[#0000A0] text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0000A0]"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-600 hover:text-destructive hover:bg-destructive/5"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pl-64 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conta monitorada</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3 gap-2 border-slate-200 hover:border-[#0000A0] hover:bg-slate-50 transition-all font-semibold">
                      <Mail className="h-4 w-4 text-[#0000A0]" />
                      {selectedConfig ? selectedConfig.email_user : "Selecione uma conta"}
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Minhas Contas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {configs.map((config) => (
                      <DropdownMenuItem 
                        key={config.id}
                        onClick={() => handleAccountChange(config.id)}
                        className="cursor-pointer font-medium"
                      >
                        {config.email_user}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-[#0000A0] font-bold"
                      onClick={() => navigate({ to: "/accounts" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar nova conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 border-slate-200 hover:border-[#0000A0] hover:bg-slate-50 text-[#0000A0]"
                  onClick={() => navigate({ to: "/accounts" })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-100">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    workerStatus?.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                    {workerStatus?.message || "Worker Offline"}
                  </span>
                  {workerStatus?.status !== 'online' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => restartMutation.mutate()}
                      disabled={restartMutation.isPending}
                    >
                      <RefreshCw className={cn("h-3 w-3", restartMutation.isPending && "animate-spin")} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-600">
              <div className="text-right flex flex-col mr-2">
                <span className="text-sm font-bold text-slate-900">{session?.user?.user_metadata?.full_name || session?.user?.email || "Usuário"}</span>
                <LastHeartbeat time={workerStatus?.last_heartbeat} />
              </div>
            </div>

          </header>

          {/* Page Body */}
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ActiveAccountContext.Provider>
  );
}
