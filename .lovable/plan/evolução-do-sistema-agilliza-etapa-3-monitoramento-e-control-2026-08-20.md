# Evolução do Sistema Agilliza - Etapa 3: Monitoramento e Controle VPS

Implementação de monitoramento em tempo real, indicadores de status do worker, dashboard operacional com dados reais e controles de servidor integrados à VPS.

## User Review Required

> [!IMPORTANT]
> O controle do servidor (reiniciar/parar/iniciar worker) depende de endpoints no backend da VPS Hostinger. Certifique-se de que a API do worker esteja configurada para receber essas requisições.

## Proposta Técnica

### 1. Banco de Dados e Heartbeat
- Criar tabela `worker_heartbeat` para registrar status, versão do worker, uptime e métricas de sistema (CPU/RAM).
- Adicionar campo `execution_id` na tabela de logs para agrupar eventos de um mesmo ciclo.

### 2. Dashboard Operacional (`/index.tsx`)
- Implementar indicadores reais: Sistema, IMAP, SMTP, Supabase.
- Totalizadores de processamento (Hoje): mensagens encontradas, analisadas, encaminhadas, etc.
- Tabela de "Últimos Encaminhamentos" consumindo dados da tabela `forwarded_emails`.
- Indicador permanente de status no topo (AppLayout).

### 3. Gerenciamento do Servidor (`/server.tsx`)
- Dashboard de recursos (CPU, RAM, Disco, Docker Containers) com dados reais vindos do heartbeat.
- Botões de ação protegidos: Reiniciar Worker, Parar, Iniciar, Reiniciar Web, Verificar Saúde.
- Lógica de confirmação e verificação de heartbeat pós-reinício (aguardar volta do sistema).

### 4. Monitoramento e Logs (`/monitoring.tsx` & `/logs.tsx`)
- Console "Matrix" em tempo real usando `supabase.channel` para streaming de logs.
- Tela de logs com filtros avançados: conta, período, nível, texto e execução.
- Implementação de "Timeline de Execução": ao clicar em um log, exibir todas as etapas daquela `execution_id`.

### 5. Experiência de Configuração (`/settings.tsx` & `/accounts.tsx`)
- Refatorar formulários longos para navegação por abas (Geral, Conta principal, Destinatários, Regras, Servidor, Histórico).
- Uso de cards leves e organização por contexto.

## Arquitetura de Integração
- **Frontend (TanStack)** -> **Server Functions** -> **Supabase/VPS API**
- O worker na VPS enviará heartbeats a cada 30-60 segundos.
- O frontend consultará o último heartbeat para determinar o status "Offline".
