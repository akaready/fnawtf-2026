export type PlacementPage =
  | 'homepage'
  | 'work'
  | 'services_build'
  | 'services_launch'
  | 'services_scale'
  | 'services_crowdfunding'
  | 'services_fundraising';

export interface PlacementRow {
  id: string;
  project_id: string;
  page: PlacementPage;
  sort_order: number;
  full_width: boolean;
  created_at: string;
}

export interface PlacementWithProject extends PlacementRow {
  project: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    client_name: string;
    published: boolean;
  };
}
