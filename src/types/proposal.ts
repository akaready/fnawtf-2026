// ── Proposal System Types ─────────────────────────────────────────────────

export type SnippetType = 'build' | 'launch' | 'scale' | 'build-launch' | 'fundraising' | 'general';
export type SnippetCategory = string;
export type ProposalType = 'build' | 'launch' | 'scale' | 'build-launch' | 'fundraising';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted';
export type SectionType = 'text' | 'video' | 'projects' | 'quote' | 'calendar' | 'custom_text';

export interface ContactRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  client_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSnippetRow {
  id: string;
  title: string;
  body: string;
  snippet_type: SnippetType;
  category: SnippetCategory;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalRow {
  id: string;
  title: string;
  slug: string;
  contact_name: string;
  contact_email: string | null;
  contact_company: string;
  proposal_password: string;
  proposal_type: ProposalType;
  subtitle: string;
  status: ProposalStatus;
  proposal_number: number;
  schedule_start_date: string | null;
  schedule_end_date: string | null;
  crowdfunding_approved: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalSectionRow {
  id: string;
  proposal_id: string;
  section_type: SectionType;
  snippet_id: string | null;
  custom_content: string | null;
  custom_title: string | null;
  layout_columns: number;
  layout_position: string;
  sort_order: number;
  created_at: string;
}

export interface ProposalVideoRow {
  id: string;
  proposal_id: string;
  section_id: string;
  project_video_id: string;
  sort_order: number;
  proposal_blurb: string | null;
}

export type ProposalVideo = {
  id: string;
  proposal_id: string;
  sort_order: number;
  section_id?: string;
  proposal_blurb: string | null;
  project_video: {
    id: string;
    bunny_video_id: string;
    title: string;
    video_type: string;
    aspect_ratio: string;
    project: {
      id: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      category: string | null;
      client_name: string | null;
      style_tags: string[] | null;
      assets_delivered: string[] | null;
      premium_addons: string[] | null;
      camera_techniques: string[] | null;
      production_days: number | null;
      crew_count: number | null;
      talent_count: number | null;
      location_count: number | null;
      credits: Array<{ id: string; project_id: string; role: string; name: string; sort_order: number }> | null;
      bts_images: Array<{ id: string; project_id: string; image_url: string; caption: string | null; sort_order: number }> | null;
      testimonials: Array<{ quote: string; person_name: string | null; person_title: string | null; display_title: string | null }> | null;
    } | null;
  } | null;
};

export interface ProposalProjectRow {
  id: string;
  proposal_id: string;
  section_id: string | null;
  project_id: string;
  sort_order: number;
  blurb: string | null;
}

export interface BrowserProject {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  style_tags: string[] | null;
  premium_addons: string[] | null;
  camera_techniques: string[] | null;
}

export interface ProposalProjectWithProject {
  id: string;
  proposal_id: string;
  project_id: string;
  section_id: string | null;
  sort_order: number;
  blurb: string | null;
  project: BrowserProject;
}

export interface ProposalQuoteRow {
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
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProposalMilestoneRow {
  id: string;
  proposal_id: string;
  label: string;
  description: string | null;
  start_date: string;
  end_date: string;
  sort_order: number;
  phase: string | null;
  created_at: string;
}

export interface ProposalViewRow {
  id: string;
  proposal_id: string;
  viewer_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
}
