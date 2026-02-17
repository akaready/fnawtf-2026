/**
 * Filter and sort type definitions for the work page
 */

export interface ProjectFilters {
  styleTags: string[];
  premiumAddons: string[];
  cameraTechniques: string[];
  categories: string[];
  productionDaysRange: [number, number] | null;
  crewCountRange: [number, number] | null;
  talentCountRange: [number, number] | null;
  locationCountRange: [number, number] | null;
}

export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export interface WorkPageSearchParams {
  tags?: string;
  addons?: string;
  techniques?: string;
  categories?: string;
  sort?: SortOption;
}
