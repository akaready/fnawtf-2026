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
  style_tags?: string[];
  premium_addons?: string[];
  camera_techniques?: string[];
  production_days?: number;
  crew_count?: number;
  talent_count?: number;
  location_count?: number;
  created_at: string;
  updated_at: string;
  fullWidth?: boolean;
  category?: string;
}

export interface ProjectVideo {
  id: string;
  project_id: string;
  bunny_video_id: string;
  title: string;
  video_type: 'flagship' | 'cutdown' | 'broadcast' | 'bts';
  sort_order: number;
}

export interface ProjectCredit {
  id: string;
  project_id: string;
  role: string;
  name: string;
  sort_order: number;
}

export interface ProjectTag {
  id: string;
  name: string;
  category: 'style' | 'technique' | 'addon';
  color?: string;
}
