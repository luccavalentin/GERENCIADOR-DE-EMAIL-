# Plano de Evolução - Agilliza Gerenciador de E-mail (Etapa 2 & 3)

Este plano foca na reestruturação do módulo de Contas de E-mail e na implementação da normalização determinística de palavras-chave, conforme os requisitos visuais e funcionais solicitados.

## 1. Módulo de Contas de E-mail (UX Sophisticated)
- **Renomeação**: Alterar "CREDENCIAIS" para "E-MAIL DE SAÍDA / CONTA PRINCIPAL".
- **Destinatários (Tag-based)**: Implementar interface de "E-MAILS DE RECEBIMENTO" permitindo múltiplos e-mails como tags (badges com 'x').
- **Validação de Destinatários**: Garantir que o array seja salvo como `["email1", "email2"]` e nunca como string única separada por ponto e vírgula.
- **Formulário Unificado**: Ajustar a tela de edição para suportar a nova hierarquia visual.

## 2. Motor de Palavras-Chave (Normalização Determinística)
- **Input Robusto**: Permitir entrada separada por vírgula, ponto e vírgula ou Enter.
- **Processamento Pré-Save**: Converter strings em arrays limpos antes de enviar ao Supabase.
- **Normalização em Tempo Real**: Garantir que `codigo` (base) capture variações como `CÓDIGO`, `código`, `codigos`, etc., usando a lógica `Unicode NFD + Lowercase + Includes`.

## 3. Navegação Global
- **Sincronização**: Finalizar a integração do seletor de conta no topo com as rotas de logs e monitoramento.
- **Estado Ativo**: Garantir que o `selectedConfigId` do `AppLayout` seja o padrão para carregamento de dados em todas as sub-telas.

## Detalhes Técnicos
- **Frontend**: Utilizar `radix-ui` (via shadcn) para o seletor elegante e componentes de Badge para destinatários.
- **Backend**: Manter `src/lib/email.functions.ts` como ponte segura, utilizando as funções de normalização já existentes no motor.
- **Database**: Atualizar `email_configurations` via RPC ou Server Functions para garantir integridade dos arrays.
