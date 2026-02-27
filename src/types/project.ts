/**
 * Project types for portfolio items
 */

export interface FeaturedProject {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  client_name: string;
  client_quote?: string;
  type: 'video' | 'design';
  thumbnail_url?: string;
  featured: boolean;
  published: boolean;
  category?: string;
  style_tags?: string[];
  premium_addons?: string[];
  camera_techniques?: string[];
  production_days?: number;
  crew_count?: number;
  talent_count?: number;
  location_count?: number;
  full_width?: boolean;
  hidden_from_work?: boolean;
  home_order?: number;
  work_order?: number;
  assets_delivered?: string[];
  flagship_video_id?: string;
  thumbnail_time?: number;
  created_at: string;
  updated_at: string;
  fullWidth?: boolean;
}

export interface ProjectVideo {
  id: string;
  project_id: string;
  bunny_video_id: string;
  title: string;
  video_type: 'flagship' | 'cutdown' | 'bts' | 'pitch';
  sort_order: number;
  password_protected: boolean;
  viewer_password: string | null;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
}

export interface ProjectCredit {
  id: string;
  project_id: string;
  role: string;
  name: string;
  sort_order: number;
  role_id: string | null;
  contact_id: string | null;
}

export interface RoleRow {
  id: string;
  name: string;
  created_at: string;
}

export interface ProjectTag {
  id: string;
  name: string;
  category: 'style' | 'technique' | 'addon';
  color?: string;
}

export interface ProjectBTSImage {
  id: string;
  project_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}
