# Technical Audit and Optimization Plan

Perform a deep technical audit and optimization of the Email Management System to ensure stability, security, and production readiness.

## Proposed Changes

### 1. Logic Consolidation and Parity
- **Shared Logic source of truth**: Ensure `src/lib/email-logic/processor.server.ts` is the single source of truth for email processing.
- **Worker Parity**: Update the standalone worker to use the same logic, ensuring that fixes to normalization, locking, or forwarding apply to both environments.

### 2. UI Robustness and UX
- **Error Handling**: Implement more robust error handling in `Dashboard` and `LogsPage`.
- **Log Management**: Add pagination or a "Load More" feature to the logs view to handle large volumes of activity.
- **Feedback Loops**: Enhance toasts and loading states during manual processing and connection tests.

### 3. Type Safety and Code Quality
- **Zod Schema Refinement**: Tighten Zod schemas in `email.functions.ts` and remove `as any` casts.
- **Supabase Type Alignment**: Ensure Supabase client calls use generated types correctly.

### 4. Security Audit
- **RLS Policy Verification**: Double-check that all tables (`email_configurations`, `email_logs`, `forwarded_emails`, `email_processing_state`) have strict RLS policies scoped to `auth.uid()`.
- **Privileged Operation Safeguards**: Ensure that functions restricted to `service_role` are only accessible via trusted server environments.

### 5. Performance and Reliability
- **Connection Management**: Optimize IMAP/SMTP connection pooling and timeouts to prevent hanging processes.
- **Lock Management**: Ensure orphans locks are cleared more aggressively or handled gracefully.

## Technical Details
- **Architecture**: TanStack Start (Full-stack) + Node.js Worker.
- **Stack**: Supabase, imapflow, nodemailer, Zod, Tailwind CSS.
- **Environment**: Cloudflare Workers (Web) / VPS (Worker).

## Validation Plan
- **Build Check**: Run `npm run build` to ensure no bundling issues.
- **Runtime Check**: Verify dashboard loading and log streaming in the preview.
- **Security Check**: Inspect Supabase console for RLS consistency.
