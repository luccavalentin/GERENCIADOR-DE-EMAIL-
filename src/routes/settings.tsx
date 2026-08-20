import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Database,
  Globe,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AppLayout>
      <SettingsPage />
    </AppLayout>
  ),
});

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações do Sistema</h1>
          <p className="text-slate-500 mt-1">Ajuste as preferências globais e segurança da aplicação.</p>
        </div>
        <Button className="bg-[#0000A0] hover:bg-[#000080]">
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#0000A0]" />
              <CardTitle>Geral</CardTitle>
            </div>
            <CardDescription>Informações básicas sobre a instância do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system-name">Nome do Sistema</Label>
                <Input id="system-name" defaultValue="Agilliza" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">E-mail Administrativo</Label>
                <Input id="admin-email" defaultValue="admin@agilliza.net.br" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0000A0]" />
              <CardTitle>Segurança e Acesso</CardTitle>
            </div>
            <CardDescription>Configure políticas de autenticação e proteção.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Autenticação de Dois Fatores (2FA)</Label>
                <p className="text-sm text-slate-500">Exigir código adicional no login.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Registro Público</Label>
                <p className="text-sm text-slate-500">Permitir que novos usuários se cadastrem sozinhos.</p>
              </div>
              <Switch defaultChecked={false} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#0000A0]" />
              <CardTitle>Integração e Sincronização</CardTitle>
            </div>
            <CardDescription>Parâmetros de comunicação com Supabase e VPS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lock-ttl">Lock TTL (Segundos)</Label>
              <Input id="lock-ttl" type="number" defaultValue="300" />
              <p className="text-[11px] text-slate-400 italic">Tempo máximo que um worker segura o processamento de uma conta.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
