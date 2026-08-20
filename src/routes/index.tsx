import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { testConnection, saveEmailConfiguration, processEmailsForConfig, testImapConnectionDetailed, testSmtpConnectionDetailed } from "@/lib/email.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Settings as SettingsIcon, Play, Square, History, Mail, LogOut, Loader2, Activity, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
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
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const runTestConnection = useServerFn(testConnection);
  const runSaveConfig = useServerFn(saveEmailConfiguration);
  const runProcessNow = useServerFn(processEmailsForConfig);
  const runTestImap = useServerFn(testImapConnectionDetailed);
  const runTestSmtp = useServerFn(testSmtpConnectionDetailed);
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [processStats, setProcessStats] = useState<any>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const [testResult, setTestResult] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);

  const initialFormData = {
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
  };

  const [formData, setFormData] = useState(initialFormData);

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

  const handleOpenEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      imap_host: config.imap_host,
      imap_port: config.imap_port,
      imap_secure: config.imap_secure,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      email_user: config.email_user,
      email_password: config.email_password,
      allow_invalid: true,
      destinations: config.destinations.join(", "),
      keywords: config.keywords.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);

    try {
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

      const configData = {
        user_id: session.user.id,
        imap_host: formData.imap_host,
        imap_port: formData.imap_port,
        imap_secure: formData.imap_secure,
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_secure: formData.smtp_secure,
        email_user: formData.email_user,
        destinations: formData.destinations.split(",").map(e => e.trim()),
        keywords: formData.keywords.split(",").map(e => e.trim()),
        provider: "Custom"
      };

      await runSaveConfig({
        data: {
          configId: editingConfig?.id,
          configData,
          emailPassword: formData.email_password,
        }
      });

      toast.success(editingConfig ? "Configuração atualizada com sucesso!" : "Configuração criada com sucesso!");
      setIsModalOpen(false);
      setEditingConfig(null);
      setFormData(initialFormData);
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração");
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleManualProcess = async (configId: string) => {
    setIsProcessing(configId);
    try {
      const result = await runProcessNow({ data: { configId } });
      if (result.success) {
        setProcessStats(result.stats);
        setIsStatsOpen(true);
        toast.success("Processamento concluído!");
        fetchConfigs();
      } else {
        toast.error(`Erro: ${result.error}`);
        if (result.stats) {
          setProcessStats(result.stats);
          setIsStatsOpen(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar e-mails");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleTestImap = async (configId: string) => {
    setTestingConfigId(configId);
    setTestResult(null);
    try {
      const result = await runTestImap({ data: { configId } });
      setTestResult({ type: 'IMAP', ...result });
      setIsTestModalOpen(true);
      if (result.success) {
        toast.success("Teste IMAP concluído com sucesso!");
      } else {
        toast.error(`Falha no teste IMAP: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao testar IMAP");
    } finally {
      setTestingConfigId(null);
    }
  };

  const handleTestSmtp = async (configId: string) => {
    setTestingConfigId(configId);
    setTestResult(null);
    try {
      const result = await runTestSmtp({ data: { configId } });
      setTestResult({ type: 'SMTP', ...result });
      setIsTestModalOpen(true);
      if (result.success) {
        toast.success("Teste SMTP concluído com sucesso!");
      } else {
        toast.error(`Falha no teste SMTP: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao testar SMTP");
    } finally {
      setTestingConfigId(null);
    }
  };


  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fcfbf8] p-4 md:p-8">
      <div className="mx-auto max-w-6xl w-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 md:gap-4">
              <img src={logoPrimary.url} alt="Agilliza" className="h-8 md:h-10 object-contain" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">Painel de Monitoramento</h1>
                <p className="text-sm md:text-base text-gray-600">Olá, {session.user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" onClick={() => supabase.auth.signOut()} className="flex-1 md:flex-none gap-2">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
            </Button>
            
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setEditingConfig(null);
                setFormData(initialFormData);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none gap-2" onClick={() => {
                  setEditingConfig(null);
                  setFormData(initialFormData);
                }}>
                  <Plus className="h-4 w-4" /> <span className="inline sm:inline">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingConfig ? "Editar Configuração" : "Nova Configuração"} de E-mail</DialogTitle>
                  <DialogDescription>
                    Configure os servidores IMAP e SMTP para monitoramento e encaminhamento.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveConfig} className="space-y-6 py-4">
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
                    <div className="hidden">
                      <Checkbox id="allow_invalid" checked={formData.allow_invalid} onCheckedChange={(checked) => setFormData({...formData, allow_invalid: !!checked})} />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="allow_invalid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          remova essa msg mesmo que as credenciais falhem no teste
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          remova essa msg mesmo que as credenciais falhem no teste
                          {"\n\n"}
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
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${config.is_active ? (config.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-yellow-500') : 'bg-gray-300'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {config.is_active ? (config.status === 'success' ? 'Online' : config.status === 'error' ? 'Erro' : 'Ativo') : 'Inativo'}
                        </span>
                      </div>
                      {config.last_check_at && (
                        <span className="text-[9px] text-gray-400">
                          Lido: {new Date(config.last_check_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {config.status === 'error' && config.last_error && (
                      <div className="p-2 bg-red-50 border border-red-100 rounded flex items-start gap-2 mb-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-red-600 line-clamp-2">{config.last_error}</span>
                      </div>
                    )}
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
                    
                    <div className="flex gap-2 pt-4 flex-wrap">
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
                      
                      <Button 
                        variant="secondary"
                        className="flex-1 gap-2 h-9 text-xs"
                        onClick={() => handleManualProcess(config.id)}
                        disabled={isProcessing === config.id}
                      >
                        {isProcessing === config.id ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> ...</>
                        ) : (
                          <><Activity className="h-3.5 w-3.5" /> Processar agora</>
                        )}
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild title="Logs">
                        <Link to="/logs/$configId" params={{ configId: config.id }}>
                          <History className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" title="Configurações" onClick={() => handleOpenEdit(config)}>
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 gap-2 h-8 text-[10px] uppercase font-bold text-gray-500 hover:text-blue-600 border-dashed"
                        onClick={() => handleTestImap(config.id)}
                        disabled={testingConfigId === config.id}
                      >
                        {testingConfigId === config.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                        Testar IMAP
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 gap-2 h-8 text-[10px] uppercase font-bold text-gray-500 hover:text-blue-600 border-dashed"
                        onClick={() => handleTestSmtp(config.id)}
                        disabled={testingConfigId === config.id}
                      >
                        {testingConfigId === config.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                        Testar SMTP
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Resumo do Processamento
            </DialogTitle>
            <DialogDescription>
              Resultados da execução manual do monitor.
            </DialogDescription>
          </DialogHeader>
          
          {processStats && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Status IMAP</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${processStats.imapConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-semibold">{processStats.imapConnected ? 'Conectado' : 'Falha'}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Encontradas</span>
                  <span className="text-xl font-bold text-gray-900">{processStats.found}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Analisadas</span>
                  <span className="text-xl font-bold text-blue-600">{processStats.analyzed}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Com Código</span>
                  <span className="text-xl font-bold text-orange-600">{processStats.withCode}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Encaminhadas</span>
                  <span className="text-xl font-bold text-green-600">{processStats.forwarded}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Ignoradas</span>
                  <span className="text-xl font-bold text-gray-500">{processStats.ignored}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Duplicadas</span>
                  <span className="text-xl font-bold text-purple-600">{processStats.duplicates}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Erros</span>
                  <span className="text-xl font-bold text-red-600">{processStats.errors}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsStatsOpen(false)} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Resultado do Teste {testResult?.type}
            </DialogTitle>
            <DialogDescription>
              Detalhes técnicos da conexão e autenticação.
            </DialogDescription>
          </DialogHeader>
          
          {testResult && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Conexão TCP/SSL</span>
                  <div className="flex items-center gap-2">
                    {testResult.result.connection === 'ok' ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs font-bold text-green-700">OK</span></>
                    ) : testResult.result.connection === 'error' ? (
                      <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-xs font-bold text-red-700">ERRO</span></>
                    ) : (
                      <span className="text-xs text-gray-400">Pendente</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Autenticação</span>
                  <div className="flex items-center gap-2">
                    {testResult.result.auth === 'ok' ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs font-bold text-green-700">OK</span></>
                    ) : testResult.result.auth === 'error' ? (
                      <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-xs font-bold text-red-700">ERRO</span></>
                    ) : (
                      <span className="text-xs text-gray-400">Pendente</span>
                    )}
                  </div>
                </div>

                {testResult.type === 'IMAP' && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Acesso INBOX</span>
                    <div className="flex items-center gap-2">
                      {testResult.result.inbox === 'ok' ? (
                        <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs font-bold text-green-700">OK</span></>
                      ) : testResult.result.inbox === 'error' ? (
                        <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-xs font-bold text-red-700">ERRO</span></>
                      ) : (
                        <span className="text-xs text-gray-400">Pendente</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Tempo de Resposta</span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold">{testResult.result.time}ms</span>
                  </div>
                </div>

                {!testResult.success && testResult.error && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">Log de Erro</span>
                    <p className="text-xs text-red-700 break-words">{testResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsTestModalOpen(false)} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}