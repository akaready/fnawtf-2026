import { FeaturedProject } from '@/types/project';
import { ProjectFilters } from '@/types/filters';

/** Matches a project's numeric field against a filter value.
 *  Values ending in "+" (e.g. "3+") match anything >= that number.
 *  Plain values (e.g. "2") match exactly.
 */
function matchNumeric(projectValue: number | null | undefined, filterValue: string): boolean {
  if (projectValue == null) return false;
  if (filterValue.endsWith('+')) return projectValue >= parseInt(filterValue);
  return projectValue === Number(filterValue);
}

/**
 * Filter projects based on selected criteria
 *
 * Logic:
 * - Within categories: OR (e.g., "Commercial" OR "Founder Story")
 * - Across categories: AND (e.g., (Commercial OR Founder Story) AND (Teleprompter))
 * - Production scope: exact or bucketed match ("3+" = 3 or more)
 */
export function filterProjects(
  projects: FeaturedProject[],
  filters: ProjectFilters
): FeaturedProject[] {
  return projects.filter((project) => {
    // Style tags filter (OR within category)
    if (filters.styleTags.length > 0) {
      const hasStyleTag = filters.styleTags.some((tag) =>
        project.style_tags?.includes(tag)
      );
      if (!hasStyleTag) return false;
    }

    // Premium addons filter (OR within category)
    if (filters.premiumAddons.length > 0) {
      const hasAddon = filters.premiumAddons.some((addon) =>
        project.premium_addons?.includes(addon)
      );
      if (!hasAddon) return false;
    }

    // Camera techniques filter (OR within category)
    if (filters.cameraTechniques.length > 0) {
      const hasTechnique = filters.cameraTechniques.some((tech) =>
        project.camera_techniques?.includes(tech)
      );
      if (!hasTechnique) return false;
    }

    // Category filter (OR within category)
    if (filters.categories.length > 0) {
      const hasCategory = filters.categories.includes(project.category || '');
      if (!hasCategory) return false;
    }

    // Deliverables filter (OR within category)
    if (filters.deliverables.length > 0) {
      const hasDeliverable = filters.deliverables.some((d) =>
        (project.assets_delivered as string[] | undefined)?.includes(d)
      );
      if (!hasDeliverable) return false;
    }

    // Production days filter (OR — supports "3+" bucketing)
    if (filters.productionDays.length > 0) {
      if (!filters.productionDays.some((d) => matchNumeric(project.production_days, d))) return false;
    }

    // Crew size filter (OR — supports "4+" bucketing)
    if (filters.crewSizes.length > 0) {
      if (!filters.crewSizes.some((d) => matchNumeric(project.crew_count, d))) return false;
    }

    // Talent count filter (OR — supports "4+" bucketing)
    if (filters.talentCounts.length > 0) {
      if (!filters.talentCounts.some((d) => matchNumeric(project.talent_count, d))) return false;
    }

    // Location count filter (OR — supports "4+" bucketing)
    if (filters.locationCounts.length > 0) {
      if (!filters.locationCounts.some((d) => matchNumeric(project.location_count, d))) return false;
    }

    return true;
  });
}
