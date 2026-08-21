import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { MonitorPage } from "@/components/monitor/MonitorPage";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: DashboardPageWithLayout,
});

function DashboardPageWithLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.replace("/auth");
        } else {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Erro na verificação de autenticação:", err);
        window.location.replace("/auth");
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4 max-w-lg p-6 text-center">
          <div className="h-10 w-10 border-4 border-agilliza/20 border-t-agilliza rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando acesso...</p>
          <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded text-xs text-red-600 font-mono text-left">
            QUANDO EU CLICO EM EDITAR, O SISTEMA DEVE MOSTRAR AS REGRAS JA CADASTRADAS E PERMITIR EDICAO
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AppLayout>
      <MonitorPage />
    </AppLayout>
  );
}
