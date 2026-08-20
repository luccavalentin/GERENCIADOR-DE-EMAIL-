# Migração de Execução para VPS (Worker Node.js)

Este plano descreve a criação de um worker Node.js independente para processar e-mails 24/7 em uma VPS (Hostinger), mantendo o Supabase como backend de dados e autenticação.

## Objetivos
- Criar um worker Node.js que execute a lógica de processamento de e-mails.
- Preparar o projeto para deploy via Docker (Web + Worker).
- Manter a integração total com o Supabase existente (tabelas, RLS, logs).
- Garantir que o worker seja resiliente (reinício automático).

## Alterações Técnicas

### 1. Novo Worker (`/worker/index.ts`)
- Script Node.js puro usando `@supabase/supabase-js`, `imapflow`, e `nodemailer`.
- Lógica:
    - Loop infinito com intervalo configurável (heartbeat).
    - Busca configurações ativas no Supabase.
    - Executa `processEmailsForConfig` (reutilizando a lógica de lock e deduplicação).
    - Reporta logs e estados diretamente no banco.

### 2. Dockerização
- `Dockerfile`: Configuração multi-stage para servir a aplicação TanStack Start (web) e o Worker.
- `docker-compose.yml`: Definição dos serviços `web` e `worker`, gerenciando variáveis de ambiente e volumes.

### 3. Adaptação de Código
- Extrair a lógica central de processamento de `src/lib/email.functions.ts` para um utilitário compartilhado que possa ser importado pelo worker (evitando duplicação de lógica).

## Arquivos Criados/Modificados
- `worker/package.json`: Dependências específicas do worker.
- `worker/index.ts`: Ponto de entrada do worker.
- `Dockerfile`: Configuração de build.
- `docker-compose.yml`: Orquestração.
- `.env.example`: Template de variáveis para a VPS.

## Variáveis de Ambiente Necessárias (VPS)
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave para bypass de RLS no backend do worker.
- `EMAIL_MONITOR_CRON_SECRET`: Para autenticação se necessário.
- `DATABASE_URL`: Se houver conexões diretas via Prisma/Drizzle (opcional, foco em Supabase JS).

## Resumo para o Usuário
Após a implementação, você terá uma pasta `worker` pronta para ser movida para a VPS. O sistema continuará usando o Supabase para tudo, mas o "motor" de e-mail rodará no seu servidor, permitindo execução contínua sem limites de runtime da plataforma.

A lógica de "codigo", normalização, \Seen e Message-ID será 100% preservada no worker.
