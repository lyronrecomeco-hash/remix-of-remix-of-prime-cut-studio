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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_type: string
          settings: Json
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_type: string
          settings?: Json
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_type?: string
          settings?: Json
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          id: string
          ip_address: string | null
          landing_page: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_materials: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_proposals: {
        Row: {
          accepted_at: string | null
          affiliate_id: string
          ai_analysis: Json | null
          cancelled_at: string | null
          commission_amount: number | null
          commission_paid: boolean | null
          commission_paid_at: string | null
          commission_rate: number | null
          company_cnpj: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          contact_name: string | null
          created_at: string
          generated_proposal: Json | null
          id: string
          niche_id: string | null
          notes: string | null
          proposal_generated_at: string | null
          proposal_value: number | null
          questionnaire_answers: Json | null
          questionnaire_completed: boolean | null
          sent_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          affiliate_id: string
          ai_analysis?: Json | null
          cancelled_at?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          commission_paid_at?: string | null
          commission_rate?: number | null
          company_cnpj?: string | null
          company_email?: string | null
          company_name: string
          company_phone?: string | null
          contact_name?: string | null
          created_at?: string
          generated_proposal?: Json | null
          id?: string
          niche_id?: string | null
          notes?: string | null
          proposal_generated_at?: string | null
          proposal_value?: number | null
          questionnaire_answers?: Json | null
          questionnaire_completed?: boolean | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          affiliate_id?: string
          ai_analysis?: Json | null
          cancelled_at?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          commission_paid_at?: string | null
          commission_rate?: number | null
          company_cnpj?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          contact_name?: string | null
          created_at?: string
          generated_proposal?: Json | null
          id?: string
          niche_id?: string | null
          notes?: string | null
          proposal_generated_at?: string | null
          proposal_value?: number | null
          questionnaire_answers?: Json | null
          questionnaire_completed?: boolean | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_proposals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_proposals_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "business_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number | null
          commission_rate: number | null
          confirmed_at: string | null
          converted_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          plan_name: string | null
          plan_price: number | null
          referred_user_id: string
          status: Database["public"]["Enums"]["referral_status"]
          trial_expires_at: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          confirmed_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          plan_name?: string | null
          plan_price?: number | null
          referred_user_id: string
          status?: Database["public"]["Enums"]["referral_status"]
          trial_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          confirmed_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          plan_name?: string | null
          plan_price?: number | null
          referred_user_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
          trial_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          name: string
          password_hash: string
          phone: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          name: string
          password_hash: string
          phone: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          name?: string
          password_hash?: string
          phone?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          pix_key: string
          pix_type: Database["public"]["Enums"]["pix_type"]
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          pix_key: string
          pix_type: Database["public"]["Enums"]["pix_type"]
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string
          pix_type?: Database["public"]["Enums"]["pix_type"]
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          available_balance: number
          commission_rate_lifetime: number
          commission_rate_monthly: number
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          password_hash: string
          pending_balance: number
          pix_key: string | null
          pix_type: Database["public"]["Enums"]["pix_type"] | null
          status: Database["public"]["Enums"]["affiliate_status"]
          total_earnings: number
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          affiliate_code: string
          available_balance?: number
          commission_rate_lifetime?: number
          commission_rate_monthly?: number
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
          pending_balance?: number
          pix_key?: string | null
          pix_type?: Database["public"]["Enums"]["pix_type"] | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earnings?: number
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          affiliate_code?: string
          available_balance?: number
          commission_rate_lifetime?: number
          commission_rate_monthly?: number
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
          pending_balance?: number
          pix_key?: string | null
          pix_type?: Database["public"]["Enums"]["pix_type"] | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earnings?: number
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          barber_id: string
          client_name: string
          client_phone: string
          created_at: string
          date: string
          id: string
          protocol: string
          service_id: string
          status: string
          tenant_id: string | null
          time: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barber_id: string
          client_name: string
          client_phone: string
          created_at?: string
          date: string
          id?: string
          protocol: string
          service_id: string
          status?: string
          tenant_id?: string | null
          time: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barber_id?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          date?: string
          id?: string
          protocol?: string
          service_id?: string
          status?: string
          tenant_id?: string | null
          time?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      barber_availability: {
        Row: {
          available_slots: string[]
          barber_id: string
          created_at: string
          date: string
          id: string
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available_slots?: string[]
          barber_id: string
          created_at?: string
          date: string
          id?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available_slots?: string[]
          barber_id?: string
          created_at?: string
          date?: string
          id?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_availability_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          barber_id: string
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          barber_id: string
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          barber_id?: string
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_leaves_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_performance: {
        Row: {
          avg_rating: number | null
          avg_service_time: number | null
          barber_id: string
          cancelled_appointments: number
          completed_appointments: number
          created_at: string
          id: string
          most_popular_service_id: string | null
          new_clients: number
          no_show_appointments: number
          period_end: string
          period_start: string
          period_type: string
          returning_clients: number
          tenant_id: string | null
          total_appointments: number
          total_revenue: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avg_rating?: number | null
          avg_service_time?: number | null
          barber_id: string
          cancelled_appointments?: number
          completed_appointments?: number
          created_at?: string
          id?: string
          most_popular_service_id?: string | null
          new_clients?: number
          no_show_appointments?: number
          period_end: string
          period_start: string
          period_type?: string
          returning_clients?: number
          tenant_id?: string | null
          total_appointments?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avg_rating?: number | null
          avg_service_time?: number | null
          barber_id?: string
          cancelled_appointments?: number
          completed_appointments?: number
          created_at?: string
          id?: string
          most_popular_service_id?: string | null
          new_clients?: number
          no_show_appointments?: number
          period_end?: string
          period_start?: string
          period_type?: string
          returning_clients?: number
          tenant_id?: string | null
          total_appointments?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_performance_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_performance_most_popular_service_id_fkey"
            columns: ["most_popular_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_schedules: {
        Row: {
          barber_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_enabled: boolean
          start_time: string
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_enabled?: boolean
          start_time?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_enabled?: boolean
          start_time?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_schedules_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          available: boolean | null
          created_at: string
          experience: string | null
          id: string
          name: string
          photo: string | null
          rating: number | null
          specialties: string[] | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          experience?: string | null
          id?: string
          name: string
          photo?: string | null
          rating?: number | null
          specialties?: string[] | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string
          experience?: string | null
          id?: string
          name?: string
          photo?: string | null
          rating?: number | null
          specialties?: string[] | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          barber_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_niches: {
        Row: {
          base_questions: Json
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          base_questions?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          base_questions?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatpro_config: {
        Row: {
          api_token: string | null
          base_endpoint: string | null
          created_at: string
          id: string
          instance_id: string | null
          is_enabled: boolean | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_token?: string | null
          base_endpoint?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          is_enabled?: boolean | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_token?: string | null
          base_endpoint?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          is_enabled?: boolean | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          notes: string | null
          plan_interest: string
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          notes?: string | null
          plan_interest?: string
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          notes?: string | null
          plan_interest?: string
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      crm_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          crm_tenant_id: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          crm_tenant_id: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          crm_tenant_id?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_audit_logs_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_collaborator_tokens: {
        Row: {
          access_level: string
          created_at: string | null
          created_by: string | null
          crm_tenant_id: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          name: string
          token: string
          used_at: string | null
          whatsapp: string
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          name: string
          token: string
          used_at?: string | null
          whatsapp: string
        }
        Update: {
          access_level?: string
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          name?: string
          token?: string
          used_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_collaborator_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_collaborator_tokens_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_fields: {
        Row: {
          created_at: string | null
          crm_tenant_id: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          options: Json | null
          position: number | null
        }
        Insert: {
          created_at?: string | null
          crm_tenant_id: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          options?: Json | null
          position?: number | null
        }
        Update: {
          created_at?: string | null
          crm_tenant_id?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          options?: Json | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_fields_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funnel_stages: {
        Row: {
          color: string | null
          created_at: string | null
          crm_tenant_id: string
          funnel_id: string
          id: string
          is_final: boolean | null
          is_won: boolean | null
          name: string
          position: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          crm_tenant_id: string
          funnel_id: string
          id?: string
          is_final?: boolean | null
          is_won?: boolean | null
          name: string
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          crm_tenant_id?: string
          funnel_id?: string
          id?: string
          is_final?: boolean | null
          is_won?: boolean | null
          name?: string
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_funnel_stages_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "crm_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funnels: {
        Row: {
          color: string | null
          created_at: string | null
          crm_tenant_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          pipeline_id: string | null
          position: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          crm_tenant_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pipeline_id?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          crm_tenant_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pipeline_id?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_funnels_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_funnels_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_history: {
        Row: {
          action: string
          created_at: string | null
          crm_tenant_id: string
          id: string
          lead_id: string
          new_value: Json | null
          notes: string | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          crm_tenant_id: string
          id?: string
          lead_id: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          crm_tenant_id?: string
          id?: string
          lead_id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_history_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_tags: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string | null
          crm_tenant_id: string
          custom_fields: Json | null
          email: string | null
          funnel_id: string | null
          id: string
          loss_reason_id: string | null
          lost_at: string | null
          name: string
          notes: string | null
          origin: string | null
          phone: string | null
          pipeline_id: string | null
          responsible_id: string | null
          stage_entered_at: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["crm_lead_status"] | null
          updated_at: string | null
          value: number | null
          won_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id: string
          custom_fields?: Json | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          loss_reason_id?: string | null
          lost_at?: string | null
          name: string
          notes?: string | null
          origin?: string | null
          phone?: string | null
          pipeline_id?: string | null
          responsible_id?: string | null
          stage_entered_at?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["crm_lead_status"] | null
          updated_at?: string | null
          value?: number | null
          won_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id?: string
          custom_fields?: Json | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          loss_reason_id?: string | null
          lost_at?: string | null
          name?: string
          notes?: string | null
          origin?: string | null
          phone?: string | null
          pipeline_id?: string | null
          responsible_id?: string | null
          stage_entered_at?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["crm_lead_status"] | null
          updated_at?: string | null
          value?: number | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "crm_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_loss_reason_id_fkey"
            columns: ["loss_reason_id"]
            isOneToOne: false
            referencedRelation: "crm_loss_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_loss_reasons: {
        Row: {
          created_at: string | null
          crm_tenant_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          crm_tenant_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          crm_tenant_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_loss_reasons_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notifications: {
        Row: {
          created_at: string | null
          crm_tenant_id: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crm_tenant_id: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crm_tenant_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notifications_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string | null
          created_by: string | null
          crm_tenant_id: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipelines_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string | null
          created_at: string | null
          crm_tenant_id: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          crm_tenant_id: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          crm_tenant_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          crm_tenant_id: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: number | null
          reminder_at: string | null
          status: Database["public"]["Enums"]["crm_task_status"] | null
          task_type: Database["public"]["Enums"]["crm_task_type"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: number | null
          reminder_at?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"] | null
          task_type?: Database["public"]["Enums"]["crm_task_type"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_tenant_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: number | null
          reminder_at?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"] | null
          task_type?: Database["public"]["Enums"]["crm_task_type"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "crm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tenants: {
        Row: {
          company_data: Json | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          owner_user_id: string
          segment: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          company_data?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          owner_user_id: string
          segment?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_data?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          owner_user_id?: string
          segment?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_users: {
        Row: {
          auth_user_id: string
          created_at: string | null
          crm_tenant_id: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          role: Database["public"]["Enums"]["crm_role"]
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          crm_tenant_id: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["crm_role"]
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          crm_tenant_id?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["crm_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_users_crm_tenant_id_fkey"
            columns: ["crm_tenant_id"]
            isOneToOne: false
            referencedRelation: "crm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_confirmation_tokens: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          phone: string | null
          token: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          phone?: string | null
          token: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          phone?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          status: string
          subject: string
          template_type: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          status?: string
          subject: string
          template_type: string
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          status?: string
          subject?: string
          template_type?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      email_webhook_events: {
        Row: {
          created_at: string | null
          email_id: string | null
          event_type: string
          id: string
          payload: Json
          recipient_email: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: string | null
          event_type: string
          id?: string
          payload?: Json
          recipient_email?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          recipient_email?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          avatar_type: string
          avatar_url: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          name: string
          rating: number
          status: string
          tenant_id: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_type?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          name: string
          rating: number
          status?: string
          tenant_id?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_type?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          name?: string
          rating?: number
          status?: string
          tenant_id?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fraud_protection: {
        Row: {
          attempt_type: string
          created_at: string
          email: string
          fingerprint: string | null
          id: string
          ip_address: string
          is_blocked: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_type?: string
          created_at?: string
          email: string
          fingerprint?: string | null
          id?: string
          ip_address: string
          is_blocked?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          email?: string
          fingerprint?: string | null
          id?: string
          ip_address?: string
          is_blocked?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          ai_prompt: string | null
          button_text: string | null
          button_url: string | null
          completed_at: string | null
          created_at: string
          id: string
          image_url: string | null
          message_template: string
          name: string
          scheduled_at: string | null
          sent_count: number
          status: string
          target_count: number
          tenant_id: string | null
          updated_at: string
          use_ai: boolean
          user_id: string | null
        }
        Insert: {
          ai_prompt?: string | null
          button_text?: string | null
          button_url?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message_template: string
          name: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          target_count?: number
          tenant_id?: string | null
          updated_at?: string
          use_ai?: boolean
          user_id?: string | null
        }
        Update: {
          ai_prompt?: string | null
          button_text?: string | null
          button_url?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message_template?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          target_count?: number
          tenant_id?: string | null
          updated_at?: string
          use_ai?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_contacts: {
        Row: {
          campaign_id: string | null
          created_at: string
          error_message: string | null
          id: string
          name: string | null
          phone: string
          sent_at: string | null
          status: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          name?: string | null
          phone: string
          sent_at?: string | null
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          name?: string | null
          phone?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_settings: {
        Row: {
          allowed_end_hour: number
          allowed_start_hour: number
          consecutive_errors: number
          created_at: string
          daily_limit: number
          delay_between_messages: number
          id: string
          is_enabled: boolean
          last_reset_date: string | null
          max_consecutive_errors: number
          max_contacts: number
          max_delay_seconds: number
          messages_sent_today: number
          min_delay_seconds: number
          pause_duration_seconds: number
          pause_every_n_messages: number
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          warmup_day: number
          warmup_enabled: boolean
        }
        Insert: {
          allowed_end_hour?: number
          allowed_start_hour?: number
          consecutive_errors?: number
          created_at?: string
          daily_limit?: number
          delay_between_messages?: number
          id?: string
          is_enabled?: boolean
          last_reset_date?: string | null
          max_consecutive_errors?: number
          max_contacts?: number
          max_delay_seconds?: number
          messages_sent_today?: number
          min_delay_seconds?: number
          pause_duration_seconds?: number
          pause_every_n_messages?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          warmup_day?: number
          warmup_enabled?: boolean
        }
        Update: {
          allowed_end_hour?: number
          allowed_start_hour?: number
          consecutive_errors?: number
          created_at?: string
          daily_limit?: number
          delay_between_messages?: number
          id?: string
          is_enabled?: boolean
          last_reset_date?: string | null
          max_consecutive_errors?: number
          max_contacts?: number
          max_delay_seconds?: number
          messages_sent_today?: number
          min_delay_seconds?: number
          pause_duration_seconds?: number
          pause_every_n_messages?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          warmup_day?: number
          warmup_enabled?: boolean
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          button_text: string | null
          button_url: string | null
          chatpro_enabled: boolean | null
          created_at: string
          event_type: string
          id: string
          image_url: string | null
          is_active: boolean | null
          template: string
          tenant_id: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          chatpro_enabled?: boolean | null
          created_at?: string
          event_type: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          template: string
          tenant_id?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          chatpro_enabled?: boolean | null
          created_at?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          template?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          barber_id: string | null
          bonus_amount: number | null
          created_at: string
          current_value: number
          goal_type: string
          id: string
          is_active: boolean
          month: number
          target_value: number
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          barber_id?: string | null
          bonus_amount?: number | null
          created_at?: string
          current_value?: number
          goal_type?: string
          id?: string
          is_active?: boolean
          month: number
          target_value: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          barber_id?: string | null
          bonus_amount?: number | null
          created_at?: string
          current_value?: number
          goal_type?: string
          id?: string
          is_active?: boolean
          month?: number
          target_value?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      proposal_questionnaire_history: {
        Row: {
          ai_follow_up: string | null
          answer: string | null
          created_at: string
          id: string
          metadata: Json | null
          proposal_id: string
          question: string
          question_index: number
        }
        Insert: {
          ai_follow_up?: string | null
          answer?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          proposal_id: string
          question: string
          question_index: number
        }
        Update: {
          ai_follow_up?: string | null
          answer?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          proposal_id?: string
          question?: string
          question_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_questionnaire_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "affiliate_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          client_phone: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          tenant_id: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          auth: string
          client_phone?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          tenant_id?: string | null
          user_id?: string | null
          user_type?: string
        }
        Update: {
          auth?: string
          client_phone?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          tenant_id?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      queue: {
        Row: {
          appointment_id: string
          called_at: string | null
          created_at: string
          estimated_wait: number
          id: string
          onway_at: string | null
          position: number
          status: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          appointment_id: string
          called_at?: string | null
          created_at?: string
          estimated_wait?: number
          id?: string
          onway_at?: string | null
          position: number
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_id?: string
          called_at?: string | null
          created_at?: string
          estimated_wait?: number
          id?: string
          onway_at?: string | null
          position?: number
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          icon: string | null
          id: string
          name: string
          price: number
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number
          icon?: string | null
          id?: string
          name: string
          price?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          icon?: string | null
          id?: string
          name?: string
          price?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          address: string | null
          created_at: string
          daily_appointment_limit: number | null
          description: string | null
          facebook: string | null
          hours_saturday: string | null
          hours_sunday: string | null
          hours_weekdays: string | null
          id: string
          instagram: string | null
          logo: string | null
          lunch_break_end: string | null
          lunch_break_start: string | null
          maps_link: string | null
          max_queue_size: number | null
          name: string
          overload_alert_enabled: boolean | null
          phone: string | null
          queue_enabled: boolean | null
          tagline: string | null
          tenant_id: string | null
          theme: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          daily_appointment_limit?: number | null
          description?: string | null
          facebook?: string | null
          hours_saturday?: string | null
          hours_sunday?: string | null
          hours_weekdays?: string | null
          id?: string
          instagram?: string | null
          logo?: string | null
          lunch_break_end?: string | null
          lunch_break_start?: string | null
          maps_link?: string | null
          max_queue_size?: number | null
          name?: string
          overload_alert_enabled?: boolean | null
          phone?: string | null
          queue_enabled?: boolean | null
          tagline?: string | null
          tenant_id?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          daily_appointment_limit?: number | null
          description?: string | null
          facebook?: string | null
          hours_saturday?: string | null
          hours_sunday?: string | null
          hours_weekdays?: string | null
          id?: string
          instagram?: string | null
          logo?: string | null
          lunch_break_end?: string | null
          lunch_break_start?: string | null
          maps_link?: string | null
          max_queue_size?: number | null
          name?: string
          overload_alert_enabled?: boolean | null
          phone?: string | null
          queue_enabled?: boolean | null
          tagline?: string | null
          tenant_id?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      shop_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          plan_id: string
          starts_at: string
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id: string
          starts_at?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          plan_id?: string
          starts_at?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics: {
        Row: {
          created_at: string
          date: string
          id: string
          page: string
          tenant_id: string | null
          unique_visitors: number
          user_id: string | null
          visits: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          page: string
          tenant_id?: string | null
          unique_visitors?: number
          user_id?: string | null
          visits?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          page?: string
          tenant_id?: string | null
          unique_visitors?: number
          user_id?: string | null
          visits?: number
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          display_name: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          log_type: string
          message: string
          severity: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          log_type: string
          message: string
          severity?: string
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          log_type?: string
          message?: string
          severity?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          appointments_count: number
          clients_count: number
          created_at: string
          id: string
          month: number
          tenant_id: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          appointments_count?: number
          clients_count?: number
          created_at?: string
          id?: string
          month: number
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          appointments_count?: number
          clients_count?: number
          created_at?: string
          id?: string
          month?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_type: string | null
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_type?: string | null
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_type?: string | null
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string | null
          id: string
          instance_id: string | null
          is_resolved: boolean | null
          message: string | null
          resolved_at: string | null
          severity: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_resolved?: boolean | null
          message?: string | null
          resolved_at?: string | null
          severity?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_resolved?: boolean | null
          message?: string | null
          resolved_at?: string | null
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_alerts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          rate_limit_per_minute: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          rate_limit_per_minute?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          rate_limit_per_minute?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_api_keys_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_audit_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_automation_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_automations: {
        Row: {
          created_at: string | null
          delay_seconds: number | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          match_count: number | null
          name: string
          next_automation_id: string | null
          priority: number | null
          response_buttons: Json | null
          response_content: string | null
          response_list: Json | null
          response_type: string | null
          trigger_conditions: Json | null
          trigger_keywords: string[] | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_seconds?: number | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          match_count?: number | null
          name: string
          next_automation_id?: string | null
          priority?: number | null
          response_buttons?: Json | null
          response_content?: string | null
          response_list?: Json | null
          response_type?: string | null
          trigger_conditions?: Json | null
          trigger_keywords?: string[] | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_seconds?: number | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          match_count?: number | null
          name?: string
          next_automation_id?: string | null
          priority?: number | null
          response_buttons?: Json | null
          response_content?: string | null
          response_list?: Json | null
          response_type?: string | null
          trigger_conditions?: Json | null
          trigger_keywords?: string[] | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_automations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_automations_next_automation_id_fkey"
            columns: ["next_automation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_away_messages: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          message_text: string
          send_once_per_contact: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          message_text: string
          send_once_per_contact?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          message_text?: string
          send_once_per_contact?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_away_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_backend_config: {
        Row: {
          backend_url: string | null
          created_at: string
          id: string
          is_connected: boolean
          last_health_check: string | null
          master_token: string | null
          updated_at: string
        }
        Insert: {
          backend_url?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_health_check?: string | null
          master_token?: string | null
          updated_at?: string
        }
        Update: {
          backend_url?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          last_health_check?: string | null
          master_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_business_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          instance_id: string | null
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_business_hours_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          about: string | null
          created_at: string | null
          custom_fields: Json | null
          has_whatsapp: boolean | null
          id: string
          instance_id: string | null
          is_blocked: boolean | null
          is_business: boolean | null
          is_verified: boolean | null
          last_checked_at: string | null
          name: string | null
          phone: string
          profile_picture_url: string | null
          push_name: string | null
          synced_at: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          has_whatsapp?: boolean | null
          id?: string
          instance_id?: string | null
          is_blocked?: boolean | null
          is_business?: boolean | null
          is_verified?: boolean | null
          last_checked_at?: string | null
          name?: string | null
          phone: string
          profile_picture_url?: string | null
          push_name?: string | null
          synced_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          has_whatsapp?: boolean | null
          id?: string
          instance_id?: string | null
          is_blocked?: boolean | null
          is_business?: boolean | null
          is_verified?: boolean | null
          last_checked_at?: string | null
          name?: string | null
          phone?: string
          profile_picture_url?: string | null
          push_name?: string | null
          synced_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          is_archived: boolean | null
          is_blocked: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          last_message: string | null
          last_message_at: string | null
          notes: string | null
          phone: string
          profile_picture_url: string | null
          tags: string[] | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_archived?: boolean | null
          is_blocked?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          notes?: string | null
          phone: string
          profile_picture_url?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_archived?: boolean | null
          is_blocked?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          notes?: string | null
          phone?: string
          profile_picture_url?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_group_participants: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          is_admin: boolean | null
          is_super_admin: boolean | null
          joined_at: string | null
          name: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          joined_at?: string | null
          name?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          joined_at?: string | null
          name?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string | null
          description: string | null
          group_jid: string
          id: string
          instance_id: string | null
          is_admin: boolean | null
          is_archived: boolean | null
          last_message_at: string | null
          metadata: Json | null
          name: string | null
          owner_jid: string | null
          participant_count: number | null
          picture_url: string | null
          synced_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_jid: string
          id?: string
          instance_id?: string | null
          is_admin?: boolean | null
          is_archived?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner_jid?: string | null
          participant_count?: number | null
          picture_url?: string | null
          synced_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_jid?: string
          id?: string
          instance_id?: string | null
          is_admin?: boolean | null
          is_archived?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner_jid?: string | null
          participant_count?: number | null
          picture_url?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_health_checks: {
        Row: {
          checked_at: string | null
          connection_state: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          last_message_at: string | null
          latency_ms: number | null
          memory_usage_mb: number | null
          status: string
        }
        Insert: {
          checked_at?: string | null
          connection_state?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          latency_ms?: number | null
          memory_usage_mb?: number | null
          status: string
        }
        Update: {
          checked_at?: string | null
          connection_state?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          latency_ms?: number | null
          memory_usage_mb?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_health_checks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_inbox: {
        Row: {
          contact_name: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          is_from_me: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          media_mime_type: string | null
          media_url: string | null
          message_content: string | null
          message_id: string | null
          message_type: string | null
          metadata: Json | null
          phone_from: string
          phone_to: string | null
          read_at: string | null
          received_at: string | null
          replied_to_id: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_from_me?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          media_mime_type?: string | null
          media_url?: string | null
          message_content?: string | null
          message_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          phone_from: string
          phone_to?: string | null
          read_at?: string | null
          received_at?: string | null
          replied_to_id?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_from_me?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          media_mime_type?: string | null
          media_url?: string | null
          message_content?: string | null
          message_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          phone_from?: string
          phone_to?: string | null
          read_at?: string | null
          received_at?: string | null
          replied_to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_inbox_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_inbox_replied_to_id_fkey"
            columns: ["replied_to_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_inbox"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          auto_reconnect: boolean | null
          auto_reply_enabled: boolean
          auto_reply_message: string | null
          created_at: string
          heartbeat_interval_ms: number | null
          id: string
          instance_token: string
          last_heartbeat_at: string | null
          last_seen: string | null
          max_reconnect_attempts: number | null
          message_delay_ms: number
          name: string
          phone_number: string | null
          proxy_url: string | null
          reconnect_attempts: number | null
          session_backup: Json | null
          status: string
          updated_at: string
          uptime_seconds: number | null
          webhook_url: string | null
        }
        Insert: {
          auto_reconnect?: boolean | null
          auto_reply_enabled?: boolean
          auto_reply_message?: string | null
          created_at?: string
          heartbeat_interval_ms?: number | null
          id?: string
          instance_token?: string
          last_heartbeat_at?: string | null
          last_seen?: string | null
          max_reconnect_attempts?: number | null
          message_delay_ms?: number
          name: string
          phone_number?: string | null
          proxy_url?: string | null
          reconnect_attempts?: number | null
          session_backup?: Json | null
          status?: string
          updated_at?: string
          uptime_seconds?: number | null
          webhook_url?: string | null
        }
        Update: {
          auto_reconnect?: boolean | null
          auto_reply_enabled?: boolean
          auto_reply_message?: string | null
          created_at?: string
          heartbeat_interval_ms?: number | null
          id?: string
          instance_token?: string
          last_heartbeat_at?: string | null
          last_seen?: string | null
          max_reconnect_attempts?: number | null
          message_delay_ms?: number
          name?: string
          phone_number?: string | null
          proxy_url?: string | null
          reconnect_attempts?: number | null
          session_backup?: Json | null
          status?: string
          updated_at?: string
          uptime_seconds?: number | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_labels: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      whatsapp_message_logs: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          id: string
          instance_id: string
          message: string
          phone_to: string
          status: string
        }
        Insert: {
          created_at?: string
          direction: string
          error_message?: string | null
          id?: string
          instance_id: string
          message: string
          phone_to: string
          status?: string
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          instance_id?: string
          message?: string
          phone_to?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_metrics: {
        Row: {
          avg_response_time_seconds: number | null
          created_at: string | null
          disconnection_count: number | null
          id: string
          instance_id: string | null
          media_received: number | null
          media_sent: number | null
          messages_failed: number | null
          messages_received: number | null
          messages_sent: number | null
          metric_date: string
          unique_contacts: number | null
          updated_at: string | null
          uptime_seconds: number | null
        }
        Insert: {
          avg_response_time_seconds?: number | null
          created_at?: string | null
          disconnection_count?: number | null
          id?: string
          instance_id?: string | null
          media_received?: number | null
          media_sent?: number | null
          messages_failed?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          metric_date: string
          unique_contacts?: number | null
          updated_at?: string | null
          uptime_seconds?: number | null
        }
        Update: {
          avg_response_time_seconds?: number | null
          created_at?: string | null
          disconnection_count?: number | null
          id?: string
          instance_id?: string | null
          media_received?: number | null
          media_sent?: number | null
          messages_failed?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          metric_date?: string
          unique_contacts?: number | null
          updated_at?: string | null
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_metrics_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_quick_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          media_url: string | null
          shortcut: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          media_url?: string | null
          shortcut: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          media_url?: string | null
          shortcut?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_quick_replies_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_scheduled_messages: {
        Row: {
          buttons: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          list_options: Json | null
          max_retries: number | null
          media_url: string | null
          message_content: string | null
          message_type: string | null
          phone_to: string
          retry_count: number | null
          scheduled_at: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          buttons?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          list_options?: Json | null
          max_retries?: number | null
          media_url?: string | null
          message_content?: string | null
          message_type?: string | null
          phone_to: string
          retry_count?: number | null
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          buttons?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          list_options?: Json | null
          max_retries?: number | null
          media_url?: string | null
          message_content?: string | null
          message_type?: string | null
          phone_to?: string
          retry_count?: number | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_scheduled_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_security_settings: {
        Row: {
          audit_log_enabled: boolean | null
          blocked_keywords: string[] | null
          created_at: string | null
          id: string
          instance_id: string | null
          ip_whitelist: string[] | null
          message_delay_max_ms: number | null
          message_delay_min_ms: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          require_2fa: boolean | null
          typing_duration_ms: number | null
          typing_simulation: boolean | null
          updated_at: string | null
          warmup_day: number | null
          warmup_enabled: boolean | null
          warmup_messages_per_day: number | null
        }
        Insert: {
          audit_log_enabled?: boolean | null
          blocked_keywords?: string[] | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_whitelist?: string[] | null
          message_delay_max_ms?: number | null
          message_delay_min_ms?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          require_2fa?: boolean | null
          typing_duration_ms?: number | null
          typing_simulation?: boolean | null
          updated_at?: string | null
          warmup_day?: number | null
          warmup_enabled?: boolean | null
          warmup_messages_per_day?: number | null
        }
        Update: {
          audit_log_enabled?: boolean | null
          blocked_keywords?: string[] | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_whitelist?: string[] | null
          message_delay_max_ms?: number | null
          message_delay_min_ms?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          require_2fa?: boolean | null
          typing_duration_ms?: number | null
          typing_simulation?: boolean | null
          updated_at?: string | null
          warmup_day?: number | null
          warmup_enabled?: boolean | null
          warmup_messages_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_security_settings_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_send_queue: {
        Row: {
          attempts: number | null
          buttons: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          list_options: Json | null
          max_attempts: number | null
          media_caption: string | null
          media_url: string | null
          message_content: string | null
          message_type: string | null
          next_attempt_at: string | null
          phone_to: string
          priority: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          buttons?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          list_options?: Json | null
          max_attempts?: number | null
          media_caption?: string | null
          media_url?: string | null
          message_content?: string | null
          message_type?: string | null
          next_attempt_at?: string | null
          phone_to: string
          priority?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          buttons?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          list_options?: Json | null
          max_attempts?: number | null
          media_caption?: string | null
          media_url?: string | null
          message_content?: string | null
          message_type?: string | null
          next_attempt_at?: string | null
          phone_to?: string
          priority?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_send_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          ai_prompt: string | null
          button_text: string | null
          button_url: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          message_template: string
          name: string
          template_type: string
          updated_at: string | null
          use_ai: boolean | null
        }
        Insert: {
          ai_prompt?: string | null
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message_template: string
          name: string
          template_type: string
          updated_at?: string | null
          use_ai?: boolean | null
        }
        Update: {
          ai_prompt?: string | null
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message_template?: string
          name?: string
          template_type?: string
          updated_at?: string | null
          use_ai?: boolean | null
        }
        Relationships: []
      }
      whatsapp_webhook_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          is_success: boolean | null
          latency_ms: number | null
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          is_success?: boolean | null
          latency_ms?: number | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          is_success?: boolean | null
          latency_ms?: number | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          failure_count: number | null
          headers: Json | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          last_status_code: number | null
          last_triggered_at: string | null
          name: string
          retry_count: number | null
          retry_delay_seconds: number | null
          retry_enabled: boolean | null
          secret_key: string | null
          success_count: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          events: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          name: string
          retry_count?: number | null
          retry_delay_seconds?: number | null
          retry_enabled?: boolean | null
          secret_key?: string | null
          success_count?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          name?: string
          retry_count?: number | null
          retry_delay_seconds?: number | null
          retry_enabled?: boolean | null
          secret_key?: string | null
          success_count?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhooks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ip_fraud: { Args: { check_ip: string }; Returns: boolean }
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
      current_tenant_id: { Args: never; Returns: string }
      current_tenant_ids: { Args: never; Returns: string[] }
      get_affiliate_id: { Args: { _user_id: string }; Returns: string }
      get_crm_tenant_id: { Args: { _auth_user_id: string }; Returns: string }
      get_crm_user_id: { Args: { _auth_user_id: string }; Returns: string }
      get_user_plan: { Args: { check_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_affiliate: { Args: { _user_id: string }; Returns: boolean }
      is_crm_admin: { Args: { _auth_user_id: string }; Returns: boolean }
      is_crm_member: {
        Args: { _auth_user_id: string; _tenant_id: string }
        Returns: boolean
      }
      is_feature_allowed: {
        Args: { check_user_id: string; feature_name: string }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
        }
        Returns: undefined
      }
      pay_proposal_commission: {
        Args: { proposal_id: string }
        Returns: boolean
      }
      tenant_matches: { Args: { p_tenant: string }; Returns: boolean }
      validate_token_owner: {
        Args: { token_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      affiliate_status: "pending" | "active" | "blocked"
      app_role: "super_admin" | "admin" | "barber"
      crm_lead_status: "new" | "active" | "won" | "lost"
      crm_role: "admin" | "manager" | "collaborator"
      crm_task_status: "pending" | "in_progress" | "completed" | "cancelled"
      crm_task_type: "call" | "meeting" | "followup" | "internal"
      pix_type: "cpf" | "cnpj" | "email" | "phone" | "random"
      proposal_status: "draft" | "sent" | "accepted" | "cancelled"
      referral_status: "pending" | "confirmed" | "cancelled" | "paid"
      withdrawal_status: "pending" | "processing" | "completed" | "rejected"
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
      affiliate_status: ["pending", "active", "blocked"],
      app_role: ["super_admin", "admin", "barber"],
      crm_lead_status: ["new", "active", "won", "lost"],
      crm_role: ["admin", "manager", "collaborator"],
      crm_task_status: ["pending", "in_progress", "completed", "cancelled"],
      crm_task_type: ["call", "meeting", "followup", "internal"],
      pix_type: ["cpf", "cnpj", "email", "phone", "random"],
      proposal_status: ["draft", "sent", "accepted", "cancelled"],
      referral_status: ["pending", "confirmed", "cancelled", "paid"],
      withdrawal_status: ["pending", "processing", "completed", "rejected"],
    },
  },
} as const
