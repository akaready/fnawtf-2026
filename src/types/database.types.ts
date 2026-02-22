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
          video_type: 'flagship' | 'cutdown' | 'broadcast' | 'bts';
          sort_order: number;
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
        };
        Insert: Omit<Database['public']['Tables']['project_credits']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['project_credits']['Row']>;
      };
      tags: {
        Row: {
          id: string;
          name: string;
          category: 'style' | 'technique' | 'addon';
          color: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['tags']['Row']>;
      };
      testimonials: {
        Row: {
          id: string;
          project_id: string | null;
          quote: string;
          person_name: string | null;
          person_title: string | null;
          display_title: string | null;
          company: string | null;
          profile_picture_url: string | null;
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
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
