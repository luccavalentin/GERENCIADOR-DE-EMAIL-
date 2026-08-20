# Plan: Backend Refactor and Production-Ready Monitoring

Refactoring the system to implement robust monitoring, secure credential management, and reliable email processing.

## 1. Database Schema Enhancements (Supabase)
- **Email Configurations**: Add `last_heartbeat`, `last_check_at`, `last_success_at`, `last_error`, and `status`.
- **Deduplication Engine**: Create `email_processing_state` table to track `imap_uid`, `message_id`, `mailbox`, `config_id`, and processing status.
- **Constraints**: Implement `UNIQUE(config_id, mailbox, imap_uid)` to prevent double-processing.
- **Security**: Implement `GRANT` permissions for all tables and ensure RLS is correctly configured.

## 2. Secure Secret Management
- **Remove Hardcoded Keys**: Purge all hardcoded `apikey` and `publishableKey` from `src/routes/api/public/cron/monitor.ts`.
- **Cron Secret**: Implement `EMAIL_MONITOR_CRON_SECRET` validation. The cron job will send this secret in the header, and the API will verify it against the server environment variable.
- **Credential Protection**: Ensure passwords are treated as sensitive data (stored in `email_configurations` but handled securely by server functions).

## 3. Robust Email Processing (`src/lib/email.functions.ts`)
- **Advanced Normalization**:
    - Decode email subjects.
    - Parse MIME structures to extract `text/plain` and `text/html`.
    - HTML-to-text conversion.
    - Remove accents (normalization) and convert to lowercase.
    - Regex-based keyword matching (`\w*codigo\w*`).
- **Reliable Flow**:
    - **Deduplication**: Atomically check and reserve UID before processing.
    - **SMTP Confirmation**: Send email first, then confirm success.
    - **IMAP State**: Mark as `\Seen` ONLY after successful SMTP delivery and DB logging.
    - **Attachments**: Attach the original email as `email-original.eml` (`message/rfc822`).
- **Error Handling**: Implement individual `try/catch` per message to prevent one failure from blocking others.
- **Loop Protection**: Block processing if sender is self, subject starts with `ENC:`, or `Auto-Submitted` header is present.

## 4. Execution & Monitoring Logic
- **Execution Lock**: Use a database-level lock to prevent concurrent cron jobs from processing the same configuration.
- **Heartbeat System**: Update configuration status in real-time based on monitoring results.
- **Cron Configuration**: Move to a stable production endpoint (once published) and ensure the preview URL is used only for development.

## 5. Visual Dashboard Updates
- Reflect REAL status (last check, heartbeat, error state) on the dashboard cards.

---
**Technical Note**: If the project is not yet published to a production domain, the cron job will temporarily use the preview URL but will be documented as a "Development/Preview" state until a stable domain is available.
