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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_type: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_type?: string
          settings?: Json
          updated_at?: string
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
          time: string
          updated_at: string
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
          time: string
          updated_at?: string
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
          time?: string
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          available_slots?: string[]
          barber_id: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
        }
        Update: {
          available_slots?: string[]
          barber_id?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          total_appointments: number
          total_revenue: number
          updated_at: string
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
          total_appointments?: number
          total_revenue?: number
          updated_at?: string
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
          total_appointments?: number
          total_revenue?: number
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_enabled?: boolean
          start_time?: string
          updated_at?: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_enabled?: boolean
          start_time?: string
          updated_at?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
        }
        Insert: {
          barber_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
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
      chatpro_config: {
        Row: {
          api_token: string | null
          base_endpoint: string | null
          created_at: string
          id: string
          instance_id: string | null
          is_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          api_token?: string | null
          base_endpoint?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          is_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          api_token?: string | null
          base_endpoint?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          is_enabled?: boolean | null
          updated_at?: string
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
          updated_at: string
          use_ai: boolean
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
          updated_at?: string
          use_ai?: boolean
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
          updated_at?: string
          use_ai?: boolean
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          title: string
          updated_at: string
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
          title: string
          updated_at?: string
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
          title?: string
          updated_at?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
      push_subscriptions: {
        Row: {
          auth: string
          client_phone: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string
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
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          icon: string | null
          id: string
          name: string
          price: number
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          theme: string | null
          updated_at: string
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
          theme?: string | null
          updated_at?: string
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
          theme?: string | null
          updated_at?: string
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
          unique_visitors: number
          visits: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          page: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          page?: string
          unique_visitors?: number
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
      usage_metrics: {
        Row: {
          appointments_count: number
          clients_count: number
          created_at: string
          id: string
          month: number
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
          updated_at?: string
          user_id?: string
          year?: number
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
      webhook_configs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ip_fraud: { Args: { check_ip: string }; Returns: boolean }
      get_user_plan: { Args: { check_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_feature_allowed: {
        Args: { check_user_id: string; feature_name: string }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "barber"
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
      app_role: ["super_admin", "admin", "barber"],
    },
  },
} as const
