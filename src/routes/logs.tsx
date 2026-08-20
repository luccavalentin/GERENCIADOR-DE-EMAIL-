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
    
    if (data) setConfigs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000A0]"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <History className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Logs</h1>
            <p className="text-slate-500 mt-1">Selecione uma conta monitorada para visualizar os logs detalhados.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {configs.map((config) => (
            <Card 
              key={config.id} 
              className="cursor-pointer hover:border-[#0000A0] transition-colors group"
              onClick={() => navigate({ to: `/logs/${config.id}` })}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Mail className="h-5 w-5 text-[#0000A0]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{config.email_user}</h3>
                    <p className="text-xs text-slate-400">Clique para ver logs desta conta</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#0000A0] transition-colors" />
              </CardContent>
            </Card>
          ))}

          {configs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-slate-400">
                Nenhuma conta configurada encontrada.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
