import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { AppLayout, useActiveAccount } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { getDailyStats, getWorkerStatus, getLogs } from "@/lib/email.functions";
import { InfrastructureHealth } from "@/components/dashboard/InfrastructureHealth";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SystemStats, LogEntry } from "@/lib/types";

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
  const { selectedConfigId } = useActiveAccount();
  const { data: session } = useQuery({ 
    queryKey: ['session'], 
    queryFn: async () => (await supabase.auth.getSession()).data.session 
  });
  
  const { data: stats } = useQuery({
    queryKey: ['stats', selectedConfigId],
    queryFn: () => getDailyStats({ data: { userId: session?.user?.id || '', configId: selectedConfigId } }),
    enabled: !!session?.user?.id
  }) as { data: SystemStats | undefined };

  const { data: workerStatus } = useQuery({
    queryKey: ['workerStatus'],
    queryFn: () => getWorkerStatus({}),
    refetchInterval: 30000
  });

  const { data: recentLogsData } = useQuery({
    queryKey: ['recentLogs', selectedConfigId],
    queryFn: () => getLogs({ data: { limit: 10, configId: selectedConfigId || undefined } }),
  });

  const recentLogs = recentLogsData?.logs as LogEntry[] | undefined;

  const isWorkerOnline = workerStatus?.status === 'online';
  const isDbOnline = workerStatus?.db_status === 'online';
  const hasConfigs = workerStatus?.configs && workerStatus.configs.length > 0;
  
  const imapStatus = !hasConfigs ? 'aguardando' : 
    workerStatus.configs.every((c: any) => c.status === 'success') ? 'operacional' : 
    workerStatus.configs.some((c: any) => c.status === 'error') ? 'falha' : 'operacional';
    
  const smtpStatus = !hasConfigs ? 'aguardando' : 
    workerStatus.configs.every((c: any) => c.status === 'success') ? 'operacional' : 
    workerStatus.configs.some((c: any) => c.status === 'error') ? 'falha' : 'operacional';

  const globalStatusLabel = isWorkerOnline ? "Worker Operacional" : "Atenção Requerida";
  const globalStatusColor = isWorkerOnline ? "text-green-600" : "text-red-600";
  const globalStatusIcon = isWorkerOnline ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />;
  const globalStatusBg = isWorkerOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg font-mono text-xs whitespace-pre-wrap break-all">
        ADICIONAR CONTROLE REAL DO SERVIÇO NA VPS COM COMUNICAÇÃO FRONTEND ↔ BACKENDQuero adicionar no sistema uma área de controle operacional REAL do worker de e-mail.IMPORTANTE:NÃO criar botões fictícios.NÃO retornar sucesso sem executar a ação real.NÃO simular restart.NÃO executar comandos diretamente no navegador.NÃO expor SSH, root, senha da VPS ou terminal no frontend.O serviço controlado é o WORKER DE E-MAIL que roda na VPS Hostinger através de Docker Compose.O FRONTEND deve se comunicar com um BACKEND REAL hospedado na VPS.O frontend NÃO pode executar Docker.O frontend apenas envia requisições autenticadas para a API da VPS.==================================================ARQUITETURA OBRIGATÓRIA==================================================Fluxo:FRONTEND↓API SEGURA NA VPS↓Docker Compose↓Worker↓Heartbeat/Status↓API retorna estado real↓FRONTEND atualiza interfaceNão criar lógica paralela no frontend.Não simular estado localmente.==================================================TELA SERVIDOR==================================================Criar seção:CONTROLE DO SERVIÇOMostrar estado atual real:Worker🟢 Em execução🟡 Pausado🔴 Parado⚪ Estado desconhecidoO status deve vir da API da VPS.==================================================ENDPOINTS REAIS==================================================Criar API administrativa protegida na VPS.Endpoints:GET /api/worker/statusPOST /api/worker/startPOST /api/worker/stopPOST /api/worker/restartOpcional:POST /api/worker/pauseEsses endpoints devem executar somente ações previamente autorizadas.Nunca permitir comando arbitrário.==================================================COMANDOS REAIS NA VPS==================================================O backend da VPS pode executar internamente ações equivalentes a:PARAR:cd /opt/agilliza-email && docker compose stop workerINICIAR:cd /opt/agilliza-email && docker compose start workerREINICIAR:cd /opt/agilliza-email && docker compose restart workerSTATUS:cd /opt/agilliza-email && docker compose ps workerIMPORTANTE:Esses comandos devem existir SOMENTE no backend da VPS.Nunca enviar esses comandos ao navegador.==================================================FRONTEND==================================================O frontend deve consumir a API real.Exemplo conceitual:GET /api/worker/statusretorna algo semelhante a:{"{"}  "status": "running",  "containerRunning": true,  "heartbeat": "2026-08-21T14:32:10Z",  "healthy": true{"}"}O frontend deve usar essa resposta para definir o estado visual.Não manter:const status = "online"Não hardcode status.==================================================PAUSAR SERVIÇO==================================================Ao clicar em:PAUSAR SERVIÇOFrontend:1. abre confirmação;2. usuário confirma;3. envia requisição autenticada:POST /api/worker/stop4. exibe:Pausando...5. aguarda resposta da VPS;6. consulta novamente:GET /api/worker/status7. somente quando confirmar container parado mostrar:Serviço pausado com sucesso.Se falhar:Não foi possível pausar o serviço.Mostrar erro real retornado pelo backend quando apropriado.==================================================INICIAR SERVIÇO==================================================Ao clicar:INICIAR SERVIÇOFrontend envia:POST /api/worker/startDepois:Iniciando...Em seguida deve consultar status real.Não mostrar sucesso apenas porque o POST retornou 200.Validar:container ativo+heartbeat recenteSomente depois mostrar:Serviço iniciado com sucesso.==================================================REINICIAR SERVIÇO==================================================Fluxo obrigatório:Frontend→ confirmação→ POST /api/worker/restart→ backend executa restart real→ frontend mostra Reiniciando...→ frontend consulta status→ valida container→ aguarda heartbeat→ confirma sucessoMensagem:"O serviço ficará indisponível por alguns segundos durante a reinicialização. Deseja continuar?"Se o container voltar mas o heartbeat não:"Container iniciado, porém o worker ainda não confirmou atividade."==================================================ATUALIZAÇÃO AUTOMÁTICA==================================================A tela Servidor deve atualizar o status automaticamente.Pode consultar:GET /api/worker/statusem intervalo controlado, por exemplo a cada 5 ou 10 segundos.Evitar polling agressivo.Durante operação manual, consultar com frequência maior por alguns segundos até confirmar o novo estado.==================================================ESTADO VISUAL==================================================RUNNING:🟢 Em execuçãoPausar = habilitadoIniciar = desabilitadoReiniciar = habilitadoSTOPPED:🔴 ParadoPausar = desabilitadoIniciar = habilitadoReiniciar = habilitado se suportadoSTARTING:🟡 Iniciando...Todos os botões desabilitados.RESTARTING:🟡 Reiniciando...Todos os botões desabilitados.UNKNOWN:⚪ Estado desconhecidoMostrar:Não foi possível consultar a VPS.==================================================AUTENTICAÇÃO ENTRE FRONTEND E VPS==================================================A API da VPS deve ser protegida.O frontend deve enviar o token de sessão do usuário autenticado.Exemplo conceitual:Authorization: Bearer &lt;TOKEN&gt;A VPS deve validar esse token.Não confiar somente no frontend.Não permitir que qualquer pessoa que conheça a URL execute restart.==================================================AUTORIZAÇÃO==================================================Somente usuários autorizados devem poder:pausariniciarreiniciarO backend deve validar a permissão.Não basta esconder o botão no frontend.==================================================CORS==================================================Configurar CORS de forma restrita.Permitir somente os domínios reais utilizados pelo frontend.Durante desenvolvimento, permitir apenas os previews necessários.Não utilizar:Access-Control-Allow-Origin: *em produção para endpoints administrativos.==================================================SEGURANÇA==================================================Nunca enviar ao frontend:senha rootSSH passwordprivate keySUPABASE_SERVICE_ROLE_KEYsegredos Dockervariáveis privadascredenciais internas da VPSImplementar:rate limit;auditoria;autorização;validação de payload;timeout;tratamento de erro.==================================================LOG OPERACIONAL==================================================Registrar cada ação:usuáriodata/horaaçãoresultadoIP quando disponívelestado anteriorestado posteriorExemplos:Lucca Santana solicitou pausa do WorkerWorker pausado com sucessoLucca Santana iniciou o WorkerHeartbeat confirmadoLucca Santana reiniciou o WorkerWorker voltou a operarEsses logs devem aparecer na página Logs.==================================================HEARTBEAT==================================================O worker deve possuir heartbeat real.A API deve conseguir determinar:último heartbeattempo desde heartbeatcontainer rodando ou nãoExemplo:containerRunning = trueheartbeatAge = 4 segundos=> saudávelcontainerRunning = trueheartbeatAge = 180 segundos=> atençãocontainerRunning = false=> parado==================================================NÃO ALTERAR O MOTOR DE E-MAIL==================================================Preservar integralmente:IMAPSMTPSupabasededuplicaçãoUIDMessage-IDpalavras-chaveencaminhamentoemail_processing_stateDocker existenteconfiguraçõesworker atualAdicionar somente a camada administrativa segura.==================================================VALIDAÇÃO FINAL OBRIGATÓRIA==================================================Não considerar concluído apenas porque os botões apareceram.Testar de ponta a ponta:1. Abrir frontend.2. Status mostra estado real.3. Clicar Pausar.4. Confirmar que container realmente parou.5. Frontend muda para Parado.6. Clicar Iniciar.7. Container realmente inicia.8. Heartbeat volta.9. Frontend mostra Em execução.10. Reiniciar.11. Container reinicia de verdade.12. Frontend aguarda retorno.13. Logs registram as ações.Ao finalizar, informe:- URL base da API da VPS;- endpoints criados;- método de autenticação;- regra de autorização;- como CORS foi configurado;- comando real executado por cada endpoint;- como status é obtido;- como heartbeat é validado;- como frontend consome a API;- como erros são exibidos;- como ações ficam registradas.NÃO criar nenhuma implementação visual falsa.FRONTEND E VPS DEVEM ESTAR REALMENTE CONECTADOS.
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Painel de Monitoramento</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Infraestrutura e timeline operacional de e-mails.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Global</span>
            <span className={cn("text-xs font-bold", globalStatusColor)}>
              {globalStatusLabel}
            </span>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
            globalStatusBg
          )}>
            {globalStatusIcon}
          </div>
        </div>
      </div>

      <InfrastructureHealth 
        isWorkerOnline={isWorkerOnline}
        isDbOnline={isDbOnline}
        imapStatus={imapStatus}
        smtpStatus={smtpStatus}
      />

      <StatCards stats={stats} />
      
      <RecentActivity logs={recentLogs} />
    </div>
  );
}
