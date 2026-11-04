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
      app_settings: {
        Row: {
          business_type: string | null
          certifications: Json | null
          created_at: string
          currency: string
          default_callout_fee: number | null
          default_day_rate: number | null
          default_hourly_rate: number | null
          default_pdf_template_id: string | null
          email_notifications: boolean
          id: string
          include_vat: boolean
          invoice_reminders: boolean
          language: string
          onboarding_completed: boolean | null
          other_trade_attributes: Json | null
          other_trade_description: string | null
          other_trade_name: string | null
          other_trade_similar_to: string | null
          payment_terms: number
          pdf_theme: string
          preferred_suppliers: Json | null
          primary_trade: string | null
          quote_expiry: number
          quote_generation_mode: string | null
          secondary_trades: Json | null
          setup_checklist: Json | null
          skip_ai_pricing: boolean | null
          specializations: Json | null
          trade_notes: string | null
          typical_job_size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string | null
          certifications?: Json | null
          created_at?: string
          currency?: string
          default_callout_fee?: number | null
          default_day_rate?: number | null
          default_hourly_rate?: number | null
          default_pdf_template_id?: string | null
          email_notifications?: boolean
          id?: string
          include_vat?: boolean
          invoice_reminders?: boolean
          language?: string
          onboarding_completed?: boolean | null
          other_trade_attributes?: Json | null
          other_trade_description?: string | null
          other_trade_name?: string | null
          other_trade_similar_to?: string | null
          payment_terms?: number
          pdf_theme?: string
          preferred_suppliers?: Json | null
          primary_trade?: string | null
          quote_expiry?: number
          quote_generation_mode?: string | null
          secondary_trades?: Json | null
          setup_checklist?: Json | null
          skip_ai_pricing?: boolean | null
          specializations?: Json | null
          trade_notes?: string | null
          typical_job_size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string | null
          certifications?: Json | null
          created_at?: string
          currency?: string
          default_callout_fee?: number | null
          default_day_rate?: number | null
          default_hourly_rate?: number | null
          default_pdf_template_id?: string | null
          email_notifications?: boolean
          id?: string
          include_vat?: boolean
          invoice_reminders?: boolean
          language?: string
          onboarding_completed?: boolean | null
          other_trade_attributes?: Json | null
          other_trade_description?: string | null
          other_trade_name?: string | null
          other_trade_similar_to?: string | null
          payment_terms?: number
          pdf_theme?: string
          preferred_suppliers?: Json | null
          primary_trade?: string | null
          quote_expiry?: number
          quote_generation_mode?: string | null
          secondary_trades?: Json | null
          setup_checklist?: Json | null
          skip_ai_pricing?: boolean | null
          specializations?: Json | null
          trade_notes?: string | null
          typical_job_size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_default_pdf_template_id_fkey"
            columns: ["default_pdf_template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          payment_link: string | null
          account_name: string | null
          account_number: string | null
          address: string | null
          bank_name: string | null
          company_name: string | null
          created_at: string
          email: string | null
          iban: string | null
          id: string
          logo_url: string | null
          payment_notes: string | null
          phone: string | null
          sort_code: string | null
          swift_bic: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          payment_link?: string | null
          account_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          logo_url?: string | null
          payment_notes?: string | null
          phone?: string | null
          sort_code?: string | null
          swift_bic?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          payment_link?: string | null
          account_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          logo_url?: string | null
          payment_notes?: string | null
          phone?: string | null
          sort_code?: string | null
          swift_bic?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commodity_indices: {
        Row: {
          base_date: string
          commodity: string
          id: string
          index_date: string
          index_value: number
          last_updated: string | null
          percentage_change: number | null
          source: string | null
        }
        Insert: {
          base_date: string
          commodity: string
          id?: string
          index_date: string
          index_value: number
          last_updated?: string | null
          percentage_change?: number | null
          source?: string | null
        }
        Update: {
          base_date?: string
          commodity?: string
          id?: string
          index_date?: string
          index_value?: number
          last_updated?: string | null
          percentage_change?: number | null
          source?: string | null
        }
        Relationships: []
      }
      compliance_rules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          regulation: string
          required_items: Json | null
          rule_code: string
          trade: string
          validation_logic: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          regulation: string
          required_items?: Json | null
          rule_code: string
          trade: string
          validation_logic?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          regulation?: string
          required_items?: Json | null
          rule_code?: string
          trade?: string
          validation_logic?: string | null
        }
        Relationships: []
      }
      crawl_queue: {
        Row: {
          category: string | null
          crawl_status: string | null
          created_at: string | null
          error_message: string | null
          id: string
          last_crawled: string | null
          priority: number | null
          product_count: number | null
          supplier: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          crawl_status?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_crawled?: string | null
          priority?: number | null
          product_count?: number | null
          supplier: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          crawl_status?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_crawled?: string | null
          priority?: number | null
          product_count?: number | null
          supplier?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sku: string | null
          unit: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sku?: string | null
          unit?: string
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sku?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_templates: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          share_token: string | null
          customer_viewed_at: string | null
          amount: number
          client: string
          client_id: string | null
          created_at: string
          date: string
          due_date: string
          id: string
          invoice_number: string
          quote_id: string | null
          status: string | null
          summary: string | null
          tax: number
          title: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          share_token?: string | null
          customer_viewed_at?: string | null
          amount: number
          client: string
          client_id?: string | null
          created_at?: string
          date: string
          due_date: string
          id?: string
          invoice_number: string
          quote_id?: string | null
          status?: string | null
          summary?: string | null
          tax: number
          title: string
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          share_token?: string | null
          customer_viewed_at?: string | null
          amount?: number
          client?: string
          client_id?: string | null
          created_at?: string
          date?: string
          due_date?: string
          id?: string
          invoice_number?: string
          quote_id?: string | null
          status?: string | null
          summary?: string | null
          tax?: number
          title?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          category: string
          confidence_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          max_price: number | null
          min_price: number | null
          product_name: string
          product_url: string | null
          region: string | null
          sku: string | null
          source_id: string | null
          subcategory: string | null
          unit: string
          unit_price: number
        }
        Insert: {
          category: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          max_price?: number | null
          min_price?: number | null
          product_name: string
          product_url?: string | null
          region?: string | null
          sku?: string | null
          source_id?: string | null
          subcategory?: string | null
          unit: string
          unit_price: number
        }
        Update: {
          category?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          max_price?: number | null
          min_price?: number | null
          product_name?: string
          product_url?: string | null
          region?: string | null
          sku?: string | null
          source_id?: string | null
          subcategory?: string | null
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "price_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          created_at: string
          font_family: string
          header_style: string
          id: string
          invoice_show_bank_details: boolean
          invoice_show_due_date_prominent: boolean
          invoice_show_job_details: boolean
          invoice_show_payment_terms: boolean
          invoice_show_vat_breakdown: boolean
          is_default: boolean
          logo_position: string
          logo_size: string
          name: string
          primary_colour: string
          quote_condensed_labour: boolean
          quote_condensed_materials: boolean
          quote_show_expiry: boolean
          quote_show_labour: boolean
          quote_show_materials: boolean
          quote_show_overheads: boolean
          quote_show_scope: boolean
          quote_show_summary: boolean
          secondary_colour: string
          show_company_details: boolean
          show_vat_number: boolean
          show_website: boolean
          table_show_line_totals: boolean
          table_show_quantities: boolean
          table_show_unit_prices: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font_family?: string
          header_style?: string
          id?: string
          invoice_show_bank_details?: boolean
          invoice_show_due_date_prominent?: boolean
          invoice_show_job_details?: boolean
          invoice_show_payment_terms?: boolean
          invoice_show_vat_breakdown?: boolean
          is_default?: boolean
          logo_position?: string
          logo_size?: string
          name?: string
          primary_colour?: string
          quote_condensed_labour?: boolean
          quote_condensed_materials?: boolean
          quote_show_expiry?: boolean
          quote_show_labour?: boolean
          quote_show_materials?: boolean
          quote_show_overheads?: boolean
          quote_show_scope?: boolean
          quote_show_summary?: boolean
          secondary_colour?: string
          show_company_details?: boolean
          show_vat_number?: boolean
          show_website?: boolean
          table_show_line_totals?: boolean
          table_show_quantities?: boolean
          table_show_unit_prices?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font_family?: string
          header_style?: string
          id?: string
          invoice_show_bank_details?: boolean
          invoice_show_due_date_prominent?: boolean
          invoice_show_job_details?: boolean
          invoice_show_payment_terms?: boolean
          invoice_show_vat_breakdown?: boolean
          is_default?: boolean
          logo_position?: string
          logo_size?: string
          name?: string
          primary_colour?: string
          quote_condensed_labour?: boolean
          quote_condensed_materials?: boolean
          quote_show_expiry?: boolean
          quote_show_labour?: boolean
          quote_show_materials?: boolean
          quote_show_overheads?: boolean
          quote_show_scope?: boolean
          quote_show_summary?: boolean
          secondary_colour?: string
          show_company_details?: boolean
          show_vat_number?: boolean
          show_website?: boolean
          table_show_line_totals?: boolean
          table_show_quantities?: boolean
          table_show_unit_prices?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: string
          market_price_id: string | null
          price: number
          recorded_at: string | null
          source_id: string | null
        }
        Insert: {
          id?: string
          market_price_id?: string | null
          price: number
          recorded_at?: string | null
          source_id?: string | null
        }
        Update: {
          id?: string
          market_price_id?: string | null
          price?: number
          recorded_at?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_market_price_id_fkey"
            columns: ["market_price_id"]
            isOneToOne: false
            referencedRelation: "market_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "price_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      price_sources: {
        Row: {
          applicable_trades: string[] | null
          base_url: string | null
          config: Json | null
          created_at: string | null
          fetch_frequency: string | null
          id: string
          is_enabled: boolean | null
          last_fetch_at: string | null
          last_fetch_status: string | null
          name: string
          priority: number | null
          requires_api_key: boolean | null
          robots_txt_compliant: boolean | null
          source_type: string
        }
        Insert: {
          applicable_trades?: string[] | null
          base_url?: string | null
          config?: Json | null
          created_at?: string | null
          fetch_frequency?: string | null
          id?: string
          is_enabled?: boolean | null
          last_fetch_at?: string | null
          last_fetch_status?: string | null
          name: string
          priority?: number | null
          requires_api_key?: boolean | null
          robots_txt_compliant?: boolean | null
          source_type: string
        }
        Update: {
          applicable_trades?: string[] | null
          base_url?: string | null
          config?: Json | null
          created_at?: string | null
          fetch_frequency?: string | null
          id?: string
          is_enabled?: boolean | null
          last_fetch_at?: string | null
          last_fetch_status?: string | null
          name?: string
          priority?: number | null
          requires_api_key?: boolean | null
          robots_txt_compliant?: boolean | null
          source_type?: string
        }
        Relationships: []
      }
      quote_templates: {
        Row: {
          category: string
          created_at: string
          equipment_rental: boolean | null
          hourly_rate: number | null
          id: string
          job_description: string
          labour: Json
          materials: Json
          name: string
          num_workers: number | null
          overheads: Json
          payment_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          equipment_rental?: boolean | null
          hourly_rate?: number | null
          id?: string
          job_description: string
          labour?: Json
          materials?: Json
          name: string
          num_workers?: number | null
          overheads?: Json
          payment_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          equipment_rental?: boolean | null
          hourly_rate?: number | null
          id?: string
          job_description?: string
          labour?: Json
          materials?: Json
          name?: string
          num_workers?: number | null
          overheads?: Json
          payment_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_templates_library: {
        Row: {
          appliance_type: string | null
          compliance_rules: Json | null
          created_at: string | null
          description: string | null
          environmental_requirements: Json | null
          fuel_type: string | null
          hidden_tasks: Json | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          labour_hours_max: number | null
          labour_hours_min: number | null
          labour_tasks: Json
          optional_materials: Json | null
          price_range_max: number | null
          price_range_min: number | null
          required_materials: Json
          safety_requirements: Json | null
          setting: string | null
          speciality: string | null
          template_key: string
          template_name: string
          trade: string
          updated_at: string | null
        }
        Insert: {
          appliance_type?: string | null
          compliance_rules?: Json | null
          created_at?: string | null
          description?: string | null
          environmental_requirements?: Json | null
          fuel_type?: string | null
          hidden_tasks?: Json | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          labour_hours_max?: number | null
          labour_hours_min?: number | null
          labour_tasks?: Json
          optional_materials?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          required_materials?: Json
          safety_requirements?: Json | null
          setting?: string | null
          speciality?: string | null
          template_key: string
          template_name: string
          trade: string
          updated_at?: string | null
        }
        Update: {
          appliance_type?: string | null
          compliance_rules?: Json | null
          created_at?: string | null
          description?: string | null
          environmental_requirements?: Json | null
          fuel_type?: string | null
          hidden_tasks?: Json | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          labour_hours_max?: number | null
          labour_hours_min?: number | null
          labour_tasks?: Json
          optional_materials?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          required_materials?: Json
          safety_requirements?: Json | null
          setting?: string | null
          speciality?: string | null
          template_key?: string
          template_name?: string
          trade?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          share_token: string | null
          customer_viewed_at: string | null
          accepted_at: string | null
          accepted_name: string | null
          deposit_percent: number | null
          valid_until: string | null
          photos: Json
          category: string
          client: string
          client_id: string | null
          created_at: string
          day_rate: number | null
          equipment_rental: boolean | null
          grand_total: number
          hourly_rate: number | null
          id: string
          job_description: string
          labour: Json
          location: string
          materials: Json
          num_workers: number | null
          overheads: Json
          payment_type: string | null
          status: string | null
          summary: string | null
          title: string
          total_labour: number
          total_materials: number
          total_overheads: number
          updated_at: string
          user_id: string
        }
        Insert: {
          share_token?: string | null
          customer_viewed_at?: string | null
          accepted_at?: string | null
          accepted_name?: string | null
          deposit_percent?: number | null
          valid_until?: string | null
          photos?: Json
          category: string
          client: string
          client_id?: string | null
          created_at?: string
          day_rate?: number | null
          equipment_rental?: boolean | null
          grand_total: number
          hourly_rate?: number | null
          id?: string
          job_description: string
          labour: Json
          location: string
          materials: Json
          num_workers?: number | null
          overheads: Json
          payment_type?: string | null
          status?: string | null
          summary?: string | null
          title: string
          total_labour: number
          total_materials: number
          total_overheads: number
          updated_at?: string
          user_id: string
        }
        Update: {
          share_token?: string | null
          customer_viewed_at?: string | null
          accepted_at?: string | null
          accepted_name?: string | null
          deposit_percent?: number | null
          valid_until?: string | null
          photos?: Json
          category?: string
          client?: string
          client_id?: string | null
          created_at?: string
          day_rate?: number | null
          equipment_rental?: boolean | null
          grand_total?: number
          hourly_rate?: number | null
          id?: string
          job_description?: string
          labour?: Json
          location?: string
          materials?: Json
          num_workers?: number | null
          overheads?: Json
          payment_type?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          total_labour?: number
          total_materials?: number
          total_overheads?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          amount: number
          client: string
          client_id: string | null
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          last_invoice_date: string | null
          next_invoice_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          last_invoice_date?: string | null
          next_invoice_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_invoice_date?: string | null
          next_invoice_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_adjustments: {
        Row: {
          adjustment_factor: number | null
          category: string | null
          id: string
          last_updated: string | null
          notes: string | null
          region: string
        }
        Insert: {
          adjustment_factor?: number | null
          category?: string | null
          id?: string
          last_updated?: string | null
          notes?: string | null
          region: string
        }
        Update: {
          adjustment_factor?: number | null
          category?: string | null
          id?: string
          last_updated?: string | null
          notes?: string | null
          region?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          duration_days: number
          duration_hours: number | null
          end_date: string
          id: string
          notes: string | null
          quote_id: string
          start_date: string
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          duration_hours?: number | null
          end_date: string
          id?: string
          notes?: string | null
          quote_id: string
          start_date: string
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          duration_hours?: number | null
          end_date?: string
          id?: string
          notes?: string | null
          quote_id?: string
          start_date?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_configs: {
        Row: {
          applicable_trades: string[] | null
          base_url: string
          category_paths: Json | null
          crawl_status: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_crawl_at: string | null
          max_pages: number | null
          pagination_pattern: string | null
          priority: number | null
          supplier_name: string
        }
        Insert: {
          applicable_trades?: string[] | null
          base_url: string
          category_paths?: Json | null
          crawl_status?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_crawl_at?: string | null
          max_pages?: number | null
          pagination_pattern?: string | null
          priority?: number | null
          supplier_name: string
        }
        Update: {
          applicable_trades?: string[] | null
          base_url?: string
          category_paths?: Json | null
          crawl_status?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_crawl_at?: string | null
          max_pages?: number | null
          pagination_pattern?: string | null
          priority?: number | null
          supplier_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          ip_address: string | null
          privacy_accepted: boolean
          privacy_accepted_at: string | null
          privacy_version: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          privacy_version?: string
          terms_version?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          privacy_version?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_theme_settings: {
        Row: {
          color_palette: string
          created_at: string
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color_palette?: string
          created_at?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color_palette?: string
          created_at?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      terms_acceptances_with_emails: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string | null
          id: string | null
          ip_address: string | null
          privacy_accepted: boolean | null
          privacy_accepted_at: string | null
          privacy_version: string | null
          terms_version: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          ip_address?: string | null
          privacy_accepted?: boolean | null
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          terms_version?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          ip_address?: string | null
          privacy_accepted?: boolean | null
          privacy_accepted_at?: string | null
          privacy_version?: string | null
          terms_version?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_email_for_acceptance: {
        Args: { user_id_param: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
