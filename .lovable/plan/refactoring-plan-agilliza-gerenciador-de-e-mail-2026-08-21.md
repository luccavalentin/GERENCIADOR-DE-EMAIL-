# Refactoring Plan - Agilliza Gerenciador de E-mail

Deep refactor to improve code quality, maintainability, and scalability without changing existing functionality.

## 1. Modularize Server Functions
Current `src/lib/email.functions.ts` is a monolithic file (665+ lines). I will split it into domain-specific modules:
- `src/lib/auth.functions.ts`: User and profile management.
- `src/lib/email-config.functions.ts`: CRUD for email configurations.
- `src/lib/diagnostics.functions.ts`: Connection testing and detailed diagnostics.
- `src/lib/stats.functions.ts`: Dashboard statistics and logging.
- `src/lib/worker.functions.ts`: Worker status and control.

## 2. Component Extraction & Optimization
Extract large chunks of JSX into dedicated, reusable components:
- `src/components/dashboard/StatCards.tsx`: The 5 metric cards on the dashboard.
- `src/components/dashboard/InfrastructureHealth.tsx`: The infrastructure status grid.
- `src/components/dashboard/RecentActivity.tsx`: The logs table on the dashboard.
- `src/components/monitoring/LogConsole.tsx`: The "Matrix" style console from `monitoring.tsx`.

## 3. Logic & State Improvements
- Move system health calculation logic from `src/routes/index.tsx` to `src/lib/worker.functions.ts`.
- Standardize the `requireSupabaseAuth` middleware usage.
- Ensure all Supabase calls follow the "canonical shape" for TanStack Start server functions.

## 4. Type Safety & Standardization
- Replace `any` with explicit interfaces for `EmailConfig`, `LogEntry`, `SystemStats`, and `WorkerStatus`.
- Standardize normalization helpers into `src/lib/utils.ts`.

## 5. Clean Up
- Remove redundant imports and dead code.
- Consolidate error handling patterns across server functions.

## Technical Details
- **Tech Stack**: React 19, TanStack Start, Supabase.
- **Constraints**: 
  - Do NOT change functional behavior.
  - Maintain the "Navy corporate" aesthetic.
  - Follow TanStack Start server function rules (thin wrappers, logic in imported files/handlers).
