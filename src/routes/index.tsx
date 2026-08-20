import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { testConnection } from "@/lib/email.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Settings as SettingsIcon, Play, Square, History, Mail, LogOut, Loader2 } from "lucide-react";
import logoPrimary from "@/assets/logo-primary.png.asset.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
  },
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const runTestConnection = useServerFn(testConnection);

  const [formData, setFormData] = useState({
    imap_host: "imap.uhserver.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtps.uhserver.com",
    smtp_port: 465,
    smtp_secure: true,
    email_user: "thiago@agilliza.net.br",
    email_password: "",
    allow_invalid: true,
    destinations: "renzo@agilliza.net.br, carlos@agilliza.net.br, pamela@agilliza.net.br, paula@agilliza.net.br",
    keywords: "codigo",
  });

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

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);

    try {
      // 1. Test Connection (Only if not allowed invalid)
      if (!formData.allow_invalid) {
        await runTestConnection({
          data: {
            imap_host: formData.imap_host,
            imap_port: formData.imap_port,
            imap_secure: formData.imap_secure,
            smtp_host: formData.smtp_host,
            smtp_port: formData.smtp_port,
            smtp_secure: formData.smtp_secure,
            email_user: formData.email_user,
            email_password: formData.email_password,
          }
        });
      }

      // 2. Save to DB
      const { error } = await supabase.from("email_configurations").insert({
        user_id: session.user.id,
        imap_host: formData.imap_host,
        imap_port: formData.imap_port,
        imap_secure: formData.imap_secure,
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_secure: formData.smtp_secure,
        email_user: formData.email_user,
        email_password: formData.email_password,
        destinations: formData.destinations.split(",").map(e => e.trim()),
        keywords: formData.keywords.split(",").map(e => e.trim()),
        provider: "Custom"
      });

      if (error) throw error;

      toast.success("Configuração criada com sucesso!");
      setIsModalOpen(false);
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar configuração");
    } finally {
      setIsTesting(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fcfbf8] p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <img src={logoPrimary.url} alt="Agilliza" className="h-10 object-contain" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciador de E-mail</h1>
                <p className="text-gray-600">Olá, {session.user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => supabase.auth.signOut()} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Nova Configuração
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Configuração de E-mail</DialogTitle>
                  <DialogDescription>
                    Configure os servidores IMAP e SMTP para monitoramento e encaminhamento.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateConfig} className="space-y-6 py-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm uppercase text-gray-500">Servidor IMAP (Entrada)</h3>
                      <div className="space-y-2">
                        <Label htmlFor="imap_host">Host IMAP</Label>
                        <Input id="imap_host" placeholder="imap.exemplo.com" value={formData.imap_host} onChange={e => setFormData({...formData, imap_host: e.target.value})} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imap_port">Porta</Label>
                          <Input id="imap_port" type="number" value={formData.imap_port} onChange={e => setFormData({...formData, imap_port: parseInt(e.target.value)})} required />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox id="imap_secure" checked={formData.imap_secure} onCheckedChange={(checked) => setFormData({...formData, imap_secure: !!checked})} />
                          <Label htmlFor="imap_secure">SSL/TLS</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm uppercase text-gray-500">Servidor SMTP (Saída)</h3>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_host">Host SMTP</Label>
                        <Input id="smtp_host" placeholder="smtp.exemplo.com" value={formData.smtp_host} onChange={e => setFormData({...formData, smtp_host: e.target.value})} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp_port">Porta</Label>
                          <Input id="smtp_port" type="number" value={formData.smtp_port} onChange={e => setFormData({...formData, smtp_port: parseInt(e.target.value)})} required />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox id="smtp_secure" checked={formData.smtp_secure} onCheckedChange={(checked) => setFormData({...formData, smtp_secure: !!checked})} />
                          <Label htmlFor="smtp_secure">SSL/TLS</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-sm uppercase text-gray-500">Credenciais</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email_user">E-mail</Label>
                        <Input id="email_user" type="email" placeholder="usuario@exemplo.com" value={formData.email_user} onChange={e => setFormData({...formData, email_user: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email_password">Senha / App Password</Label>
                        <Input id="email_password" type="password" placeholder="••••••••" value={formData.email_password} onChange={e => setFormData({...formData, email_password: e.target.value})} required={!formData.allow_invalid} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-sm uppercase text-gray-500">Regras de Encaminhamento</h3>
                    <div className="space-y-2">
                      <Label htmlFor="destinations">Destinatários (separados por vírgula)</Label>
                      <Input id="destinations" placeholder="destinatario1@gmail.com, destinatario2@gmail.com" value={formData.destinations} onChange={e => setFormData({...formData, destinations: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                      <Input id="keywords" placeholder="codigo, token, senha" value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} required />
                    </div>
                    <div className="flex items-center space-x-2 border-t pt-4">
                      <Checkbox id="allow_invalid" checked={formData.allow_invalid} onCheckedChange={(checked) => setFormData({...formData, allow_invalid: !!checked})} />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="allow_invalid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Salvar mesmo que as credenciais falhem no teste
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Ele deve me permitir salvas as configurações mesmo que não tenha a senha e etc.
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isTesting} className="w-full">
                      {isTesting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando e Salvando...</>
                      ) : (
                        "Salvar Configuração"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-500">Carregando configurações...</p>
          </div>
        ) : configs.length === 0 ? (
          <Card className="text-center py-20 border-dashed bg-transparent">
            <CardHeader>
              <Mail className="mx-auto h-16 w-16 text-gray-300" />
              <CardTitle className="text-2xl mt-4">Pronto para começar?</CardTitle>
              <CardDescription className="max-w-sm mx-auto">
                Adicione uma configuração de servidor de e-mail para monitorar palavras-chave e encaminhar mensagens automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                Criar Minha Primeira Configuração
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => (
              <Card key={config.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
                        {config.email_user}
                      </CardTitle>
                      <CardDescription>{config.imap_host}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${config.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {config.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Monitorando</span>
                        <span className="text-gray-700 font-medium truncate">{config.keywords.join(", ")}</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Encaminhando</span>
                        <span className="text-gray-700 font-medium truncate">{config.destinations.length} e-mail(s)</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant={config.is_active ? "destructive" : "default"}
                        className="flex-1 gap-2 h-9 text-xs"
                        onClick={() => handleToggleActive(config.id, config.is_active)}
                      >
                        {config.is_active ? (
                          <><Square className="h-3.5 w-3.5 fill-current" /> Parar</>
                        ) : (
                          <><Play className="h-3.5 w-3.5 fill-current" /> Iniciar</>
                        )}
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild title="Logs">
                        <a href={`/logs/${config.id}`}>
                          <History className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" title="Configurações">
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                    </div>
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