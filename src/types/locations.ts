export type LocationStatus = 'active' | 'archived';
export type LocationImageSource = 'uploaded' | 'peerspace';

export interface LocationRow {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  google_maps_url: string | null;
  featured_image: string | null;
  status: LocationStatus;
  peerspace_url: string | null;
  peerspace_id: string | null;
  peerspace_data: PeerspaceData;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationImageRow {
  id: string;
  location_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text: string | null;
  source: LocationImageSource;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface LocationProjectRow {
  id: string;
  location_id: string;
  project_id: string;
  created_at: string;
}

export interface PeerspaceReview {
  reviewer_name: string;
  reviewer_role?: string;
  booking_type?: string;
  guest_count?: number;
  would_book_again: boolean;
  text: string;
  date: string;
}

export interface PeerspaceData {
  title?: string;
  description?: string;
  space_type?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  amenities?: string[];
  pricing?: { amount: number; unit: string; minimum?: string };
  capacity?: number;
  sqft?: number;
  min_hours?: number;
  rating?: { score: number; count: number };
  hours?: Record<string, string>;
  host?: { name: string; avatar?: string; response_time?: string; profile_url?: string };
  parking?: string;
  lighting?: string;
  sound?: string;
  space_access?: string;
  electrical?: string;
  host_rules?: string;
  cancellation_policy?: string;
  cancellation_tier?: string;
  health_safety?: string;
  cleaning_protocol?: string;
  reviews?: PeerspaceReview[];
  image_descriptions?: string[];
  coordinates?: { lat: number; lng: number };
  scraped_at?: string;
}

export interface LocationWithImages extends LocationRow {
  location_images: LocationImageRow[];
}

export interface LocationWithProjects extends LocationRow {
  projects: { id: string; title: string }[];
}
