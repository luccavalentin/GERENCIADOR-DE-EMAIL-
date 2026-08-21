export interface EmailConfig {
  id: string;
  user_id: string;
  provider: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  email_user: string;
  destinations: string[];
  keywords: string[];
  is_active: boolean;
  last_success_at?: string | null;
  last_check_at?: string | null;
  last_heartbeat?: string | null;
  last_error?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LogEntry {
  id: string;
  config_id: string;
  message: string;
  level: 'info' | 'error' | 'success' | 'warning';
  details?: any;
  created_at: string;
}

export interface SystemStats {
  found: number;
  analyzed: number;
  keywords: number;
  forwarded: number;
  ignored: number;
  errors: number;
  duplicates: number;
}

export interface WorkerStatus {
  status: 'online' | 'offline' | 'paused';
  message: string;
  db_status: 'online' | 'offline';
  hostname?: string;
  uptime?: string;
  last_heartbeat?: string | null;
  cpu_usage?: number;
  ram_usage?: number;
  configs: Partial<EmailConfig>[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}
