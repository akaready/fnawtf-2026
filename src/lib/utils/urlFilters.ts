import { ProjectFilters, SortOption, WorkPageSearchParams } from '@/types/filters';

/**
 * Convert filter state to URL search parameters
 */
export function filtersToSearchParams(
  filters: ProjectFilters,
  sort: SortOption
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
  if (sort !== 'newest') {
    params.set('sort', sort);
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
    productionDaysRange: null,
    crewCountRange: null,
    talentCountRange: null,
    locationCountRange: null,
  };
}
