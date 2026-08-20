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
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg text-[10px] font-mono whitespace-pre-wrap break-words">
        erro
        ---


        8. VARIAÇÕES DA PALAVRA "CÓDIGO"
        Não quero cadastrar manualmente:
        codigo
        Código
        CODIGO
        CÓDIGO
        O sistema deve normalizar automaticamente.
        Manter/aprimorar a função existente: converter para minúsculo; remover acentuação; Unicode NFD; ignorar caixa; busca por inclusão.
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
        Aplicar a mesma lógica a qualquer palavra-chave cadastrada.

        9. MONITORAMENTO EM TEMPO REAL
        Criar nova tela:
        MONITORAMENTO AO VIVO
        Quero enxergar o funcionamento do worker em tempo real.
        Exibir uma interface semelhante a console profissional.
        Exemplo:
        18:42:01  Worker ativo
        18:42:02  Conectando IMAP
        18:42:02  TLS estabelecido
        18:42:03  Autenticação aceita
        18:42:03  INBOX aberta
        18:42:03  3 mensagens encontradas
        18:42:04  Palavra-chave detectada
        18:42:05  SMTP conectado
        18:42:05  E-mail encaminhado
        18:42:06  Ciclo concluído
        Atualizar automaticamente sem precisar atualizar a página.
        Utilizar os logs reais existentes no Supabase.
        Não criar logs fictícios.

        10. STATUS DO WORKER
        No topo do sistema mostrar um indicador permanente:
        🟢 Sistema operacional
        ou
        🟡 Atenção
        ou
        🔴 Worker offline
        Mostrar: worker ativo/inativo; última execução; último heartbeat; última conexão IMAP; último encaminhamento; último erro; tempo desde último heartbeat.
        Se o heartbeat ficar antigo, mostrar automaticamente:
        Worker possivelmente offline

        11. DASHBOARD OPERACIONAL
        Criar dashboard inicial contendo:
        SISTEMA
        Worker 🟢 Online
        IMAP 🟢 Conectado
        SMTP 🟢 Operacional
        Supabase 🟢 Conectado
        PROCESSAMENTO
        Hoje: mensagens encontradas; mensagens analisadas; palavras-chave detectadas; encaminhadas; ignoradas; duplicadas; erros.
        ÚLTIMOS ENCAMINHAMENTOS
        Tabela:
        | Horário | Conta | Remetente | Assunto | Destino | Status |
        Dados reais.

        12. TELA DE LOGS
        Criar página:
        Logs
        Com atualização automática.
        Filtros: Todas; Info; Sucesso; Atenção; Erro.
        Também permitir filtrar por: conta; período; texto; execução.
        Cada log deve mostrar: data/hora; nível; conta; execução; mensagem.
        Criar botão:
        Limpar visualização
        Isso NÃO deve apagar o banco.

        13. DETALHES DA EXECUÇÃO
        Cada processamento deve ter um execution_id.
        Ao clicar em uma execução, abrir timeline:
        Execução 8fca...
        18:55:01 Iniciada
        18:55:01 Lock adquirido
        18:55:02 IMAP conectado
        18:55:02 INBOX aberta
        18:55:03 2 mensagens analisadas
        18:55:04 Palavra-chave detectada
        18:55:05 E-mail enviado
        18:55:05 Execução finalizada
        Se houver erro, mostrar exatamente a etapa.

        14. CONTROLE DO SERVIDOR / WORKER
        Criar página:
        SERVIDOR
        Mas atenção:
        NÃO permita execução arbitrária de comandos Linux pelo navegador.
        Quero ações controladas e previamente definidas.
        Botões:
        Reiniciar Worker
        Parar Worker
        Iniciar Worker
        Reiniciar Aplicação Web
        Verificar Saúde
        Para ações destrutivas mostrar confirmação:
        Tem certeza que deseja reiniciar o worker?
        Esses botões devem chamar endpoints protegidos no backend da VPS.
        NÃO colocar: senha SSH; root password; shell; terminal aberto; comandos arbitrários
        no frontend.
        Somente usuários autorizados podem executar essas ações.

        15. STATUS DO SERVIDOR
        Na página Servidor mostrar:
        VPS Online; uptime; memória RAM; CPU; armazenamento; versão do worker; última inicialização.
        Worker PID/container; status; uptime; última execução; última falha.
        Docker container web; container worker; status.
        Atualizar periodicamente.

        16. REINÍCIO SEGURO
        Quando clicar:
        Reiniciar Worker
        Fluxo:
        solicitação → confirmação → backend VPS → restart controlado → heartbeat → confirmação
        Na interface:
        Reiniciando...
        Depois:
        🟢 Worker reiniciado com sucesso
        Se não voltar:
        🔴 Worker não respondeu após reinicialização
        Nunca mostrar sucesso sem verificar heartbeat.

        17. BOTÃO "PROCESSAR AGORA"
        Continuar oferecendo:
        Processar agora
        Porém deve acionar o worker da VPS, não criar processamento paralelo localmente.
        Não reativar cron antigo.
        O worker permanente continua sendo a única autoridade de processamento.

        18. TESTAR IMAP E SMTP
        Manter:
        Testar IMAP
        Testar SMTP
        Mas agora o teste deve acontecer a partir da infraestrutura da VPS, porque já comprovamos que o ambiente de execução pode apresentar problemas de socket.
        Exibir resultado por etapas:
        IMAP DNS; TCP; TLS; autenticação; INBOX.
        SMTP DNS; TCP; TLS; autenticação.

        19. EXPERIÊNCIA VISUAL DAS CONFIGURAÇÕES
        Não quero formulário longo e pesado.
        Separar em abas:
        Geral
        Conta principal
        Destinatários
        Regras
        Servidor
        Histórico
        Dentro de cada aba usar cards leves e bem organizados.

        20. PRESERVAÇÃO DOS DADOS
        Não excluir nem recriar: usuários existentes; contas existentes; senhas; logs;
        email_processing_state;
        forwarded_emails; configurações; histórico.
        Fazer migrations incrementais quando necessário.

        21. NÃO CRIAR DADOS MOCK
        Não quero:
        Servidor Online
        23 mensagens
        99% uptime
        se isso não vier de dados reais.
        Qualquer informação operacional deve vir: Supabase; worker; backend da VPS.
        Se a informação ainda não estiver disponível, mostrar:
        Aguardando dados
        e não inventar valor.

        22. NÃO QUEBRAR O QUE JÁ FOI CORRIGIDO
        Já foram identificados e corrigidos problemas anteriores envolvendo: socket IMAP no runtime antigo; Node 20/WebSocket; funções RPC duplicadas; cron antigo; deduplicação; parsing de arrays; processamento na VPS.
        NÃO recrie esses problemas.
        A aplicação de produção será executada na Hostinger VPS.
        O Supabase continuará sendo utilizado.

        23. IMPLEMENTAÇÃO EM ETAPAS
        Não faça tudo desordenadamente.
        Implementar nesta sequência:
        ETAPA 1 Novo layout/navegação sem alterar motor.
        ETAPA 2 Usuários do sistema.
        ETAPA 3 Dropdown de contas monitoradas.
        ETAPA 4 E-mail de saída + e-mails de recebimento.
        ETAPA 5 Keywords/arrays/normalização.
        ETAPA 6 Monitoramento em tempo real.
        ETAPA 7 Logs/timeline.
        ETAPA 8 Painel do servidor e controle seguro do worker.
        ETAPA 9 Validação completa.
        Ao terminar cada etapa, verificar que o fluxo:
        IMAP → detecção → SMTP → Supabase
        continua funcionando.
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

