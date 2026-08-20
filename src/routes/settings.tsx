import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database,
  Globe,
  Save,
  Lock,
  User,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AppLayout>
      <SettingsPage />
    </AppLayout>
  ),
});

function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.['full_name'] || "");
      }
    });
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      toast.success("Perfil atualizado com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Digite a nova senha");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success("Senha alterada com sucesso");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Minha Conta e Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie seu perfil, altere sua senha e ajuste as preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Perfil do Usuário */}
        <Card className="premium-card overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-[#0000A0]" />
              </div>
              <div>
                <CardTitle className="text-lg">Meu Perfil</CardTitle>
                <CardDescription>Suas informações básicas de acesso ao sistema.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full-name" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Nome Completo</Label>
                <Input 
                  id="full-name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-11 border-slate-200 focus:border-agilliza focus:ring-agilliza/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700 uppercase tracking-wider">E-mail</Label>
                <Input id="email" value={user?.email || ""} disabled className="h-11 bg-slate-50 border-slate-200 font-medium text-slate-500" />
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-6">
              <Button 
                onClick={handleUpdateProfile} 
                disabled={loading}
                className="bg-[#0000A0] hover:bg-[#000080] h-11 px-8 font-bold shadow-lg shadow-blue-900/10 transition-all active:scale-95"
              >
                {loading ? "Salvando..." : "Atualizar Perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card className="premium-card overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Key className="h-5 w-5 text-[#0000A0]" />
              </div>
              <div>
                <CardTitle className="text-lg">Segurança da Conta</CardTitle>
                <CardDescription>Mantenha sua conta protegida alterando sua senha.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" title="password" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Nova Senha</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 border-slate-200 focus:border-agilliza focus:ring-agilliza/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" title="password" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Confirmar Nova Senha</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 border-slate-200 focus:border-agilliza focus:ring-agilliza/20 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-6">
              <Button 
                onClick={handleChangePassword} 
                disabled={loading}
                variant="outline"
                className="h-11 px-8 border-agilliza text-agilliza font-bold hover:bg-blue-50 transition-all active:scale-95"
              >
                {loading ? "Processando..." : "Alterar Senha"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#0000A0]" />
              <CardTitle>Preferências do Sistema</CardTitle>
            </div>
            <CardDescription>Parâmetros globais de execução.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lock-ttl">Lock TTL (Segundos)</Label>
              <Input id="lock-ttl" type="number" defaultValue="300" />
              <p className="text-[11px] text-slate-400 italic">Tempo máximo que um worker segura o processamento de uma conta.</p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Notificações por E-mail</Label>
                <p className="text-sm text-slate-500">Receber alertas de erros críticos no processamento.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
