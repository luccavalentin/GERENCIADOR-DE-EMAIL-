# Etapa 3 de 3 — Refinamento Visual Final e Branding Agilliza

Este plano detalha a finalização do sistema com foco em polimento visual extremo, organização de formulários, branding exclusivo e remoção de qualquer referência a ferramentas de desenvolvimento.

## 1. Gestão de Contas (Contas Monitoradas)
- **Tabela Profissional:** Colunas para E-mail, Destinatários, Palavras-chave, IMAP, SMTP, Status, Última Execução e Ações.
- **Limpeza Visual:** Ocultar detalhes técnicos (host, porta) em popovers ou modais de detalhes.
- **Formulário de Cadastro/Edição:** Organizado em 4 abas ou seções claras:
  - **CONTA PRINCIPAL:** E-mail e Senha.
  - **SERVIDORES:** IMAP e SMTP.
  - **DESTINATÁRIOS:** Lista de e-mails para encaminhamento.
  - **REGRAS:** Palavras-chave com interface de tags.

## 2. Experiência de Palavras-chave
- **Interface de Tags:** Melhoria visual das tags `[código ×]`.
- **UX de Cadastro:** Suporte a separadores (vírgula, ponto e vírgula, Enter).
- **Descrição Educativa:** Texto fixo sobre a detecção automática de variações (case e acentos).

## 3. Gestão de Usuários
- **Tela de Auditoria:** Tabela com Usuário (Avatar com iniciais), E-mail, Status (Ativo/Inativo), Último Acesso e Criado em.
- **Ações:** Botão "+ Novo usuário" e menu de contexto.

## 4. Branding e Acabamento (Agilliza)
- **Branding Total:** Substituição de favicons, logotipos e textos "Lovable" por "AGILLIZA".
- **Créditos Discretos:** "Desenvolvido por Lucca Santana" apenas em áreas institucionais apropriadas.
- **Auditoria de Interface:**
  - Padronização de alinhamentos, espaçamentos e tipografia.
  - Eliminação de sombras pesadas e bordas excessivas.
  - Garantia de estados de loading e empty states em todas as telas.
- **Revisão de Conteúdo:** Remoção de qualquer texto técnico residual proveniente dos prompts ou requisitos internos.

## Regras Absolutas
- **Funcionalidade Intocada:** Nenhuma lógica de processamento, IMAP/SMTP, banco de dados ou RLS será alterada.
- **Zero Mock Data:** O sistema continuará operando estritamente com dados reais.
- **Estilo Enterprise:** O resultado final deve ser um SaaS pronto para produção, com aparência corporativa premium.
