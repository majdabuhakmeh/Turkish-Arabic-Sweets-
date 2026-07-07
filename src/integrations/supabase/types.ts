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
      branch_inventory: {
        Row: {
          available: boolean
          branch_id: string
          created_at: string
          food_id: string
          id: string
          price_override: number | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          available?: boolean
          branch_id: string
          created_at?: string
          food_id: string
          id?: string
          price_override?: number | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          available?: boolean
          branch_id?: string
          created_at?: string
          food_id?: string
          id?: string
          price_override?: number | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_staff: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["branch_staff_role"]
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["branch_staff_role"]
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["branch_staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_staff_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          delivery_fee: number
          delivery_radius_km: number
          eta_minutes: number
          i18n: Json
          id: string
          latitude: number | null
          longitude: number | null
          manager_id: string | null
          min_order: number
          name: string
          opening_hours: Json
          phone: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["branch_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_radius_km?: number
          eta_minutes?: number
          i18n?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          min_order?: number
          name: string
          opening_hours?: Json
          phone?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["branch_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_radius_km?: number
          eta_minutes?: number
          i18n?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          min_order?: number
          name?: string
          opening_hours?: Json
          phone?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["branch_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          restaurant_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          restaurant_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          restaurant_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          max_discount: number | null
          min_subtotal: number
          restaurant_id: string | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_subtotal?: number
          restaurant_id?: string | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_subtotal?: number
          restaurant_id?: string | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          eta_minutes: number
          fee: number
          id: string
          min_subtotal: number
          name: string
          polygon: Json | null
          radius_km: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          eta_minutes?: number
          fee?: number
          id?: string
          min_subtotal?: number
          name: string
          polygon?: Json | null
          radius_km?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          eta_minutes?: number
          fee?: number
          id?: string
          min_subtotal?: number
          name?: string
          polygon?: Json | null
          radius_km?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          food_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          category_slug: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name: string
          price: number
          restaurant_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_slug: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name: string
          price: number
          restaurant_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_slug?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          restaurant_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "foods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          food_id: string | null
          id: string
          image_url: string | null
          line_total: number
          name: string
          order_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          food_id?: string | null
          id?: string
          image_url?: string | null
          line_total: number
          name: string
          order_id: string
          qty: number
          unit_price: number
        }
        Update: {
          created_at?: string
          food_id?: string | null
          id?: string
          image_url?: string | null
          line_total?: number
          name?: string
          order_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string | null
          coupon_code: string | null
          created_at: string
          delivery_address: string
          delivery_city: string
          delivery_fee: number
          delivery_name: string
          delivery_notes: string | null
          delivery_phone: string
          discount: number
          estimated_delivery_at: string | null
          fulfillment_type: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          restaurant_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          coupon_code?: string | null
          created_at?: string
          delivery_address: string
          delivery_city: string
          delivery_fee?: number
          delivery_name: string
          delivery_notes?: string | null
          delivery_phone: string
          discount?: number
          estimated_delivery_at?: string | null
          fulfillment_type?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          coupon_code?: string | null
          created_at?: string
          delivery_address?: string
          delivery_city?: string
          delivery_fee?: number
          delivery_name?: string
          delivery_notes?: string | null
          delivery_phone?: string
          discount?: number
          estimated_delivery_at?: string | null
          fulfillment_type?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_address: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          business_hours: Json
          contact_email: string | null
          contact_phone: string | null
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          i18n: Json
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
          status: Database["public"]["Enums"]["restaurant_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          business_hours?: Json
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          i18n?: Json
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          business_hours?: Json
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          i18n?: Json
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          food_id: string
          id: string
          order_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          food_id: string
          id?: string
          order_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          food_id?: string
          id?: string
          order_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["admin_permission"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          lat: number | null
          lng: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          lat?: number | null
          lng?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          lat?: number | null
          lng?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_branch_manager: {
        Args: { _branch: string; _user: string }
        Returns: boolean
      }
      is_branch_staff: {
        Args: { _branch: string; _user: string }
        Returns: boolean
      }
      is_restaurant_member: {
        Args: { _restaurant: string; _user: string }
        Returns: boolean
      }
      is_restaurant_owner: {
        Args: { _restaurant: string; _user: string }
        Returns: boolean
      }
      preview_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          active: boolean
          code: string
          description: string
          discount: number
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          eligible: boolean
          expires_at: string
          found: boolean
          max_discount: number
          message: string
          min_subtotal: number
          starts_at: string
          usage_limit: number
          used_count: number
        }[]
      }
      validate_and_redeem_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          code: string
          discount: number
          message: string
          valid: boolean
        }[]
      }
      validate_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          code: string
          discount: number
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      admin_permission:
        | "manage_orders"
        | "manage_menu"
        | "manage_categories"
        | "view_reports"
        | "manage_users"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "restaurant_owner"
        | "branch_manager"
        | "staff"
      branch_staff_role: "manager" | "staff"
      branch_status: "pending" | "active" | "inactive"
      coupon_discount_type: "percent" | "fixed"
      order_status:
        | "placed"
        | "preparing"
        | "on_the_way"
        | "delivered"
        | "cancelled"
      payment_method: "card" | "cash"
      restaurant_status: "pending" | "active" | "inactive"
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
      admin_permission: [
        "manage_orders",
        "manage_menu",
        "manage_categories",
        "view_reports",
        "manage_users",
      ],
      app_role: [
        "admin",
        "moderator",
        "user",
        "restaurant_owner",
        "branch_manager",
        "staff",
      ],
      branch_staff_role: ["manager", "staff"],
      branch_status: ["pending", "active", "inactive"],
      coupon_discount_type: ["percent", "fixed"],
      order_status: [
        "placed",
        "preparing",
        "on_the_way",
        "delivered",
        "cancelled",
      ],
      payment_method: ["card", "cash"],
      restaurant_status: ["pending", "active", "inactive"],
    },
  },
} as const
