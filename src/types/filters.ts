/**
 * Filter and sort type definitions for the work page
 */

export interface ProjectFilters {
  styleTags: string[];
  premiumAddons: string[];
  cameraTechniques: string[];
  categories: string[];
  deliverables: string[];
  productionDays: string[];
  crewSizes: string[];
  talentCounts: string[];
  locationCounts: string[];
}

export interface WorkPageSearchParams {
  tags?: string;
  addons?: string;
  techniques?: string;
  categories?: string;
  deliverables?: string;
  days?: string;
  crew?: string;
  talent?: string;
  locations?: string;
}
