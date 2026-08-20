export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      email_configurations: {
        Row: {
          created_at: string | null
          destinations: string[]
          email_user: string
          id: string
          imap_host: string
          imap_port: number
          imap_secure: boolean
          is_active: boolean
          keywords: string[]
          last_check_at: string | null
          last_error: string | null
          last_heartbeat: string | null
          last_success_at: string | null
          processing_lock_id: string | null
          processing_lock_until: string | null
          provider: string
          smtp_host: string
          smtp_port: number
          smtp_secure: boolean
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destinations?: string[]
          email_user: string
          id?: string
          imap_host: string
          imap_port: number
          imap_secure?: boolean
          is_active?: boolean
          keywords?: string[]
          last_check_at?: string | null
          last_error?: string | null
          last_heartbeat?: string | null
          last_success_at?: string | null
          processing_lock_id?: string | null
          processing_lock_until?: string | null
          provider?: string
          smtp_host: string
          smtp_port: number
          smtp_secure?: boolean
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          destinations?: string[]
          email_user?: string
          id?: string
          imap_host?: string
          imap_port?: number
          imap_secure?: boolean
          is_active?: boolean
          keywords?: string[]
          last_check_at?: string | null
          last_error?: string | null
          last_heartbeat?: string | null
          last_success_at?: string | null
          processing_lock_id?: string | null
          processing_lock_until?: string | null
          provider?: string
          smtp_host?: string
          smtp_port?: number
          smtp_secure?: boolean
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_credentials: {
        Row: {
          config_id: string
          created_at: string | null
          password: string
        }
        Insert: {
          config_id: string
          created_at?: string | null
          password: string
        }
        Update: {
          config_id?: string
          created_at?: string | null
          password?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_credentials_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: true
            referencedRelation: "email_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          config_id: string
          created_at: string | null
          id: string
          level: string
          message: string
        }
        Insert: {
          config_id: string
          created_at?: string | null
          id?: string
          level?: string
          message: string
        }
        Update: {
          config_id?: string
          created_at?: string | null
          id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "email_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processing_state: {
        Row: {
          attempt_count: number | null
          config_id: string
          created_at: string | null
          forwarded_at: string | null
          id: string
          imap_uid: number
          last_error: string | null
          mailbox: string
          message_id: string | null
          processing_started_at: string | null
          status: string | null
        }
        Insert: {
          attempt_count?: number | null
          config_id: string
          created_at?: string | null
          forwarded_at?: string | null
          id?: string
          imap_uid: number
          last_error?: string | null
          mailbox: string
          message_id?: string | null
          processing_started_at?: string | null
          status?: string | null
        }
        Update: {
          attempt_count?: number | null
          config_id?: string
          created_at?: string | null
          forwarded_at?: string | null
          id?: string
          imap_uid?: number
          last_error?: string | null
          mailbox?: string
          message_id?: string | null
          processing_started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_processing_state_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "email_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      forwarded_emails: {
        Row: {
          config_id: string
          forwarded_at: string | null
          id: string
          original_from: string | null
          original_subject: string | null
        }
        Insert: {
          config_id: string
          forwarded_at?: string | null
          id?: string
          original_from?: string | null
          original_subject?: string | null
        }
        Update: {
          config_id?: string
          forwarded_at?: string | null
          id?: string
          original_from?: string | null
          original_subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forwarded_emails_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "email_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_email_config_lock: {
        Args: { p_config_id: string; p_lock_timeout: string }
        Returns: string
      }
      release_email_config_lock: {
        Args: { p_config_id: string; p_lock_id: string }
        Returns: boolean
      }
      reserve_email_for_processing: {
        Args: {
          p_config_id: string
          p_imap_uid: number
          p_mailbox: string
          p_max_retries?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
