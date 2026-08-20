# Evolução do Sistema Agilliza - Etapa 2: Usuários e UX

Este plano foca na implementação do módulo de usuários, melhorias na navegação de contas e refinamento visual conforme solicitado, mantendo o motor de e-mail intacto.

## Mudanças

### Frontend e UI

- **Módulo de Usuários (`/users`)**
  - Implementar diálogo de criação de usuário com campos: Nome Completo, E-mail, Senha.
  - Implementar edição de usuário e redefinição de acesso (fluxo de reset de senha do Supabase).
  - Adicionar suporte a status ativo/inativo integrado ao banco.
- **Navegação de Contas (`AppLayout.tsx`)**
  - Refinar o dropdown de "Conta Monitorada" no topo.
  - Adicionar botão "+ Nova conta" destacado e no final da lista.
  - Garantir que a troca de conta atualize o estado global (via URL ou Contexto) para refletir métricas, logs e configurações da conta selecionada.
- **Refatoração de Configurações (`/accounts` ou similar)**
  - Renomear seção "CREDENCIAIS" para "E-MAIL DE SAÍDA / CONTA PRINCIPAL".
  - Criar seção "E-MAILS DE RECEBIMENTO" com suporte a múltiplos destinos (tags editáveis).
  - Implementar normalização de palavras-chave (split por vírgula/ponto-e-vírgula/Enter) antes do salvamento.

### Backend e Lógica de Negócio

- **Gerenciamento de Usuários (`email.functions.ts`)**
  - Criar função `createSystemUser` para registrar novos usuários no Auth do Supabase e criar perfil.
  - Criar funções para gerenciar `is_active` e reset de senha.
- **Normalização de Dados**
  - Implementar utilitário de normalização determinística para palavras-chave (NFD, lowercase, remoção de acentos) no frontend antes de enviar ao servidor.
  - *Nota: O motor já possui lógica de normalização, mas garantiremos que os dados salvos estejam limpos.*

### Banco de Dados (Migrations)

- Criar migration para adicionar campo `is_active` (se não existir) e garantir que a tabela `profiles` suporte os dados necessários.

## Detalhes Técnicos

- **Estética**: Navy (#0000A0), fundo branco, sombras discretas, tipografia profissional.
- **Arquitetura**: O estado da "Conta Ativa" será persistido preferencialmente na URL (ex: `?configId=...`) para facilitar o compartilhamento de links e recarregamento, ou via um `ActiveAccountProvider`.
- **Segurança**: Operações de usuário via `service_role` (no servidor) para permitir que um admin crie outros usuários.

## Verificação

- Testar criação de usuário e login.
- Verificar se a troca de conta no topo altera os dados exibidos no Dashboard e Logs.
- Validar se múltiplos destinatários são salvos como array JSON puro `["a@b.com", "c@d.com"]`.
- Confirmar se a palavra-chave "CÓDIGO" digitada de várias formas é salva de forma normalizada ou se a busca a encontra corretamente.
