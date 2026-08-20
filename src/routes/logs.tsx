import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ChevronRight, History } from "lucide-react";

export const Route = createFileRoute("/logs")({
  component: LogsIndexPage,
});

function LogsIndexPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchConfigs = useCallback(async () => {
    const { data } = await supabase
      .from("email_configurations")
      .select("id, email_user")
      .order("created_at", { ascending: false });
    
    if (data && data.length > 0 && data[0]) {
      // Automatic redirect to first account if exists
      navigate({ to: `/logs/${data[0].id}` });
    }
    setConfigs(data || []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000A0]"></div>
        ) : configs.length === 0 ? (
          <div className="text-center space-y-2">
            <History className="h-12 w-12 text-slate-200 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Nenhuma conta encontrada</h2>
            <p className="text-slate-500">Cadastre uma conta para visualizar o histórico.</p>
          </div>
        ) : (
          <p className="text-slate-400 animate-pulse">Redirecionando para a conta principal...</p>
        )}
      </div>
    </AppLayout>
  );
}
