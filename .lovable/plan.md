# Plano de Correção Obrigatória do Redesign

Revisão e ajuste do sistema de e-mails para alinhar com as instruções de conformidade, garantindo a preservação da identidade original e funcionalidades críticas.

## Ajustes de Identidade e Branding
- **Logo Original**: Substituir todas as referências de logos redesenhadas ou estilizadas pela logo original (`logo-original.png`).
- **Remoção de Branding Lovable**: Eliminar referências residuais (Made with Lovable, metadados de branding) em `__root.tsx`, `AppLayout.tsx` e `index.tsx`.
- **Autoria**: Adicionar "Desenvolvido por Lucca Santana" de forma discreta no rodapé, conforme solicitado.

## Refinamento de Interface (Remoção de Instruções)
- **Limpeza de Textos**: Remover comentários e textos literais de prompts que aparecem na interface (especialmente em `src/routes/index.tsx`).
- **Estados Neutros**: Substituir dados fictícios ou exemplos por estados neutros como "Aguardando dados" ou "Não disponível" quando não houver telemetria real.

## Correção de Módulos e Escopo
- **Escopo Restrito**: Remover qualquer menção ou elemento visual que sugira funcionalidades de CRM (Simulações, Propostas, Correspondente).
- **Contas de E-mail**: Garantir que a distinção entre "E-mail de Saída" (conta monitorada) e "E-mail de Recebimento" (destinatários) esteja clara e editável via interface.
- **Seletor de Contas**: Unificar a criação de novas contas no seletor global do header.

## Preservação Funcional e Estética
- **Motor de Processamento**: Manter integralmente a lógica de IMAP, SMTP, Worker e Normalização de Keywords em `email.functions.ts` e `processor.server.ts`.
- **Estética Corporativa**: Ajustar o CSS global e componentes para o estilo Navy/Corporativo sóbrio, removendo efeitos "hacker", neon ou gradientes excessivos.
- **Logs Reais**: Assegurar que as telas de Monitoramento e Logs consumam exclusivamente dados da tabela `email_logs`.

## Detalhes Técnicos
- **Arquivos Afetados**:
    - `src/routes/index.tsx` (Limpeza e Dashboard)
    - `src/components/layout/AppLayout.tsx` (Logo, Sidebar, Header)
    - `src/routes/__root.tsx` (Metadata e PWA)
    - `src/styles.css` (Temas Navy e Premium Card)
    - `src/routes/server.tsx` (Remoção de metrics fixos)
    - `src/routes/monitoring.tsx` (Console sóbrio)
- **Validação**: Auditoria visual de cada rota para confirmar ausência de placeholders e botões sem funcionalidade.
