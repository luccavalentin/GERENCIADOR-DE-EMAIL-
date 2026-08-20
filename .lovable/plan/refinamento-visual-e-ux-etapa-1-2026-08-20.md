# Refinamento Visual e UX - Etapa 1

Este plano foca exclusivamente no refinamento visual, UX e organização da interface para transformar o sistema Agilliza em um software empresarial premium. Nenhuma funcionalidade de backend ou regras de negócio serão alteradas.

## Design System & Identidade
- **Paleta de Cores:**
  - Azul Profundo (Navy) `#0000A0` para estrutura e navegação.
  - Azul Agilliza para destaques e interações.
  - Fundos em Cinza Muito Claro `#f8fafc`.
  - Superfícies (Cards, Modais) em Branco `#ffffff`.
- **Tipografia & Espaçamento:** Padronização global com bordas discretas e sombras suaves.
- **Microinterações:** Adição de transições suaves (150-250ms) em botões e menus.

## Componentes de Layout
### Sidebar
- Layout fixo à esquerda com fundo Navy ou Branco (conforme identidade Agilliza).
- Ícones lineares consistentes.
- Destaque elegante para o item selecionado.
- Logo Agilliza no topo com espaçamento generoso.

### Header
- Compacto e profissional.
- **Seletor de Conta:** Exibição do e-mail, ícone e status. Dropdown para alternar contas e adicionar novas.
- **Lado Direito:** Status geral do sistema, nome do usuário logado e menu de perfil.

## Páginas
### Dashboard (Painel Operacional)
- **Saúde do Sistema:** Indicadores reais (Worker, IMAP, SMTP, DB, VPS) com cores semânticas (verde/amarelo/vermelho).
- **Métricas:** Cards sofisticados para "Processados", "Encaminhados", "Ignorados", "Duplicados" e "Erros".
- **Atividade Recente:** Timeline limpa com eventos reais.

### Contas de E-mail
- Listagem em tabela premium.
- Diálogo de configuração (AccountDialog) organizado por abas.

### Usuários
- Interface de gestão de acessos integrada ao Supabase Auth.

### Servidor & Monitoramento
- Visualização de logs em tempo real (Matrix-style refinado para Agilliza).
- Métricas reais de hardware da VPS Hostinger.

## Detalhes Técnicos
- Atualização do `src/styles.css` para refletir as variáveis de tema.
- Refatoração dos componentes em `src/components/layout/` e `src/routes/`.
- Garantia de que nenhum dado mock será exibido (uso de estados de carregamento ou "Aguardando dados").
