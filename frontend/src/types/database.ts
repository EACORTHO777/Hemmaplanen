
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "events": {
                  Row: {
                    "assigned_to": string | null,"created_at": string,"date": string,"household_id": string,"id": string,"time": string | null,"title": string
                  }
                  Insert: {
                    "assigned_to"?: string | null,"created_at"?: string,"date": string,"household_id": string,"id"?: string,"time"?: string | null,"title": string
                  }
                  Update: {
                    "assigned_to"?: string | null,"created_at"?: string,"date"?: string,"household_id"?: string,"id"?: string,"time"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_assigned_to_fkey"
      columns: ["household_id","assigned_to"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["household_id","id"]
    },{
      foreignKeyName: "events_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "created_at": string,"id": string,"invite_code": string,"name": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"item_memory": {
                  Row: {
                    "amount": number | null,"category": string | null,"household_id": string,"name_key": string,"unit": string | null,"updated_at": string
                  }
                  Insert: {
                    "amount"?: number | null,"category"?: string | null,"household_id": string,"name_key": string,"unit"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number | null,"category"?: string | null,"household_id"?: string,"name_key"?: string,"unit"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_memory_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"medicine_logs": {
                  Row: {
                    "given_at": string,"given_by": string | null,"given_to": string,"household_id": string,"id": string,"medicine_id": string
                  }
                  Insert: {
                    "given_at"?: string,"given_by"?: string | null,"given_to": string,"household_id": string,"id"?: string,"medicine_id": string
                  }
                  Update: {
                    "given_at"?: string,"given_by"?: string | null,"given_to"?: string,"household_id"?: string,"id"?: string,"medicine_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medicine_logs_given_to_fkey"
      columns: ["household_id","given_to"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["household_id","id"]
    },{
      foreignKeyName: "medicine_logs_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "medicine_logs_medicine_fkey"
      columns: ["household_id","medicine_id"]
isOneToOne: false
      referencedRelation: "medicines"
      referencedColumns: ["household_id","id"]
    }
                  ]
                },"medicines": {
                  Row: {
                    "color": string,"created_at": string,"household_id": string,"id": string,"member_id": string | null,"min_interval_minutes": number,"name": string
                  }
                  Insert: {
                    "color": string,"created_at"?: string,"household_id": string,"id"?: string,"member_id"?: string | null,"min_interval_minutes": number,"name": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"household_id"?: string,"id"?: string,"member_id"?: string | null,"min_interval_minutes"?: number,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medicines_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "medicines_member_fkey"
      columns: ["household_id","member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["household_id","id"]
    }
                  ]
                },"members": {
                  Row: {
                    "created_at": string,"display_name": string,"household_id": string,"id": string,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"display_name": string,"household_id": string,"id"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"household_id"?: string,"id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "members_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"household_id": string,"id": string,"p256dh": string,"user_id": string
                  }
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"household_id": string,"id"?: string,"p256dh": string,"user_id"?: string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"household_id"?: string,"id"?: string,"p256dh"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"shopping_items": {
                  Row: {
                    "amount": number | null,"category": string | null,"created_at": string,"done": boolean,"household_id": string,"id": string,"name": string,"unit": string | null
                  }
                  Insert: {
                    "amount"?: number | null,"category"?: string | null,"created_at"?: string,"done"?: boolean,"household_id": string,"id"?: string,"name": string,"unit"?: string | null
                  }
                  Update: {
                    "amount"?: number | null,"category"?: string | null,"created_at"?: string,"done"?: boolean,"household_id"?: string,"id"?: string,"name"?: string,"unit"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shopping_items_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"todos": {
                  Row: {
                    "assigned_to": string | null,"created_at": string,"done": boolean,"household_id": string,"id": string,"title": string
                  }
                  Insert: {
                    "assigned_to"?: string | null,"created_at"?: string,"done"?: boolean,"household_id": string,"id"?: string,"title": string
                  }
                  Update: {
                    "assigned_to"?: string | null,"created_at"?: string,"done"?: boolean,"household_id"?: string,"id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "todos_assigned_to_fkey"
      columns: ["household_id","assigned_to"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["household_id","id"]
    },{
      foreignKeyName: "todos_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_household":
{ Args: { "household_name": string }; Returns: string
                           },
"current_display_name":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_household_member":
{ Args: { "hid": string }; Returns: boolean
                           },
"join_household":
{ Args: { "code": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
