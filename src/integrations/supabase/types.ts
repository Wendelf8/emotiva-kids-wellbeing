export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          criado_em: string | null
          enviado_para_id: string | null
          id: string
          mensagem: string | null
        }
        Insert: {
          criado_em?: string | null
          enviado_para_id?: string | null
          id?: string
          mensagem?: string | null
        }
        Update: {
          criado_em?: string | null
          enviado_para_id?: string | null
          id?: string
          mensagem?: string | null
        }
        Relationships: []
      }
      checkins_emocionais: {
        Row: {
          algo_ruim: boolean | null
          como_se_sente: string | null
          created_at: string | null
          crianca_id: string | null
          data: string | null
          data_escolhida: string | null
          dormiu_bem: boolean | null
          emocao: string | null
          id: string
          intensidade: number | null
          observacoes: string | null
          resumo: string | null
        }
        Insert: {
          algo_ruim?: boolean | null
          como_se_sente?: string | null
          created_at?: string | null
          crianca_id?: string | null
          data?: string | null
          data_escolhida?: string | null
          dormiu_bem?: boolean | null
          emocao?: string | null
          id?: string
          intensidade?: number | null
          observacoes?: string | null
          resumo?: string | null
        }
        Update: {
          algo_ruim?: boolean | null
          como_se_sente?: string | null
          created_at?: string | null
          crianca_id?: string | null
          data?: string | null
          data_escolhida?: string | null
          dormiu_bem?: boolean | null
          emocao?: string | null
          id?: string
          intensidade?: number | null
          observacoes?: string | null
          resumo?: string | null
        }
        Relationships: []
      }
      criancas: {
        Row: {
          criado_em: string | null
          id: string
          idade: number
          nome: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          idade: number
          nome: string
          usuario_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          idade?: number
          nome?: string
          usuario_id?: string
        }
        Relationships: []
      }
      escolas: {
        Row: {
          cidade: string | null
          criado_em: string | null
          estado: string | null
          id: string
          nome: string
        }
        Insert: {
          cidade?: string | null
          criado_em?: string | null
          estado?: string | null
          id?: string
          nome: string
        }
        Update: {
          cidade?: string | null
          criado_em?: string | null
          estado?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          criado_em: string | null
          email: string | null
          id: string
          nome: string | null
          tipo_usuario: string
        }
        Insert: {
          criado_em?: string | null
          email?: string | null
          id: string
          nome?: string | null
          tipo_usuario: string
        }
        Update: {
          criado_em?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          tipo_usuario?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          criado_em: string | null
          email: string | null
          id: string
          nome: string | null
          tipo_usuario: string
        }
        Insert: {
          criado_em?: string | null
          email?: string | null
          id: string
          nome?: string | null
          tipo_usuario: string
        }
        Update: {
          criado_em?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          tipo_usuario?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          auth_user_id: string | null
          id: string
          nome: string | null
          tipo_usuario: string | null
        }
        Insert: {
          auth_user_id?: string | null
          id?: string
          nome?: string | null
          tipo_usuario?: string | null
        }
        Update: {
          auth_user_id?: string | null
          id?: string
          nome?: string | null
          tipo_usuario?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_complete_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
