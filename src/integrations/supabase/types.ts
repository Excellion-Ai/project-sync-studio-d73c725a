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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      builder_projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          course_title: string
          enrollment_id: string
          id: string
          issued_at: string | null
          student_name: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          course_title: string
          enrollment_id: string
          id?: string
          issued_at?: string | null
          student_name: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          course_title?: string
          enrollment_id?: string
          id?: string
          issued_at?: string | null
          student_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      comp_access: {
        Row: {
          email: string
          granted_at: string
          granted_by: string | null
          note: string | null
        }
        Insert: {
          email: string
          granted_at?: string
          granted_by?: string | null
          note?: string | null
        }
        Update: {
          email?: string
          granted_at?: string
          granted_by?: string | null
          note?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          course_id: string | null
          created_at: string | null
          creator_id: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          times_used: number | null
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string | null
          creator_id: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string | null
          creator_id?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_chat_history: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chat_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_chat_messages: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chat_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_versions: {
        Row: {
          change_source: string | null
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_source?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot: Json
          version_number?: number
        }
        Update: {
          change_source?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_versions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_views: {
        Row: {
          course_id: string
          device_type: string | null
          id: string
          referrer: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          course_id: string
          device_type?: string | null
          id?: string
          referrer?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          course_id?: string
          device_type?: string | null
          id?: string
          referrer?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_views_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          branding: Json | null
          builder_project_id: string | null
          created_at: string | null
          currency: string | null
          curriculum: Json
          custom_domain: string | null
          deleted_at: string | null
          description: string | null
          design_config: Json | null
          domain_verification_token: string | null
          domain_verified: boolean | null
          domain_verified_at: string | null
          has_video_content: boolean | null
          hero_copy: string | null
          id: string
          instructor_bio: string | null
          instructor_name: string | null
          is_featured: boolean | null
          is_free: boolean | null
          layout_template: string | null
          meta: Json | null
          original_prompt: string | null
          page_sections: Json | null
          price_cents: number | null
          published_at: string | null
          section_config: Json | null
          section_order: Json | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_image_url: string | null
          status: string | null
          stripe_account_id: string | null
          stripe_payment_url: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          subdomain: string | null
          tagline: string | null
          thumbnail_url: string | null
          title: string
          total_students: number | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branding?: Json | null
          builder_project_id?: string | null
          created_at?: string | null
          currency?: string | null
          curriculum: Json
          custom_domain?: string | null
          deleted_at?: string | null
          description?: string | null
          design_config?: Json | null
          domain_verification_token?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          has_video_content?: boolean | null
          hero_copy?: string | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          layout_template?: string | null
          meta?: Json | null
          original_prompt?: string | null
          page_sections?: Json | null
          price_cents?: number | null
          published_at?: string | null
          section_config?: Json | null
          section_order?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_image_url?: string | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_payment_url?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subdomain?: string | null
          tagline?: string | null
          thumbnail_url?: string | null
          title: string
          total_students?: number | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branding?: Json | null
          builder_project_id?: string | null
          created_at?: string | null
          currency?: string | null
          curriculum?: Json
          custom_domain?: string | null
          deleted_at?: string | null
          description?: string | null
          design_config?: Json | null
          domain_verification_token?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          has_video_content?: boolean | null
          hero_copy?: string | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          layout_template?: string | null
          meta?: Json | null
          original_prompt?: string | null
          page_sections?: Json | null
          price_cents?: number | null
          published_at?: string | null
          section_config?: Json | null
          section_order?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_image_url?: string | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_payment_url?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          subdomain?: string | null
          tagline?: string | null
          thumbnail_url?: string | null
          title?: string
          total_students?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_builder_project_id_fkey"
            columns: ["builder_project_id"]
            isOneToOne: false
            referencedRelation: "builder_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          amount_cents: number
          created_at: string | null
          creator_id: string | null
          currency: string | null
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: []
      }
      domain_verifications: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          site_id: string
          verification_type: string
          verification_value: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          site_id: string
          verification_type: string
          verification_value: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          site_id?: string
          verification_type?: string
          verification_value?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "published_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          id: string
          last_accessed_at: string | null
          last_lesson_id: string | null
          progress_percent: number | null
          student_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          last_lesson_id?: string | null
          progress_percent?: number | null
          student_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          last_lesson_id?: string | null
          progress_percent?: number | null
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_templates: {
        Row: {
          best_for: Json | null
          created_at: string | null
          default_styles: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image: string | null
          slug: string
          structure: Json
        }
        Insert: {
          best_for?: Json | null
          created_at?: string | null
          default_styles: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_image?: string | null
          slug: string
          structure: Json
        }
        Update: {
          best_for?: Json | null
          created_at?: string | null
          default_styles?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image?: string | null
          slug?: string
          structure?: Json
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          lesson_id: string
          notes: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          lesson_id: string
          notes?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          lesson_id?: string
          notes?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          course_id: string
          created_at: string | null
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          lesson_id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          lesson_id: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_views: {
        Row: {
          course_id: string
          enrollment_id: string | null
          id: string
          lesson_id: string
          time_spent_seconds: number | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          course_id: string
          enrollment_id?: string | null
          id?: string
          lesson_id: string
          time_spent_seconds?: number | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          course_id?: string
          enrollment_id?: string | null
          id?: string
          lesson_id?: string
          time_spent_seconds?: number | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_views_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_views_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          creator_subdomain: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          creator_subdomain?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          creator_subdomain?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      published_sites: {
        Row: {
          course_id: string
          created_at: string | null
          custom_domain: string | null
          custom_domain_verified: boolean | null
          id: string
          is_published: boolean | null
          published_at: string | null
          ssl_status: string | null
          subdomain: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          ssl_status?: string | null
          subdomain?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          ssl_status?: string | null
          subdomain?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "published_sites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_cents: number
          coupon_id: string | null
          course_id: string
          currency: string | null
          discount_cents: number | null
          id: string
          purchased_at: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          coupon_id?: string | null
          course_id: string
          currency?: string | null
          discount_cents?: number | null
          id?: string
          purchased_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          coupon_id?: string | null
          course_id?: string
          currency?: string | null
          discount_cents?: number | null
          id?: string
          purchased_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string | null
          course_id: string
          enrollment_id: string
          id: string
          lesson_id: string
          passed: boolean
          score_percent: number
        }
        Insert: {
          answers: Json
          attempted_at?: string | null
          course_id: string
          enrollment_id: string
          id?: string
          lesson_id: string
          passed: boolean
          score_percent: number
        }
        Update: {
          answers?: Json
          attempted_at?: string | null
          course_id?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          passed?: boolean
          score_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          called_at: string | null
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          called_at?: string | null
          endpoint: string
          id?: string
          user_id: string
        }
        Update: {
          called_at?: string | null
          endpoint?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      "stripe-connect": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string | null
          price_cents: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          price_cents?: number | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          price_cents?: number | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_clean_slug: {
        Args: { course_id?: string; title: string }
        Returns: string
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
