import { createFileRoute, redirect } from "@tanstack/react-router";
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/auth";
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-agilliza.png" alt="Agilliza" className="h-12 animate-pulse opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autenticando...</p>
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
