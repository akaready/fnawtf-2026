import { ProjectFilters, WorkPageSearchParams } from '@/types/filters';

/**
 * Convert filter state to URL search parameters
 */
export function filtersToSearchParams(
  filters: ProjectFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.styleTags.length > 0) {
    params.set('tags', filters.styleTags.join(','));
  }
  if (filters.premiumAddons.length > 0) {
    params.set('addons', filters.premiumAddons.join(','));
  }
  if (filters.cameraTechniques.length > 0) {
    params.set('techniques', filters.cameraTechniques.join(','));
  }
  if (filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.deliverables.length > 0) {
    params.set('deliverables', filters.deliverables.join(','));
  }
  if (filters.productionDays.length > 0) {
    params.set('days', filters.productionDays.join(','));
  }
  if (filters.crewSizes.length > 0) {
    params.set('crew', filters.crewSizes.join(','));
  }
  if (filters.talentCounts.length > 0) {
    params.set('talent', filters.talentCounts.join(','));
  }
  if (filters.locationCounts.length > 0) {
    params.set('locations', filters.locationCounts.join(','));
  }
  return params;
}

/**
 * Convert URL search parameters to filter state
 */
export function searchParamsToFilters(
  searchParams: WorkPageSearchParams
): ProjectFilters {
  return {
    styleTags: searchParams.tags ? searchParams.tags.split(',') : [],
    premiumAddons: searchParams.addons ? searchParams.addons.split(',') : [],
    cameraTechniques: searchParams.techniques
      ? searchParams.techniques.split(',')
      : [],
    categories: searchParams.categories
      ? searchParams.categories.split(',')
      : [],
    deliverables: searchParams.deliverables
      ? searchParams.deliverables.split(',')
      : [],
    productionDays: searchParams.days ? searchParams.days.split(',') : [],
    crewSizes: searchParams.crew ? searchParams.crew.split(',') : [],
    talentCounts: searchParams.talent ? searchParams.talent.split(',') : [],
    locationCounts: searchParams.locations ? searchParams.locations.split(',') : [],
  };
}
