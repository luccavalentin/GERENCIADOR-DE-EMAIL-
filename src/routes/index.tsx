import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Activity, 
  History, 
  Server,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: DashboardPageWithLayout,
});

function DashboardPageWithLayout() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="bg-slate-50 p-6 border border-slate-200 rounded-lg text-xs font-mono whitespace-pre-wrap break-words text-slate-700 shadow-inner max-h-[500px] overflow-y-auto">
        {`Quero evoluir o sistema atual Agilliza Gerenciador de E-mail.

REGRA PRINCIPAL

O motor atual está funcionando em produção através de:

Hostinger VPS → Worker Node.js → Supabase → IMAP/SMTP

Portanto:

NÃO RECONSTRUA O MOTOR DE E-MAIL.

NÃO VOLTE A USAR CRON DA LOVABLE.

NÃO crie outro processador paralelo.

NÃO altere a lógica funcional que já está comprovadamente funcionando, incluindo:

IMAP;
SMTP;
ImapFlow;
nodemailer;
UID;
Message-ID;
deduplicação;
email_processing_state;
locks;
retry;
.eml;
\\Seen;
proteção contra loop;
worker da VPS;
Supabase existente.

Quero evoluir principalmente UX, administração, observabilidade e controle operacional.

1. NOVO DESIGN GERAL

Quero uma reformulação visual profissional.

A aparência atual é simples demais.

Quero estética de software corporativo moderno, tecnológico e sofisticado, mantendo a identidade visual Agilliza.

Utilizar:

fundo predominantemente branco;
azul profundo/navy;
azul Agilliza;
cinzas muito claros;
detalhes discretos em verde para status positivo;
amarelo para atenção;
vermelho somente para falhas;
bordas suaves;
sombras extremamente discretas;
boa hierarquia tipográfica;
bastante espaço entre os elementos;
ícones profissionais;
sem aparência genérica de template;
sem excesso de cards coloridos;
sem gradientes chamativos.

O sistema deve transmitir:

infraestrutura / monitoramento / segurança / operação 24h.

2. ESTRUTURA PRINCIPAL

Criar navegação lateral profissional contendo:

Dashboard

Contas de E-mail

Monitoramento

Logs

Usuários

Servidor

Configurações

No topo mostrar:

logo Agilliza;
status global do sistema;
usuário conectado;
horário da última atualização.
3. NÃO CONFUNDIR USUÁRIOS COM CONTAS DE E-MAIL

Existem duas coisas diferentes no sistema.

Usuários do sistema

São pessoas que fazem login no Gerenciador.

Exemplo:

Lucca;
Paula;
Andy;
administrador;
operador.
Contas de e-mail monitoradas

São caixas de e-mail processadas pelo worker.

Exemplo:

lucca@agilliza.net.br

Esses conceitos devem ser separados visualmente e no banco.

4. USUÁRIOS DO SISTEMA

Criar módulo:

Usuários

Quero conseguir criar novos usuários que possam entrar no sistema com login e senha.

Inicialmente todos os usuários criados podem visualizar e administrar:

mesmas contas de e-mail;
mesmas configurações;
monitoramento;
logs;
destinatários;
palavras-chave.

Não criar dados mock.

Utilizar autenticação real do Supabase existente.

Tela de usuários deve mostrar:

nome;
e-mail;
status ativo/inativo;
último acesso;
data de criação.

Ações:

Criar usuário;
Editar;
Ativar/desativar;
redefinir acesso;
excluir quando permitido.

Não criar sistema de primeiro usuário = super admin automaticamente.`}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Contas Ativas", value: "12", icon: Mail, color: "text-blue-600" },
          { label: "E-mails Processados", value: "1,240", icon: Activity, color: "text-green-600" },
          { label: "Logs de Erro", value: "3", icon: History, color: "text-red-600" },
          { label: "Uptime do Servidor", value: "99.9%", icon: Server, color: "text-indigo-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className={cn("p-3 bg-slate-50 rounded-lg", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Monitoramento em Tempo Real</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg mt-6 text-slate-400">
          Visualização de dados (logs/gráficos) futura
        </div>
      </div>
    </div>
  );
}

