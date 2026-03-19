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
      ai_prompt_log: {
        Row: {
          beat_id: string | null
          cost_estimate: number | null
          created_at: string | null
          duration_ms: number | null
          id: string
          image_url: string | null
          input_tokens: number | null
          model: string
          output_tokens: number | null
          prompt_text: string
          response_summary: string | null
          scene_id: string | null
          script_id: string | null
          source: string
          status: string
        }
        Insert: {
          beat_id?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          image_url?: string | null
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          prompt_text: string
          response_summary?: string | null
          scene_id?: string | null
          script_id?: string | null
          source?: string
          status?: string
        }
        Update: {
          beat_id?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          image_url?: string | null
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          prompt_text?: string
          response_summary?: string | null
          scene_id?: string | null
          script_id?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_log_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_bulletins: {
        Row: {
          call_sheet_id: string
          created_at: string
          id: string
          pinned: boolean
          sort_order: number
          text: string
          visible: boolean
        }
        Insert: {
          call_sheet_id: string
          created_at?: string
          id?: string
          pinned?: boolean
          sort_order?: number
          text?: string
          visible?: boolean
        }
        Update: {
          call_sheet_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
          sort_order?: number
          text?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_bulletins_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_cast: {
        Row: {
          call_sheet_id: string
          call_time: string | null
          character_id: string | null
          contact_id: string
          id: string
          sort_order: number
          status: string
          wrap_time: string | null
        }
        Insert: {
          call_sheet_id: string
          call_time?: string | null
          character_id?: string | null
          contact_id: string
          id?: string
          sort_order?: number
          status?: string
          wrap_time?: string | null
        }
        Update: {
          call_sheet_id?: string
          call_time?: string | null
          character_id?: string | null
          contact_id?: string
          id?: string
          sort_order?: number
          status?: string
          wrap_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_cast_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_cast_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "script_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_cast_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_crew: {
        Row: {
          call_sheet_id: string
          call_time: string | null
          contact_id: string
          id: string
          role_override: string | null
          sort_order: number
          wrap_time: string | null
        }
        Insert: {
          call_sheet_id: string
          call_time?: string | null
          contact_id: string
          id?: string
          role_override?: string | null
          sort_order?: number
          wrap_time?: string | null
        }
        Update: {
          call_sheet_id?: string
          call_time?: string | null
          contact_id?: string
          id?: string
          role_override?: string | null
          sort_order?: number
          wrap_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_crew_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_crew_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_dept_notes: {
        Row: {
          call_sheet_id: string
          department: string
          id: string
          notes: string
          sort_order: number
          visible: boolean
        }
        Insert: {
          call_sheet_id: string
          department?: string
          id?: string
          notes?: string
          sort_order?: number
          visible?: boolean
        }
        Update: {
          call_sheet_id?: string
          department?: string
          id?: string
          notes?: string
          sort_order?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_dept_notes_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_location_images: {
        Row: {
          call_sheet_id: string
          id: string
          location_image_id: string
          sort_order: number
          source: string
        }
        Insert: {
          call_sheet_id: string
          id?: string
          location_image_id: string
          sort_order?: number
          source?: string
        }
        Update: {
          call_sheet_id?: string
          id?: string
          location_image_id?: string
          sort_order?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_location_images_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_location_images_location_image_id_fkey"
            columns: ["location_image_id"]
            isOneToOne: false
            referencedRelation: "location_images"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_locations: {
        Row: {
          call_sheet_id: string
          created_at: string
          id: string
          location_id: string
          parking_address: string | null
          parking_note: string | null
          sort_order: number
          visible: boolean
        }
        Insert: {
          call_sheet_id: string
          created_at?: string
          id?: string
          location_id: string
          parking_address?: string | null
          parking_note?: string | null
          sort_order?: number
          visible?: boolean
        }
        Update: {
          call_sheet_id?: string
          created_at?: string
          id?: string
          location_id?: string
          parking_address?: string | null
          parking_note?: string | null
          sort_order?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_locations_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_scenes: {
        Row: {
          call_sheet_id: string
          end_time: string | null
          id: string
          notes: string | null
          scene_id: string
          selected: boolean
          sort_order: number
          start_time: string | null
        }
        Insert: {
          call_sheet_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          scene_id: string
          selected?: boolean
          sort_order?: number
          start_time?: string | null
        }
        Update: {
          call_sheet_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          scene_id?: string
          selected?: boolean
          sort_order?: number
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_scenes_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_scenes_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "script_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheet_vendors: {
        Row: {
          call_sheet_id: string
          company_id: string
          contact_person: string | null
          id: string
          phone_override: string | null
          role_label: string | null
          sort_order: number
        }
        Insert: {
          call_sheet_id: string
          company_id: string
          contact_person?: string | null
          id?: string
          phone_override?: string | null
          role_label?: string | null
          sort_order?: number
        }
        Update: {
          call_sheet_id?: string
          company_id?: string
          contact_person?: string | null
          id?: string
          phone_override?: string | null
          role_label?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "call_sheet_vendors_call_sheet_id_fkey"
            columns: ["call_sheet_id"]
            isOneToOne: false
            referencedRelation: "call_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheet_vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sheets: {
        Row: {
          created_at: string
          created_by: string | null
          crew_call: string | null
          date: string
          dept_notes_visible: boolean
          doordash_enabled: boolean
          doordash_link: string | null
          estimated_wrap: string | null
          general_call_time: string
          hospital_address: string | null
          hospital_name: string | null
          hospital_phone: string | null
          id: string
          location_id: string | null
          lunch_time: string | null
          parking_address: string | null
          parking_note: string | null
          project_id: string | null
          script_id: string | null
          set_contact: string | null
          shoot_day: number
          shooting_call: string | null
          slug: string
          status: string
          talent_call: string | null
          total_days: number
          updated_at: string
          updated_by: string | null
          vendors_visible: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crew_call?: string | null
          date?: string
          dept_notes_visible?: boolean
          doordash_enabled?: boolean
          doordash_link?: string | null
          estimated_wrap?: string | null
          general_call_time?: string
          hospital_address?: string | null
          hospital_name?: string | null
          hospital_phone?: string | null
          id?: string
          location_id?: string | null
          lunch_time?: string | null
          parking_address?: string | null
          parking_note?: string | null
          project_id?: string | null
          script_id?: string | null
          set_contact?: string | null
          shoot_day?: number
          shooting_call?: string | null
          slug?: string
          status?: string
          talent_call?: string | null
          total_days?: number
          updated_at?: string
          updated_by?: string | null
          vendors_visible?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crew_call?: string | null
          date?: string
          dept_notes_visible?: boolean
          doordash_enabled?: boolean
          doordash_link?: string | null
          estimated_wrap?: string | null
          general_call_time?: string
          hospital_address?: string | null
          hospital_name?: string | null
          hospital_phone?: string | null
          id?: string
          location_id?: string | null
          lunch_time?: string | null
          parking_address?: string | null
          parking_note?: string | null
          project_id?: string | null
          script_id?: string | null
          set_contact?: string | null
          shoot_day?: number
          shooting_call?: string | null
          slug?: string
          status?: string
          talent_call?: string | null
          total_days?: number
          updated_at?: string
          updated_by?: string | null
          vendors_visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "call_sheets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sheets_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          model: string
          panel_context: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string
          panel_context?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          panel_context?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context: Json | null
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          context?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          context?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          name: string
          portal_password: string
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          name: string
          portal_password: string
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          name?: string
          portal_password?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          company_size: string | null
          company_types: string[]
          created_at: string
          description: string | null
          email: string
          founded_year: number | null
          id: string
          industry: string[] | null
          instagram_url: string | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          name: string
          notes: string | null
          portal_password: string | null
          slack_channel_id: string | null
          status: string
          twitter_url: string | null
          website_url: string | null
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          company_types?: string[]
          created_at?: string
          description?: string | null
          email: string
          founded_year?: number | null
          id?: string
          industry?: string[] | null
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          portal_password?: string | null
          slack_channel_id?: string | null
          status?: string
          twitter_url?: string | null
          website_url?: string | null
        }
        Update: {
          company?: string | null
          company_size?: string | null
          company_types?: string[]
          created_at?: string
          description?: string | null
          email?: string
          founded_year?: number | null
          id?: string
          industry?: string[] | null
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          portal_password?: string | null
          slack_channel_id?: string | null
          status?: string
          twitter_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      contact_roles: {
        Row: {
          contact_id: string
          role_id: string
        }
        Insert: {
          contact_id: string
          role_id: string
        }
        Update: {
          contact_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_roles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string
          email: string | null
          first_name: string
          headshot_url: string | null
          id: string
          imdb_url: string | null
          instagram_url: string | null
          last_name: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          role: string | null
          type: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          headshot_url?: string | null
          id?: string
          imdb_url?: string | null
          instagram_url?: string | null
          last_name: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          headshot_url?: string | null
          id?: string
          imdb_url?: string | null
          instagram_url?: string | null
          last_name?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      content_snippets: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          snippet_type: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          snippet_type?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          snippet_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_events: {
        Row: {
          actor_email: string | null
          contract_id: string
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          signer_email: string | null
        }
        Insert: {
          actor_email?: string | null
          contract_id: string
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          signer_email?: string | null
        }
        Update: {
          actor_email?: string | null
          contract_id?: string
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          signer_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signers: {
        Row: {
          contact_id: string | null
          contract_id: string
          created_at: string
          email: string
          id: string
          name: string
          role: string
          signed_at: string | null
          signwell_signer_id: string | null
          sort_order: number
          status: string
          viewed_at: string | null
        }
        Insert: {
          contact_id?: string | null
          contract_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          signed_at?: string | null
          signwell_signer_id?: string | null
          sort_order?: number
          status?: string
          viewed_at?: string | null
        }
        Update: {
          contact_id?: string | null
          contract_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          signed_at?: string | null
          signwell_signer_id?: string | null
          sort_order?: number
          status?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          body: string
          contract_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          merge_fields: Json
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          body?: string
          contract_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          body?: string
          contract_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          merge_fields?: Json
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          body: string
          client_id: string | null
          contact_id: string | null
          contract_number: number
          contract_type: string
          created_at: string
          id: string
          manual_fields: Json
          notes: string | null
          proposal_id: string | null
          quote_id: string | null
          signwell_document_id: string | null
          signwell_expires_at: string | null
          signwell_signed_at: string | null
          signwell_status: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          client_id?: string | null
          contact_id?: string | null
          contract_number?: number
          contract_type?: string
          created_at?: string
          id?: string
          manual_fields?: Json
          notes?: string | null
          proposal_id?: string | null
          quote_id?: string | null
          signwell_document_id?: string | null
          signwell_expires_at?: string | null
          signwell_signed_at?: string | null
          signwell_status?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string | null
          contact_id?: string | null
          contract_number?: number
          contract_type?: string
          created_at?: string
          id?: string
          manual_fields?: Json
          notes?: string | null
          proposal_id?: string | null
          quote_id?: string | null
          signwell_document_id?: string | null
          signwell_expires_at?: string | null
          signwell_signed_at?: string | null
          signwell_status?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "proposal_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      headshots: {
        Row: {
          aspect_ratio: number
          contact_id: string
          created_at: string | null
          featured: boolean | null
          file_size: number
          height: number
          id: string
          source_url: string | null
          storage_path: string
          url: string
          width: number
        }
        Insert: {
          aspect_ratio: number
          contact_id: string
          created_at?: string | null
          featured?: boolean | null
          file_size: number
          height: number
          id?: string
          source_url?: string | null
          storage_path: string
          url: string
          width: number
        }
        Update: {
          aspect_ratio?: number
          contact_id?: string
          created_at?: string | null
          featured?: boolean | null
          file_size?: number
          height?: number
          id?: string
          source_url?: string | null
          storage_path?: string
          url?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "headshots_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_submissions: {
        Row: {
          anything_else: string | null
          audience: string | null
          avoid: string | null
          budget: string | null
          budget_interacted: boolean
          challenge: string | null
          client_id: string | null
          company_name: string | null
          company_url: string | null
          competitors: Json | null
          contact_id: string | null
          created_at: string
          deliverable_notes: string | null
          deliverables: string[]
          email: string
          email_list_size: string | null
          excitement: string | null
          experience: string
          experience_notes: string | null
          file_urls: string[]
          first_name: string
          id: string
          internal_goal: string | null
          key_feature: string | null
          last_name: string
          nickname: string | null
          partner_details: string | null
          partners: string[]
          phases: string[]
          pitch: string
          priority_order: string[]
          project_id: string | null
          project_name: string
          public_goal: string | null
          quote_data: Json | null
          referral: string | null
          stakeholders: string | null
          status: string
          timeline: string
          timeline_date: string | null
          timeline_notes: string | null
          title: string | null
          updated_at: string
          video_links: string | null
          vision: string | null
        }
        Insert: {
          anything_else?: string | null
          audience?: string | null
          avoid?: string | null
          budget?: string | null
          budget_interacted?: boolean
          challenge?: string | null
          client_id?: string | null
          company_name?: string | null
          company_url?: string | null
          competitors?: Json | null
          contact_id?: string | null
          created_at?: string
          deliverable_notes?: string | null
          deliverables?: string[]
          email: string
          email_list_size?: string | null
          excitement?: string | null
          experience: string
          experience_notes?: string | null
          file_urls?: string[]
          first_name?: string
          id?: string
          internal_goal?: string | null
          key_feature?: string | null
          last_name?: string
          nickname?: string | null
          partner_details?: string | null
          partners?: string[]
          phases?: string[]
          pitch: string
          priority_order?: string[]
          project_id?: string | null
          project_name: string
          public_goal?: string | null
          quote_data?: Json | null
          referral?: string | null
          stakeholders?: string | null
          status?: string
          timeline: string
          timeline_date?: string | null
          timeline_notes?: string | null
          title?: string | null
          updated_at?: string
          video_links?: string | null
          vision?: string | null
        }
        Update: {
          anything_else?: string | null
          audience?: string | null
          avoid?: string | null
          budget?: string | null
          budget_interacted?: boolean
          challenge?: string | null
          client_id?: string | null
          company_name?: string | null
          company_url?: string | null
          competitors?: Json | null
          contact_id?: string | null
          created_at?: string
          deliverable_notes?: string | null
          deliverables?: string[]
          email?: string
          email_list_size?: string | null
          excitement?: string | null
          experience?: string
          experience_notes?: string | null
          file_urls?: string[]
          first_name?: string
          id?: string
          internal_goal?: string | null
          key_feature?: string | null
          last_name?: string
          nickname?: string | null
          partner_details?: string | null
          partners?: string[]
          phases?: string[]
          pitch?: string
          priority_order?: string[]
          project_id?: string | null
          project_name?: string
          public_goal?: string | null
          quote_data?: Json | null
          referral?: string | null
          stakeholders?: string | null
          status?: string
          timeline?: string
          timeline_date?: string | null
          timeline_notes?: string | null
          title?: string | null
          updated_at?: string
          video_links?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      location_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_featured: boolean
          location_id: string
          sort_order: number
          source: string
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_featured?: boolean
          location_id: string
          sort_order?: number
          source?: string
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          location_id?: string
          sort_order?: number
          source?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_images_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_projects: {
        Row: {
          created_at: string
          id: string
          location_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_projects_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          appearance_prompt: string | null
          city: string | null
          created_at: string
          description: string | null
          featured_image: string | null
          google_maps_url: string | null
          id: string
          name: string
          notes: string | null
          peerspace_data: Json | null
          peerspace_id: string | null
          peerspace_url: string | null
          state: string | null
          status: string
          tags: string[] | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          appearance_prompt?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          featured_image?: string | null
          google_maps_url?: string | null
          id?: string
          name: string
          notes?: string | null
          peerspace_data?: Json | null
          peerspace_id?: string | null
          peerspace_url?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          appearance_prompt?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          featured_image?: string | null
          google_maps_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          peerspace_data?: Json | null
          peerspace_id?: string | null
          peerspace_url?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      meeting_attendees: {
        Row: {
          display_name: string | null
          email: string
          id: string
          is_organizer: boolean | null
          meeting_id: string | null
          response_status: string | null
        }
        Insert: {
          display_name?: string | null
          email: string
          id?: string
          is_organizer?: boolean | null
          meeting_id?: string | null
          response_status?: string | null
        }
        Update: {
          display_name?: string | null
          email?: string
          id?: string
          is_organizer?: boolean | null
          meeting_id?: string | null
          response_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_relationships: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          match_type: string
          matched_email: string | null
          meeting_id: string | null
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string
          matched_email?: string | null
          meeting_id?: string | null
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string
          matched_email?: string | null
          meeting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_relationships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_relationships_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          action_items: Json | null
          created_at: string | null
          duration_seconds: number | null
          formatted_text: string | null
          id: string
          insights_generated_at: string | null
          insights_status: string
          meeting_id: string | null
          raw_transcript: Json
          speaker_count: number | null
          summary: string | null
          word_count: number | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          formatted_text?: string | null
          id?: string
          insights_generated_at?: string | null
          insights_status?: string
          meeting_id?: string | null
          raw_transcript: Json
          speaker_count?: number | null
          summary?: string | null
          word_count?: number | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          formatted_text?: string | null
          id?: string
          insights_generated_at?: string | null
          insights_status?: string
          meeting_id?: string | null
          raw_transcript?: Json
          speaker_count?: number | null
          summary?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          ical_uid: string
          id: string
          location: string | null
          meeting_url: string | null
          organizer_email: string | null
          raw_event: Json | null
          recall_bot_id: string | null
          recall_bot_status: string | null
          start_time: string
          status: string
          title: string
          transcript_status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          ical_uid: string
          id?: string
          location?: string | null
          meeting_url?: string | null
          organizer_email?: string | null
          raw_event?: Json | null
          recall_bot_id?: string | null
          recall_bot_status?: string | null
          start_time: string
          status?: string
          title?: string
          transcript_status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          ical_uid?: string
          id?: string
          location?: string | null
          meeting_url?: string | null
          organizer_email?: string | null
          raw_event?: Json | null
          recall_bot_id?: string | null
          recall_bot_status?: string | null
          start_time?: string
          status?: string
          title?: string
          transcript_status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings_config: {
        Row: {
          created_at: string | null
          ical_url: string
          id: string
          last_synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ical_url: string
          id?: string
          last_synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ical_url?: string
          id?: string
          last_synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          source: string
          timeline: string
          timeline_date: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          source?: string
          timeline: string
          timeline_date?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          source?: string
          timeline?: string
          timeline_date?: string | null
        }
        Relationships: []
      }
      product_references: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_references_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "script_products"
            referencedColumns: ["id"]
          },
        ]
      }
      project_bts_images: {
        Row: {
          caption: string | null
          id: string
          image_url: string
          project_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          id?: string
          image_url: string
          project_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          id?: string
          image_url?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_bts_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_credits: {
        Row: {
          contact_id: string | null
          id: string
          name: string
          project_id: string
          role: string
          role_id: string | null
          sort_order: number
        }
        Insert: {
          contact_id?: string | null
          id?: string
          name: string
          project_id: string
          role: string
          role_id?: string | null
          sort_order?: number
        }
        Update: {
          contact_id?: string | null
          id?: string
          name?: string
          project_id?: string
          role?: string
          role_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_credits_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_credits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_credits_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_videos: {
        Row: {
          aspect_ratio: string
          bunny_video_id: string
          id: string
          password_protected: boolean
          project_id: string
          sort_order: number
          title: string
          video_type: string
          viewer_password: string | null
        }
        Insert: {
          aspect_ratio?: string
          bunny_video_id: string
          id?: string
          password_protected?: boolean
          project_id: string
          sort_order?: number
          title: string
          video_type: string
          viewer_password?: string | null
        }
        Update: {
          aspect_ratio?: string
          bunny_video_id?: string
          id?: string
          password_protected?: boolean
          project_id?: string
          sort_order?: number
          title?: string
          video_type?: string
          viewer_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assets_delivered: string[] | null
          camera_techniques: string[] | null
          category: string | null
          client_id: string | null
          client_name: string
          client_quote: string | null
          created_at: string
          crew_count: number | null
          description: string
          featured: boolean
          featured_services_build: boolean | null
          featured_services_crowdfunding: boolean | null
          featured_services_fundraising: boolean | null
          featured_services_launch: boolean | null
          featured_services_scale: boolean | null
          full_width: boolean
          hidden_from_work: boolean
          home_order: number
          id: string
          is_campaign: boolean
          location_count: number | null
          meta_description: string | null
          meta_title: string | null
          placeholder: boolean
          premium_addons: string[] | null
          preview_gif_url: string | null
          production_days: number | null
          published: boolean
          slug: string
          style_tags: string[] | null
          subtitle: string
          talent_count: number | null
          thumbnail_time: number | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          updated_by: string | null
          work_order: number
        }
        Insert: {
          assets_delivered?: string[] | null
          camera_techniques?: string[] | null
          category?: string | null
          client_id?: string | null
          client_name: string
          client_quote?: string | null
          created_at?: string
          crew_count?: number | null
          description: string
          featured?: boolean
          featured_services_build?: boolean | null
          featured_services_crowdfunding?: boolean | null
          featured_services_fundraising?: boolean | null
          featured_services_launch?: boolean | null
          featured_services_scale?: boolean | null
          full_width?: boolean
          hidden_from_work?: boolean
          home_order?: number
          id?: string
          is_campaign?: boolean
          location_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          placeholder?: boolean
          premium_addons?: string[] | null
          preview_gif_url?: string | null
          production_days?: number | null
          published?: boolean
          slug: string
          style_tags?: string[] | null
          subtitle: string
          talent_count?: number | null
          thumbnail_time?: number | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
          updated_by?: string | null
          work_order?: number
        }
        Update: {
          assets_delivered?: string[] | null
          camera_techniques?: string[] | null
          category?: string | null
          client_id?: string | null
          client_name?: string
          client_quote?: string | null
          created_at?: string
          crew_count?: number | null
          description?: string
          featured?: boolean
          featured_services_build?: boolean | null
          featured_services_crowdfunding?: boolean | null
          featured_services_fundraising?: boolean | null
          featured_services_launch?: boolean | null
          featured_services_scale?: boolean | null
          full_width?: boolean
          hidden_from_work?: boolean
          home_order?: number
          id?: string
          is_campaign?: boolean
          location_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          placeholder?: boolean
          premium_addons?: string[] | null
          preview_gif_url?: string | null
          production_days?: number | null
          published?: boolean
          slug?: string
          style_tags?: string[] | null
          subtitle?: string
          talent_count?: number | null
          thumbnail_time?: number | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          work_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          proposal_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          proposal_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_contacts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_milestones: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          label: string
          phase: string | null
          proposal_id: string
          sort_order: number
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          label: string
          phase?: string | null
          proposal_id: string
          sort_order?: number
          start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          label?: string
          phase?: string | null
          proposal_id?: string
          sort_order?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_milestones_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_projects: {
        Row: {
          blurb: string | null
          id: string
          project_id: string
          proposal_id: string
          section_id: string | null
          sort_order: number
        }
        Insert: {
          blurb?: string | null
          id?: string
          project_id: string
          proposal_id: string
          section_id?: string | null
          sort_order?: number
        }
        Update: {
          blurb?: string | null
          id?: string
          project_id?: string
          proposal_id?: string
          section_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_projects_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_projects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "proposal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_quote_desc_audit: {
        Row: {
          changed_at: string | null
          id: number
          new_desc: string | null
          old_desc: string | null
          quote_id: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: number
          new_desc?: string | null
          old_desc?: string | null
          quote_id?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: number
          new_desc?: string | null
          old_desc?: string | null
          quote_id?: string | null
        }
        Relationships: []
      }
      proposal_quotes: {
        Row: {
          additional_discount: number
          created_at: string
          crowdfunding_enabled: boolean
          crowdfunding_tier: number
          defer_payment: boolean
          deleted_at: string | null
          description: string | null
          down_amount: number | null
          friendly_discount_pct: number
          fundraising_enabled: boolean
          fundraising_tier: number
          id: string
          is_fna_quote: boolean
          is_locked: boolean
          label: string
          location_days: Json
          photo_count: number
          proposal_id: string
          quote_type: string
          selected_addons: Json
          slider_values: Json
          sort_order: number
          tier_selections: Json
          total_amount: number | null
          updated_at: string
          viewer_email: string | null
          visible: boolean
        }
        Insert: {
          additional_discount?: number
          created_at?: string
          crowdfunding_enabled?: boolean
          crowdfunding_tier?: number
          defer_payment?: boolean
          deleted_at?: string | null
          description?: string | null
          down_amount?: number | null
          friendly_discount_pct?: number
          fundraising_enabled?: boolean
          fundraising_tier?: number
          id?: string
          is_fna_quote?: boolean
          is_locked?: boolean
          label?: string
          location_days?: Json
          photo_count?: number
          proposal_id: string
          quote_type?: string
          selected_addons?: Json
          slider_values?: Json
          sort_order?: number
          tier_selections?: Json
          total_amount?: number | null
          updated_at?: string
          viewer_email?: string | null
          visible?: boolean
        }
        Update: {
          additional_discount?: number
          created_at?: string
          crowdfunding_enabled?: boolean
          crowdfunding_tier?: number
          defer_payment?: boolean
          deleted_at?: string | null
          description?: string | null
          down_amount?: number | null
          friendly_discount_pct?: number
          fundraising_enabled?: boolean
          fundraising_tier?: number
          id?: string
          is_fna_quote?: boolean
          is_locked?: boolean
          label?: string
          location_days?: Json
          photo_count?: number
          proposal_id?: string
          quote_type?: string
          selected_addons?: Json
          slider_values?: Json
          sort_order?: number
          tier_selections?: Json
          total_amount?: number | null
          updated_at?: string
          viewer_email?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "proposal_quotes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          created_at: string
          custom_content: string | null
          custom_title: string | null
          id: string
          layout_columns: number
          layout_position: string
          proposal_id: string
          section_type: string
          snippet_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          custom_content?: string | null
          custom_title?: string | null
          id?: string
          layout_columns?: number
          layout_position?: string
          proposal_id: string
          section_type: string
          snippet_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          custom_content?: string | null
          custom_title?: string | null
          id?: string
          layout_columns?: number
          layout_position?: string
          proposal_id?: string
          section_type?: string
          snippet_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_sections_snippet_id_fkey"
            columns: ["snippet_id"]
            isOneToOne: false
            referencedRelation: "content_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_videos: {
        Row: {
          id: string
          project_video_id: string
          proposal_blurb: string | null
          proposal_id: string
          section_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          project_video_id: string
          proposal_blurb?: string | null
          proposal_id: string
          section_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          project_video_id?: string
          proposal_blurb?: string | null
          proposal_id?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_videos_project_video_id_fkey"
            columns: ["project_video_id"]
            isOneToOne: false
            referencedRelation: "project_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_videos_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_videos_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "proposal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_views: {
        Row: {
          duration_seconds: number | null
          id: string
          ip_address: string | null
          proposal_id: string
          user_agent: string | null
          viewed_at: string
          viewer_email: string | null
          viewer_name: string | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          proposal_id: string
          user_agent?: string | null
          viewed_at?: string
          viewer_email?: string | null
          viewer_name?: string | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          proposal_id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_email?: string | null
          viewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_additional_discount: number
          contact_company: string
          contact_email: string | null
          contact_name: string
          created_at: string
          created_by: string | null
          crowdfunding_approved: boolean | null
          crowdfunding_deferred: boolean
          force_additional_discount: boolean
          force_priority_scheduling: boolean
          hide_deferred_payment: boolean
          id: string
          prepared_date: string | null
          pricing_notes: string | null
          proposal_number: number
          proposal_password: string
          proposal_type: string
          schedule_end_date: string | null
          schedule_start_date: string | null
          show_approach: boolean
          show_pricing: boolean
          show_pricing_notes: boolean
          show_process: boolean
          show_samples: boolean
          show_timeline: boolean
          show_welcome: boolean
          slug: string
          status: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          client_additional_discount?: number
          contact_company?: string
          contact_email?: string | null
          contact_name: string
          created_at?: string
          created_by?: string | null
          crowdfunding_approved?: boolean | null
          crowdfunding_deferred?: boolean
          force_additional_discount?: boolean
          force_priority_scheduling?: boolean
          hide_deferred_payment?: boolean
          id?: string
          prepared_date?: string | null
          pricing_notes?: string | null
          proposal_number?: number
          proposal_password: string
          proposal_type?: string
          schedule_end_date?: string | null
          schedule_start_date?: string | null
          show_approach?: boolean
          show_pricing?: boolean
          show_pricing_notes?: boolean
          show_process?: boolean
          show_samples?: boolean
          show_timeline?: boolean
          show_welcome?: boolean
          slug: string
          status?: string
          subtitle?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_additional_discount?: number
          contact_company?: string
          contact_email?: string | null
          contact_name?: string
          created_at?: string
          created_by?: string | null
          crowdfunding_approved?: boolean | null
          crowdfunding_deferred?: boolean
          force_additional_discount?: boolean
          force_priority_scheduling?: boolean
          hide_deferred_payment?: boolean
          id?: string
          prepared_date?: string | null
          pricing_notes?: string | null
          proposal_number?: number
          proposal_password?: string
          proposal_type?: string
          schedule_end_date?: string | null
          schedule_start_date?: string | null
          show_approach?: boolean
          show_pricing?: boolean
          show_pricing_notes?: boolean
          show_process?: boolean
          show_samples?: boolean
          show_timeline?: boolean
          show_welcome?: boolean
          slug?: string
          status?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_leads: {
        Row: {
          build_base: number
          build_items: Json
          contact_company: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          crowdfunding_discount: number
          crowdfunding_percent: number
          defer_payment: boolean
          deferred_fee: number
          down_amount: number
          down_percent: number
          friendly_discount: number
          friendly_discount_percent: number
          fundraising_base: number
          fundraising_items: Json
          generated_by: string
          id: string
          launch_base: number
          launch_items: Json
          overhead: number
          overhead_waived: boolean
          quote_date: string
          special_program: string | null
          tier: string
          total: number
        }
        Insert: {
          build_base?: number
          build_items?: Json
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          crowdfunding_discount?: number
          crowdfunding_percent?: number
          defer_payment?: boolean
          deferred_fee?: number
          down_amount: number
          down_percent: number
          friendly_discount?: number
          friendly_discount_percent?: number
          fundraising_base?: number
          fundraising_items?: Json
          generated_by?: string
          id?: string
          launch_base?: number
          launch_items?: Json
          overhead?: number
          overhead_waived?: boolean
          quote_date: string
          special_program?: string | null
          tier: string
          total: number
        }
        Update: {
          build_base?: number
          build_items?: Json
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          crowdfunding_discount?: number
          crowdfunding_percent?: number
          defer_payment?: boolean
          deferred_fee?: number
          down_amount?: number
          down_percent?: number
          friendly_discount?: number
          friendly_discount_percent?: number
          fundraising_base?: number
          fundraising_items?: Json
          generated_by?: string
          id?: string
          launch_base?: number
          launch_items?: Json
          overhead?: number
          overhead_waived?: boolean
          quote_date?: string
          special_program?: string | null
          tier?: string
          total?: number
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      script_beat_references: {
        Row: {
          beat_id: string
          created_at: string | null
          id: string
          image_url: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          beat_id: string
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          beat_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_beat_references_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "script_beats"
            referencedColumns: ["id"]
          },
        ]
      }
      script_beats: {
        Row: {
          audio_content: string
          created_at: string | null
          id: string
          notes_content: string
          scene_id: string
          sort_order: number
          updated_at: string | null
          visual_content: string
        }
        Insert: {
          audio_content?: string
          created_at?: string | null
          id?: string
          notes_content?: string
          scene_id: string
          sort_order?: number
          updated_at?: string | null
          visual_content?: string
        }
        Update: {
          audio_content?: string
          created_at?: string | null
          id?: string
          notes_content?: string
          scene_id?: string
          sort_order?: number
          updated_at?: string | null
          visual_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_beats_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "script_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      script_character_cast: {
        Row: {
          appearance_prompt: string | null
          character_id: string
          contact_id: string
          created_at: string | null
          id: string
          is_featured: boolean
          slot_order: number
        }
        Insert: {
          appearance_prompt?: string | null
          character_id: string
          contact_id: string
          created_at?: string | null
          id?: string
          is_featured?: boolean
          slot_order?: number
        }
        Update: {
          appearance_prompt?: string | null
          character_id?: string
          contact_id?: string
          created_at?: string | null
          id?: string
          is_featured?: boolean
          slot_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "script_character_cast_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "script_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_character_cast_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_character_references: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          image_url: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_character_references_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "script_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      script_characters: {
        Row: {
          appearance_prompt: string | null
          cast_mode: string
          character_type: string
          color: string
          created_at: string | null
          description: string | null
          id: string
          max_cast_slots: number
          name: string
          script_id: string
          sort_order: number
        }
        Insert: {
          appearance_prompt?: string | null
          cast_mode?: string
          character_type?: string
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          max_cast_slots?: number
          name: string
          script_id: string
          sort_order?: number
        }
        Update: {
          appearance_prompt?: string | null
          cast_mode?: string
          character_type?: string
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          max_cast_slots?: number
          name?: string
          script_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "script_characters_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_location_options: {
        Row: {
          appearance_prompt: string | null
          created_at: string | null
          id: string
          is_featured: boolean
          location_id: string
          script_location_id: string
          slot_order: number
        }
        Insert: {
          appearance_prompt?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean
          location_id: string
          script_location_id: string
          slot_order?: number
        }
        Update: {
          appearance_prompt?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean
          location_id?: string
          script_location_id?: string
          slot_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "script_location_options_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_location_options_script_location_id_fkey"
            columns: ["script_location_id"]
            isOneToOne: false
            referencedRelation: "script_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      script_location_references: {
        Row: {
          created_at: string
          id: string
          image_url: string
          location_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          location_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          location_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_location_references_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "script_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      script_locations: {
        Row: {
          appearance_prompt: string | null
          color: string
          created_at: string | null
          description: string | null
          global_location_id: string | null
          id: string
          location_mode: string
          name: string
          script_id: string
          sort_order: number
        }
        Insert: {
          appearance_prompt?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          global_location_id?: string | null
          id?: string
          location_mode?: string
          name: string
          script_id: string
          sort_order?: number
        }
        Update: {
          appearance_prompt?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          global_location_id?: string | null
          id?: string
          location_mode?: string
          name?: string
          script_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "script_locations_global_location_id_fkey"
            columns: ["global_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_locations_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_products: {
        Row: {
          appearance_prompt: string | null
          color: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          script_id: string
          sort_order: number
        }
        Insert: {
          appearance_prompt?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          script_id: string
          sort_order?: number
        }
        Update: {
          appearance_prompt?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          script_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "script_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_products_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_scenes: {
        Row: {
          created_at: string | null
          id: string
          int_ext: string
          location_id: string | null
          location_name: string
          scene_notes: string | null
          script_id: string
          sort_order: number
          time_of_day: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          int_ext?: string
          location_id?: string | null
          location_name?: string
          scene_notes?: string | null
          script_id: string
          sort_order?: number
          time_of_day?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          int_ext?: string
          location_id?: string | null
          location_name?: string
          scene_notes?: string | null
          script_id?: string
          sort_order?: number
          time_of_day?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_scenes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "script_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_scenes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_share_views: {
        Row: {
          duration_seconds: number | null
          id: string
          share_id: string
          viewed_at: string | null
          viewer_email: string | null
          viewer_name: string | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          share_id: string
          viewed_at?: string | null
          viewer_email?: string | null
          viewer_name?: string | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          share_id?: string
          viewed_at?: string | null
          viewer_email?: string | null
          viewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_share_views_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "script_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      script_shares: {
        Row: {
          access_code: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          label: string
          notes: string | null
          script_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          access_code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          notes?: string | null
          script_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          access_code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          notes?: string | null
          script_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_shares_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_storyboard_frames: {
        Row: {
          beat_id: string | null
          created_at: string | null
          id: string
          image_url: string
          prompt_used: string | null
          scene_id: string | null
          script_id: string
          source: string
          storage_path: string
        }
        Insert: {
          beat_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          prompt_used?: string | null
          scene_id?: string | null
          script_id: string
          source?: string
          storage_path: string
        }
        Update: {
          beat_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          prompt_used?: string | null
          scene_id?: string | null
          script_id?: string
          source?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_storyboard_frames_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "script_beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_storyboard_frames_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "script_scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_storyboard_frames_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_style_references: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          sort_order: number
          storage_path: string
          style_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number
          storage_path: string
          style_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          storage_path?: string
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_style_references_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "script_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      script_styles: {
        Row: {
          aspect_ratio: string
          created_at: string | null
          generation_mode: string
          id: string
          prompt: string
          script_id: string
          style_preset: string | null
          updated_at: string | null
        }
        Insert: {
          aspect_ratio?: string
          created_at?: string | null
          generation_mode?: string
          id?: string
          prompt?: string
          script_id: string
          style_preset?: string | null
          updated_at?: string | null
        }
        Update: {
          aspect_ratio?: string
          created_at?: string | null
          generation_mode?: string
          id?: string
          prompt?: string
          script_id?: string
          style_preset?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_styles_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: true
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_tags: {
        Row: {
          category: string
          color: string
          created_at: string | null
          id: string
          name: string
          script_id: string
          slug: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string | null
          id?: string
          name: string
          script_id: string
          slug: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          script_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_tags_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          content_mode: string
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean
          major_version: number
          minor_version: number
          notes: string | null
          project_id: string | null
          scratch_content: string | null
          script_group_id: string | null
          status: string
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          content_mode?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean
          major_version?: number
          minor_version?: number
          notes?: string | null
          project_id?: string | null
          scratch_content?: string | null
          script_group_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          content_mode?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean
          major_version?: number
          minor_version?: number
          notes?: string | null
          project_id?: string | null
          scratch_content?: string | null
          script_group_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          detail_description_template: string | null
          detail_title_template: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          no_index: boolean
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          page_slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          canonical_url?: string | null
          detail_description_template?: string | null
          detail_title_template?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          no_index?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          page_slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          canonical_url?: string | null
          detail_description_template?: string | null
          detail_title_template?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          no_index?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          page_slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string
          color: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          color?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          color?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_id: string | null
          company: string | null
          contact_id: string | null
          created_at: string
          display_order: number
          display_title: string | null
          id: string
          person_name: string | null
          person_title: string | null
          profile_picture_url: string | null
          project_id: string | null
          quote: string
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string
          display_order?: number
          display_title?: string | null
          id?: string
          person_name?: string | null
          person_title?: string | null
          profile_picture_url?: string | null
          project_id?: string | null
          quote: string
        }
        Update: {
          client_id?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string
          display_order?: number
          display_title?: string | null
          id?: string
          person_name?: string | null
          person_title?: string | null
          profile_picture_url?: string | null
          project_id?: string | null
          quote?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      website_layout_snapshots: {
        Row: {
          created_at: string
          created_by: string
          id: string
          label: string | null
          placements: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          label?: string | null
          placements?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          label?: string | null
          placements?: Json
        }
        Relationships: []
      }
      website_project_placements: {
        Row: {
          created_at: string | null
          full_width: boolean
          id: string
          page: string
          project_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          full_width?: boolean
          id?: string
          page: string
          project_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          full_width?: boolean
          id?: string
          page?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "website_project_placements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
