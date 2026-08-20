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
        {`5. CONTAS DE E-MAIL EM LISTA SUSPENSA

Não quero vários cards enormes das contas na tela principal.

Criar um seletor elegante no topo:

Conta monitorada

Exemplo:

lucca@agilliza.net.br ▼

Ao clicar, abrir dropdown contendo todas as contas cadastradas.

No final da lista:

+ Adicionar nova conta

Também colocar botão destacado:

+ Nova conta

Quando selecionar outra conta, todas as informações da tela devem mudar para aquela configuração:

status;
logs;
palavras-chave;
destinatários;
IMAP;
SMTP;
histórico;
métricas.
6. RENOMEAR A ÁREA "CREDENCIAIS"

Na configuração atual existe:

CREDENCIAIS

com:

E-mail

Senha / App Password

Não quero o título Credenciais.

Alterar para:

E-MAIL DE SAÍDA / CONTA PRINCIPAL

Essa é a conta principal responsável pelo monitoramento e pelo encaminhamento.

Exibir:

E-mail de saída

lucca@agilliza.net.br

Senha / App Password

••••••••••

Logo abaixo, criar seção separada:

E-MAILS DE RECEBIMENTO

Esses são os endereços que receberão os e-mails encaminhados pela conta principal.

Não hardcode nenhum endereço.

O usuário deve poder:

adicionar;
editar;
remover;
reorganizar.

Interface sugerida:

paula@... ×

andy@... ×

outro@email.com ×

+ Adicionar destinatário

Cada endereço precisa ser salvo como um item individual no array destinations.

NUNCA salvar:

["email1; email2; email3"]

Salvar:

["email1","email2","email3"]

7. PALAVRAS-CHAVE — CORRIGIR DEFINITIVAMENTE

O campo:

Palavras-chave (separadas por vírgula, ponto e vírgula ou Enter)

deve realmente funcionar.

O usuário pode escrever:

codigo

ou:

codigo; token; senha

ou pressionar Enter entre palavras.

Antes de salvar, transformar em array real:

["codigo","token","senha"]

NUNCA:

["codigo; token; senha"]
8. VARIAÇÕES DA PALAVRA "CÓDIGO"

Não quero cadastrar manualmente:

codigo

Código

CODIGO

CÓDIGO

O sistema deve normalizar automaticamente.

Manter/aprimorar a função existente:

converter para minúsculo;
remover acentuação;
Unicode NFD;
ignorar caixa;
busca por inclusão.

Portanto, se a palavra configurada for:

codigo

deve reconhecer automaticamente:

codigo

Código

CODIGO

CÓDIGO

código

codigos

códigos

CODIGOS

CÓDIGOS

codigo123

123codigo

meucodigo

codigo de acesso

código de segurança

código de confirmação

código de verificação

seu código é 123456

seus códigos são 123 e 456

Não utilizar IA para isso.

Utilizar normalização determinística.

Aplicar a mesma lógica a qualquer palavra-chave cadastrada.`}
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

