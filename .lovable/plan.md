# Diagnóstico Técnico e Correção do Sistema de Monitoramento

O objetivo é diagnosticar e corrigir os erros de concorrência (lock) e falhas de conexão IMAP ("Unexpected close"), garantindo que o monitoramento funcione de forma robusta e transparente durante os testes manuais.

## Medidas Técnicas

### 1. Desativação Temporária do Processamento Automático
- O endpoint de cron (`src/routes/api/public/cron/monitor.ts`) será modificado para ignorar todas as configurações durante a fase de testes, respondendo com um status informativo.
- Isso impede que execuções automáticas interfiram nos testes manuais e gerem locks indesejados.

### 2. Limpeza de Locks Órfãos
- Remoção manual do lock ativo para `lucca@agilliza.net.br` que está impedindo novas execuções.
- O campo `processing_lock_id` e `processing_lock_until` serão resetados para esta configuração específica.

### 3. Diagnóstico e Refinamento do IMAP
- **Conexão Direta TLS**: Garantir que a configuração `secure: true` seja usada para a porta 993, evitando tentativas de STARTTLS.
- **Captura de Erros Detalhada**: O erro "Unexpected close" será enriquecido capturando todas as propriedades do objeto de erro da biblioteca `imapflow` (message, code, response, etc.) e salvando nos logs do banco.
- **Teste Isolado**: O botão "Testar IMAP" no painel será desacoplado do mecanismo de lock global, permitindo diagnosticar a conexão mesmo que o processamento principal esteja teoricamente "bloqueado".

### 4. Melhoria da Interface (UI)
- Correção da lógica do modal para que, em caso de bloqueio por concorrência, o status do IMAP seja exibido como "Não testado" em vez de "Falha".
- Implementação de logs sequenciais no backend para rastrear cada etapa (TCP, TLS, Auth, INBOX).

## Respostas Finais Esperadas (Checklist)
Ao final da implementação, os seguintes pontos serão validados e informados:
- Status da desativação do cron automático.
- Detalhes do lock encontrado (quem, quando, validade).
- Resultado do teste TCP/TLS/Auth para `imap.uhserver.com`.
- Causa raiz identificada para o fechamento inesperado da conexão.

---

**Detalhes Técnicos para o Desenvolvedor:**
- Arquivos afetados: `src/lib/email.functions.ts`, `src/routes/index.tsx`, `src/routes/api/public/cron/monitor.ts`.
- A biblioteca `imapflow` será configurada com `connectionTimeout` e `greetingTimeout` aumentados para 30s.
- Logs serão inseridos na tabela `email_logs` com níveis `info` e `error`.
