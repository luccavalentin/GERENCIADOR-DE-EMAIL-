# Plan: Real VPS Worker Operational Control

Implement a secure, real-time control system for the Email Monitor Worker running on Hostinger VPS (Docker Compose).

## Database Schema updates
- Create `worker_control` table to store command requests (pausar, iniciar, reiniciar).
- Add `desired_state` to `email_configurations` or a global worker state table to allow pausing individual configs or the whole engine.
- Update `worker_heartbeat` to include detailed status (running, paused, stopping).
- Add `admin_actions_log` or use `email_logs` with a specific `action` category.

## Backend Implementation (`src/lib/email.functions.ts`)
- `getWorkerStatus`: Refactor to return real state from `worker_heartbeat` and check for pending control actions.
- `updateWorkerState`: New server function to request state changes (PAUSE, START, RESTART).
  - Authenticates user.
  - Validates permissions.
  - Inserts record into `worker_control`.
  - Logs the action to `email_logs`.
- `waitForWorkerState`: New server function that polls for heartbeat updates to confirm action success.

## Frontend Implementation (`src/routes/server.tsx`)
- Redesign the "Controles" card to match the new operational requirements.
- Status indicators: 🟢 Em execução, 🟡 Pausado, 🔴 Parado, ⚪ Desconhecido.
- Buttons:
  - **PAUSAR SERVIÇO**: Confirmation dialog -> Request -> Polling -> Success toast.
  - **INICIAR SERVIÇO**: Request -> Polling (heartbeat) -> Success toast.
  - **REINICIAR SERVIÇO**: Confirmation dialog -> Request -> Extended polling -> Success/Timeout toast.
- State-aware buttons: Disable buttons based on current state (e.g., disable "Pausar" if already paused) and during operations.

## Worker Integration (Hostinger/Docker)
- The worker will poll the `worker_control` table or `email_configurations.is_active` at each cycle.
- For "PAUSE", it will finish current loop and enter a sleep state.
- For "RESTART", the Hostinger-side manager (orchestrator) will detect the request in the DB and trigger `docker-compose restart worker`.

## Security
- All control functions wrapped in `requireSupabaseAuth`.
- Service role key used only server-side.
- No direct shell execution from the browser.
- Rate limiting and logging for all administrative actions.

## User Experience
- Real-time feedback with loading states ("Pausando...", "Reiniciando serviço...").
- Integrated logs in the "Auditoria" (Logs) page showing who did what and when.
