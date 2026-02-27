/**
 * Auto-generated type definitions from Supabase schema
 * Generated: 2026-02-16
 */

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          subtitle: string;
          slug: string;
          description: string;
          client_quote: string | null;
          client_name: string;
          type: 'video' | 'design';
          style_tags: string[] | null;
          premium_addons: string[] | null;
          camera_techniques: string[] | null;
          production_days: number | null;
          crew_count: number | null;
          talent_count: number | null;
          location_count: number | null;
          thumbnail_url: string | null;
          preview_gif_url: string | null;
          assets_delivered: string[] | null;
          category: string | null;
          featured: boolean;
          published: boolean;
          placeholder: boolean;
          full_width: boolean;
          client_id: string | null;
          is_campaign: boolean;
          featured_services_build: boolean;
          featured_services_launch: boolean;
          featured_services_scale: boolean;
          featured_services_crowdfunding: boolean;
          featured_services_fundraising: boolean;
          hidden_from_work: boolean;
          home_order: number;
          work_order: number;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          company: string | null;
          email: string;
          notes: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
      };
      project_videos: {
        Row: {
          id: string;
          project_id: string;
          bunny_video_id: string;
          title: string;
          video_type: 'flagship' | 'cutdown' | 'bts' | 'pitch';
          sort_order: number;
          password_protected: boolean;
          viewer_password: string | null;
          aspect_ratio: string;
        };
        Insert: Omit<Database['public']['Tables']['project_videos']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['project_videos']['Row']>;
      };
      project_credits: {
        Row: {
          id: string;
          project_id: string;
          role: string;
          name: string;
          sort_order: number;
          role_id: string | null;
          contact_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['project_credits']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['project_credits']['Row']>;
      };
      roles: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['roles']['Row']>;
      };
      contact_roles: {
        Row: {
          contact_id: string;
          role_id: string;
        };
        Insert: Database['public']['Tables']['contact_roles']['Row'];
        Update: Partial<Database['public']['Tables']['contact_roles']['Row']>;
      };
      headshots: {
        Row: {
          id: string;
          contact_id: string;
          storage_path: string;
          url: string;
          featured: boolean;
          width: number;
          height: number;
          aspect_ratio: number;
          file_size: number;
          source_url: string | null;
          created_at: string;
        };
        Insert: {
          contact_id: string;
          storage_path: string;
          url: string;
          featured?: boolean;
          width: number;
          height: number;
          aspect_ratio: number;
          file_size: number;
          source_url?: string | null;
        };
        Update: {
          contact_id?: string;
          storage_path?: string;
          url?: string;
          featured?: boolean;
          width?: number;
          height?: number;
          aspect_ratio?: number;
          file_size?: number;
          source_url?: string | null;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          category: 'style' | 'technique' | 'addon' | 'deliverable' | 'project_type';
          color: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['tags']['Row']>;
      };
      testimonials: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string | null;
          quote: string;
          person_name: string | null;
          person_title: string | null;
          display_title: string | null;
          company: string | null;
          profile_picture_url: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['testimonials']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['testimonials']['Row']>;
      };
      project_bts_images: {
        Row: {
          id: string;
          project_id: string;
          image_url: string;
          caption: string | null;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['project_bts_images']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['project_bts_images']['Row']>;
      };
      seo_settings: {
        Row: {
          id: string;
          page_slug: string;
          meta_title: string | null;
          meta_description: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image_url: string | null;
          canonical_url: string | null;
          no_index: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['seo_settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['seo_settings']['Row']>;
      };
      content_snippets: {
        Row: {
          id: string;
          title: string;
          body: string;
          snippet_type: string;
          category: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['content_snippets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['content_snippets']['Row']>;
      };
      proposals: {
        Row: {
          id: string;
          title: string;
          slug: string;
          contact_name: string;
          contact_email: string | null;
          contact_company: string;
          proposal_password: string;
          proposal_type: string;
          subtitle: string;
          status: string;
          proposal_number: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'proposal_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['proposals']['Row']>;
      };
      proposal_sections: {
        Row: {
          id: string;
          proposal_id: string;
          section_type: string;
          snippet_id: string | null;
          custom_content: string | null;
          custom_title: string | null;
          layout_columns: number;
          layout_position: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposal_sections']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['proposal_sections']['Row']>;
      };
      proposal_videos: {
        Row: {
          id: string;
          proposal_id: string;
          section_id: string;
          project_video_id: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['proposal_videos']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['proposal_videos']['Row']>;
      };
      proposal_projects: {
        Row: {
          id: string;
          proposal_id: string;
          section_id: string | null;
          project_id: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['proposal_projects']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['proposal_projects']['Row']>;
      };
      proposal_quotes: {
        Row: {
          id: string;
          proposal_id: string;
          label: string;
          is_locked: boolean;
          is_fna_quote: boolean;
          quote_type: string;
          selected_addons: Record<string, number>;
          slider_values: Record<string, number>;
          tier_selections: Record<string, string>;
          location_days: Record<string, number[]>;
          photo_count: number;
          crowdfunding_enabled: boolean;
          crowdfunding_tier: number;
          fundraising_enabled: boolean;
          defer_payment: boolean;
          friendly_discount_pct: number;
          total_amount: number | null;
          down_amount: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposal_quotes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['proposal_quotes']['Row']>;
      };
      proposal_views: {
        Row: {
          id: string;
          proposal_id: string;
          viewer_email: string | null;
          ip_address: string | null;
          user_agent: string | null;
          viewed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposal_views']['Row'], 'id' | 'viewed_at'>;
        Update: Partial<Database['public']['Tables']['proposal_views']['Row']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
