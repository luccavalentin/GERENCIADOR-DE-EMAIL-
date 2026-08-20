import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { testConnection } from "@/lib/email.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Settings as SettingsIcon, Play, Square, History, Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    title: "Dashboard | Sistema Gerenciador de Email",
    meta: [
      {
        name: "description",
        content: "Gerencie suas configurações de monitoramento de e-mail.",
      },
      {
        property: "og:title",
        content: "Dashboard | Sistema Gerenciador de Email",
      },
      {
        property: "og:description",
        content: "Gerencie suas configurações de monitoramento de e-mail.",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
});

function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const runTestConnection = useServerFn(testConnection);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchConfigs();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchConfigs();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_configurations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar configurações");
    } else {
      setConfigs(data || []);
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("email_configurations")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(currentStatus ? "Monitoramento parado" : "Monitoramento iniciado");
      fetchConfigs();
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcfbf8] p-4 text-center">
        <Mail className="mb-4 h-16 w-16 text-blue-600" />
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Sistema Gerenciador de Email
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Gerencie e encaminhe seus e-mails automaticamente.
        </p>
        <Button asChild>
          <a href="/auth">Começar Agora</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf8] p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suas Configurações</h1>
            <p className="text-gray-600">Monitore e encaminhe e-mails em tempo real.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              Sair
            </Button>
            <Button className="flex gap-2">
              <Plus className="h-4 w-4" /> Nova Configuração
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : configs.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <CardTitle>Nenhuma configuração encontrada</CardTitle>
              <CardDescription>
                Crie sua primeira configuração de servidor de e-mail para começar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="mt-4">
                Criar Configuração
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => (
              <Card key={config.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{config.email_user}</CardTitle>
                      <CardDescription>{config.provider}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${config.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-xs font-medium uppercase text-gray-500">
                        {config.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-1 text-sm text-gray-600">
                    <p><strong>IMAP:</strong> {config.imap_host}:{config.imap_port}</p>
                    <p><strong>SMTP:</strong> {config.smtp_host}:{config.smtp_port}</p>
                    <p><strong>Palavras-chave:</strong> {config.keywords.join(", ")}</p>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button 
                      variant={config.is_active ? "destructive" : "default"}
                      className="flex-1 gap-2"
                      onClick={() => handleToggleActive(config.id, config.is_active)}
                    >
                      {config.is_active ? (
                        <><Square className="h-4 w-4" /> Parar</>
                      ) : (
                        <><Play className="h-4 w-4" /> Iniciar</>
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}