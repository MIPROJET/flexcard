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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json | null
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_links: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          last_synced_at: string
          profile_id: string
          saved_at: string
          scanner_phone: string
          scanner_profile_id: string | null
          updated_at: string
          vcard_downloaded_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string
          profile_id: string
          saved_at?: string
          scanner_phone: string
          scanner_profile_id?: string | null
          updated_at?: string
          vcard_downloaded_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string
          profile_id?: string
          saved_at?: string
          scanner_phone?: string
          scanner_profile_id?: string | null
          updated_at?: string
          vcard_downloaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_links_scanner_profile_id_fkey"
            columns: ["scanner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_cards: {
        Row: {
          batch_id: string | null
          code: string
          created_at: string
          id: string
          linked_at: string | null
          linked_by_user_id: string | null
          linked_profile_id: string | null
          printer_user_id: string
          status: Database["public"]["Enums"]["demo_card_status"]
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          code: string
          created_at?: string
          id?: string
          linked_at?: string | null
          linked_by_user_id?: string | null
          linked_profile_id?: string | null
          printer_user_id: string
          status?: Database["public"]["Enums"]["demo_card_status"]
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          code?: string
          created_at?: string
          id?: string
          linked_at?: string | null
          linked_by_user_id?: string | null
          linked_profile_id?: string | null
          printer_user_id?: string
          status?: Database["public"]["Enums"]["demo_card_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_cards_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          caption: string | null
          category: Database["public"]["Enums"]["gallery_category"]
          created_at: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"] | null
          position: number
          profile_id: string
          text_content: string | null
          url: string | null
        }
        Insert: {
          caption?: string | null
          category: Database["public"]["Enums"]["gallery_category"]
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"] | null
          position?: number
          profile_id: string
          text_content?: string | null
          url?: string | null
        }
        Update: {
          caption?: string | null
          category?: Database["public"]["Enums"]["gallery_category"]
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"] | null
          position?: number
          profile_id?: string
          text_content?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          has_premium_pack: boolean
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["plan_kind"]
          premium_code: string | null
          sector: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_premium_pack?: boolean
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["plan_kind"]
          premium_code?: string | null
          sector?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_premium_pack?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["plan_kind"]
          premium_code?: string | null
          sector?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_xof: number
          created_at: string
          currency: string
          description: string | null
          id: string
          method: string
          org_id: string | null
          profile_id: string
          reference: string | null
          status: string
        }
        Insert: {
          amount_xof: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          method?: string
          org_id?: string | null
          profile_id: string
          reference?: string | null
          status?: string
        }
        Update: {
          amount_xof?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          method?: string
          org_id?: string | null
          profile_id?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phones: {
        Row: {
          created_at: string
          id: string
          number: string
          operator: Database["public"]["Enums"]["operator_kind"]
          position: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: string
          operator?: Database["public"]["Enums"]["operator_kind"]
          position?: number
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: string
          operator?: Database["public"]["Enums"]["operator_kind"]
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          boost_until: string | null
          city: string | null
          company: string | null
          country_code: string | null
          cover_type: Database["public"]["Enums"]["media_type"] | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string
          first_name: string
          has_premium: boolean
          id: string
          kind: Database["public"]["Enums"]["account_kind"]
          last_name: string
          org_id: string | null
          palette: Json
          premium_code: string | null
          public_email: string | null
          referral_code: string | null
          referred_by: string | null
          sector: string | null
          slug: string
          socials: Json
          template_id: string
          title: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          boost_until?: string | null
          city?: string | null
          company?: string | null
          country_code?: string | null
          cover_type?: Database["public"]["Enums"]["media_type"] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email: string
          first_name?: string
          has_premium?: boolean
          id: string
          kind?: Database["public"]["Enums"]["account_kind"]
          last_name?: string
          org_id?: string | null
          palette?: Json
          premium_code?: string | null
          public_email?: string | null
          referral_code?: string | null
          referred_by?: string | null
          sector?: string | null
          slug: string
          socials?: Json
          template_id?: string
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          boost_until?: string | null
          city?: string | null
          company?: string | null
          country_code?: string | null
          cover_type?: Database["public"]["Enums"]["media_type"] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string
          first_name?: string
          has_premium?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["account_kind"]
          last_name?: string
          org_id?: string | null
          palette?: Json
          premium_code?: string | null
          public_email?: string | null
          referral_code?: string | null
          referred_by?: string | null
          sector?: string | null
          slug?: string
          socials?: Json
          template_id?: string
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          first_scan_at: string
          id: string
          last_synced_at: string
          last_visit_at: string
          profile_id: string
          scanner_phone: string
          scanner_profile_id: string | null
          vcard_downloaded_at: string | null
          visits: number
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          first_scan_at?: string
          id?: string
          last_synced_at?: string
          last_visit_at?: string
          profile_id: string
          scanner_phone: string
          scanner_profile_id?: string | null
          vcard_downloaded_at?: string | null
          visits?: number
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          first_scan_at?: string
          id?: string
          last_synced_at?: string
          last_visit_at?: string
          profile_id?: string
          scanner_phone?: string
          scanner_profile_id?: string | null
          vcard_downloaded_at?: string | null
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "prospects_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_scanner_profile_id_fkey"
            columns: ["scanner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          commission_xof: number
          created_at: string
          id: string
          level: string | null
          referred_id: string
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          commission_xof?: number
          created_at?: string
          id?: string
          level?: string | null
          referred_id: string
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          commission_xof?: number
          created_at?: string
          id?: string
          level?: string | null
          referred_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_requests: {
        Row: {
          city: string
          company_name: string | null
          created_at: string
          created_user_id: string | null
          departement: string | null
          email: string
          first_name: string
          id: string
          kind: Database["public"]["Enums"]["pro_role_kind"]
          last_name: string
          phone: string | null
          quartier: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["role_request_status"]
          updated_at: string
        }
        Insert: {
          city: string
          company_name?: string | null
          created_at?: string
          created_user_id?: string | null
          departement?: string | null
          email: string
          first_name: string
          id?: string
          kind: Database["public"]["Enums"]["pro_role_kind"]
          last_name: string
          phone?: string | null
          quartier: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["role_request_status"]
          updated_at?: string
        }
        Update: {
          city?: string
          company_name?: string | null
          created_at?: string
          created_user_id?: string | null
          departement?: string | null
          email?: string
          first_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["pro_role_kind"]
          last_name?: string
          phone?: string | null
          quartier?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["role_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          profile_id: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          profile_id?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          profile_id?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount_xof: number
          id: string
          processed_at: string | null
          profile_id: string
          requested_at: string
          status: string
          wave_number: string
        }
        Insert: {
          admin_note?: string | null
          amount_xof: number
          id?: string
          processed_at?: string | null
          profile_id: string
          requested_at?: string
          status?: string
          wave_number: string
        }
        Update: {
          admin_note?: string | null
          amount_xof?: number
          id?: string
          processed_at?: string | null
          profile_id?: string
          requested_at?: string
          status?: string
          wave_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_role_request: { Args: { _request_id: string }; Returns: string }
      create_vocal_profile: {
        Args: {
          _activity: string
          _avatar_url: string
          _city: string
          _cover_url: string
          _first_name: string
          _last_name: string
          _phone1: string
          _phone2: string
          _phone3: string
          _ref_code: string
          _referral_code: string
          _slug: string
          _whatsapp: string
        }
        Returns: Json
      }
      find_card_by_email: { Args: { _email: string }; Returns: string }
      get_my_org_premium_code: { Args: { _org_id: string }; Returns: string }
      get_my_profile_sensitive: {
        Args: never
        Returns: {
          email: string
          premium_code: string
          referral_code: string
          referred_by: string
        }[]
      }
      get_referral_wallet: {
        Args: { _profile_id?: string }
        Returns: {
          balance_xof: number
          filleuls: number
          filleuls_actifs: number
          level: string
          profile_id: string
          referral_code: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_demo_card: {
        Args: { _code: string; _profile_id: string }
        Returns: Json
      }
      printer_generate_batch: { Args: { _count: number }; Returns: string[] }
      register_analytics_event: {
        Args: { _event_type: string; _metadata?: Json; _profile_id: string }
        Returns: undefined
      }
      register_contact_exchange: {
        Args: {
          _contact_email?: string
          _contact_name?: string
          _profile_id: string
          _scanner_phone: string
          _scanner_profile_id?: string
        }
        Returns: {
          contact_link_id: string
          prospect_id: string
          visits: number
        }[]
      }
      request_withdrawal: {
        Args: { _amount_xof: number; _wave_number: string }
        Returns: string
      }
      resolve_demo_card: { Args: { _code: string }; Returns: string }
      submit_role_request: {
        Args: {
          _city: string
          _company_name: string
          _departement: string
          _email: string
          _first_name: string
          _kind: string
          _last_name: string
          _phone: string
          _quartier: string
        }
        Returns: string
      }
    }
    Enums: {
      account_kind: "particulier" | "informel" | "entreprise"
      app_role:
        | "admin"
        | "moderator"
        | "imprimeur"
        | "user"
        | "coordinator"
        | "commercial"
        | "partner"
      demo_card_status: "available" | "linked" | "disabled"
      gallery_category:
        | "photos"
        | "affiches"
        | "visuels"
        | "videos"
        | "actualites"
      media_type: "image" | "video"
      operator_kind: "MTN" | "Orange" | "Moov" | "Fixe" | "Inconnu"
      plan_kind:
        | "free"
        | "starter"
        | "team10"
        | "team20"
        | "team50"
        | "team100"
        | "unlimited"
      pro_role_kind: "coordinateur" | "commercial" | "partenaire"
      role_request_status: "pending" | "approved" | "rejected"
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
    Enums: {
      account_kind: ["particulier", "informel", "entreprise"],
      app_role: [
        "admin",
        "moderator",
        "imprimeur",
        "user",
        "coordinator",
        "commercial",
        "partner",
      ],
      demo_card_status: ["available", "linked", "disabled"],
      gallery_category: [
        "photos",
        "affiches",
        "visuels",
        "videos",
        "actualites",
      ],
      media_type: ["image", "video"],
      operator_kind: ["MTN", "Orange", "Moov", "Fixe", "Inconnu"],
      plan_kind: [
        "free",
        "starter",
        "team10",
        "team20",
        "team50",
        "team100",
        "unlimited",
      ],
      pro_role_kind: ["coordinateur", "commercial", "partenaire"],
      role_request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
