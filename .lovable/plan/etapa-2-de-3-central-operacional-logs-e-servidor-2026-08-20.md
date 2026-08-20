# Etapa 2 de 3 — Central Operacional, Logs e Servidor

Este plano detalha o redesign visual das telas de Monitoramento, Logs e Servidor, mantendo a identidade premium da Agilliza estabelecida na etapa anterior.

## 1. Monitoramento (Central Operacional)
- **Design do Console:** Fundo navy muito escuro (#000033 ou similar), tipografia monoespaçada (`font-mono`) exclusiva para os logs.
- **Hierarquia Visual:** Classificação clara por cores para INFO, SUCCESS, WARNING e ERROR.
- **Barra de Ferramentas:**
  - Indicador "● Ao vivo" (pulsante).
  - Botão "Pausar" (para congelar a visualização).
  - Botão "Limpar visualização" (limpa apenas o estado local do componente, não o banco).
  - Toggle "Auto-scroll".
- **Dados Reais:** Exibição estruturada de horário, conta, evento, keyword detectada, destino e resultado/erro.

## 2. Logs (Auditoria Profissional)
- **Filtros Avançados:** Filtros por conta, período (data), nível de log e busca textual.
- **Tabela Premium:** Colunas para Horário, Nível, Conta, Execução e Evento.
- **Gestão de IDs:** Resumo de IDs longos (ex: `8fca...6ac9`) com tooltip ou clique para ver o ID completo e metadados JSON.

## 3. Servidor (Infraestrutura)
- **Status da VPS:** Visualização de CPU, Memória, Disco e Uptime usando barras de progresso discretas e elegantes.
- **Status de Serviços:** Lista de status (Worker, Web App, DB, IMAP, SMTP).
- **Controles Operacionais:**
  - Botões para Reiniciar, Parar e Iniciar Worker.
  - Botão "Verificar Saúde".
  - Modais de confirmação para todas as ações críticas.
- **UX:** Ações destrutivas com menor peso visual (outline ou ghost) para evitar cliques acidentais.

## 4. Responsividade e UX Global
- Otimização para telas ultra-wide (1920px) até mobile, aproveitando melhor o espaço horizontal no desktop sem "esticar" excessivamente os campos de texto.
- Transições de estado (loading, empty states) padronizadas.

## Regras Absolutas
- Nenhuma funcionalidade de backend, processamento ou banco de dados será alterada.
- Não serão criados dados mock; indicadores exibirão "Aguardando dados" ou "Indisponível" se a telemetria não estiver ativa.
