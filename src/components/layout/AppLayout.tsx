import * as React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getWorkerStatus } from "@/lib/email.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { cn } from "@/lib/utils";
import { EmailConfig, WorkerStatus } from "@/lib/types";

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
  }) as { data: WorkerStatus | undefined };

  const fetchConfigs = React.useCallback(async () => {
    const { data } = await supabase
      .from("email_configurations")
      .select("*")
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
    if (id && location.pathname.startsWith('/logs/')) {
      navigate({ to: `/logs/${id}` });
    }
  };

  return (
    <ActiveAccountContext.Provider value={{ selectedConfigId, setSelectedConfigId: handleAccountChange, configs, refreshConfigs: fetchConfigs }}>
      <div className="flex min-h-screen bg-[#f8fafc] font-sans">
        {/* Overlay for mobile sidebar */}
        {!isCollapsed && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsCollapsed(true)}
          />
        )}

        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          onSignOut={handleSignOut} 
        />

        <main 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            isCollapsed ? "md:pl-20" : "md:pl-64"
          )}
        >
          <TopHeader 
            selectedConfig={selectedConfig}
            configs={configs}
            workerStatus={workerStatus}
            session={session}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            onAccountChange={handleAccountChange}
            onSignOut={handleSignOut}
          />
          
          <div className="h-px bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" />

          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-x-hidden">
            {children}
          </div>

          <footer className="py-6 px-4 md:px-8 border-t bg-white mt-auto">
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
