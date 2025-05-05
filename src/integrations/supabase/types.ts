export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      anomalies: {
        Row: {
          id: string
          message: string | null
          severity: string
          status: string | null
          timestamp: string
          type: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          message?: string | null
          severity: string
          status?: string | null
          timestamp?: string
          type: string
          vehicle_id: string
        }
        Update: {
          id?: string
          message?: string | null
          severity?: string
          status?: string | null
          timestamp?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      rsus: {
        Row: {
          coverage_radius: number
          id: string
          last_seen: string | null
          lat: number
          lng: number
          location: string
          rsu_id: string
          status: string
        }
        Insert: {
          coverage_radius: number
          id?: string
          last_seen?: string | null
          lat: number
          lng: number
          location: string
          rsu_id: string
          status: string
        }
        Update: {
          coverage_radius?: number
          id?: string
          last_seen?: string | null
          lat?: number
          lng?: number
          location?: string
          rsu_id?: string
          status?: string
        }
        Relationships: []
      }
      trust_ledger: {
        Row: {
          action: string
          details: string | null
          id: string
          new_value: number
          old_value: number
          target_id: string | null
          target_type: string | null
          timestamp: string
          tx_id: string
          vehicle_id: string
        }
        Insert: {
          action: string
          details?: string | null
          id?: string
          new_value: number
          old_value: number
          target_id?: string | null
          target_type?: string | null
          timestamp?: string
          tx_id: string
          vehicle_id: string
        }
        Update: {
          action?: string
          details?: string | null
          id?: string
          new_value?: number
          old_value?: number
          target_id?: string | null
          target_type?: string | null
          timestamp?: string
          tx_id?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          heading: number | null
          id: string
          lat: number
          lng: number
          location: string | null
          owner_name: string
          speed: number | null
          status: string
          timestamp: string
          trust_score: number
          vehicle_id: string
          vehicle_type: string
        }
        Insert: {
          heading?: number | null
          id?: string
          lat: number
          lng: number
          location?: string | null
          owner_name: string
          speed?: number | null
          status?: string
          timestamp?: string
          trust_score: number
          vehicle_id: string
          vehicle_type: string
        }
        Update: {
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          location?: string | null
          owner_name?: string
          speed?: number | null
          status?: string
          timestamp?: string
          trust_score?: number
          vehicle_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      zones_congestion: {
        Row: {
          congestion_level: number
          id: string
          lat: number
          lng: number
          updated_at: string
          zone_name: string
        }
        Insert: {
          congestion_level: number
          id?: string
          lat: number
          lng: number
          updated_at?: string
          zone_name: string
        }
        Update: {
          congestion_level?: number
          id?: string
          lat?: number
          lng?: number
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
