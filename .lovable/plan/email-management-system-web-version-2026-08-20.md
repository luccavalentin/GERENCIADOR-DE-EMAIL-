# Email Management System (Web Version)

Build a full-stack web application for monitoring and forwarding emails based on specific keywords (e.g., "codigo"), replicating the functionality of the provided Python desktop app.

## Features

- **Authentication**: User sign-up, login, and multi-user management (admin can create other users).
- **Email Server Configuration**: Configure IMAP/SMTP settings (Host, Port, SSL/TLS).
- **Email Monitoring**: Dashboard to start/stop monitoring of a specific inbox.
- **Forwarding Rules**: Automatically forward emails containing specific keywords to a list of destination emails.
- **Logs**: Real-time monitoring logs and error history.
- **Email History**: View forwarded emails and their content.

## Technical Details

- **Backend**: TanStack Start with `createServerFn` for IMAP/SMTP operations.
- **Database**: Supabase (via Lovable Cloud) for storing user data, email configurations, and logs.
- **Library**: `imapflow` for IMAP connections and `nodemailer` for SMTP forwarding in the server functions.
- **Security**: Supabase RLS policies to ensure users only access their own configurations and logs.

## Steps

1. **Database Schema**:
   - `email_configurations`: host, port, user, password (encrypted/vault), provider, destinations, keywords.
   - `email_logs`: configuration_id, message, timestamp, level.
   - `forwarded_emails`: configuration_id, original_subject, original_from, forwarded_at.

2. **Server Functions**:
   - `testConnection`: Verify IMAP/SMTP settings.
   - `startMonitoring`: Initialize a background process (or simulate via periodic checks/Realtime) to monitor the inbox.
   - `forwardEmail`: Handle the SMTP forwarding logic.

3. **Frontend**:
   - **Login/SignUp**: Basic auth flow.
   - **Dashboard**: Card-based UI to manage configurations.
   - **Config Modal**: Form to input IMAP/SMTP details.
   - **Logs View**: Real-time log stream using Supabase Realtime for the `email_logs` table.

4. **Integration**:
   - Port the keyword detection logic (`codigo`) from Python to TypeScript.
   - Port the email forwarding template (ENC: Subject).
