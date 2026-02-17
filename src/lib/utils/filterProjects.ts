import { FeaturedProject } from '@/types/project';
import { ProjectFilters } from '@/types/filters';

/**
 * Filter projects based on selected criteria
 *
 * Logic:
 * - Within categories: OR (e.g., "Commercial" OR "Founder Story")
 * - Across categories: AND (e.g., (Commercial OR Founder Story) AND (Teleprompter))
 * - Range filters: Inclusive range matching
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

    // Production days range filter
    if (filters.productionDaysRange) {
      const [min, max] = filters.productionDaysRange;
      if (
        !project.production_days ||
        project.production_days < min ||
        project.production_days > max
      ) {
        return false;
      }
    }

    // Crew count range filter
    if (filters.crewCountRange) {
      const [min, max] = filters.crewCountRange;
      if (
        !project.crew_count ||
        project.crew_count < min ||
        project.crew_count > max
      ) {
        return false;
      }
    }

    // Talent count range filter
    if (filters.talentCountRange) {
      const [min, max] = filters.talentCountRange;
      if (
        !project.talent_count ||
        project.talent_count < min ||
        project.talent_count > max
      ) {
        return false;
      }
    }

    // Location count range filter
    if (filters.locationCountRange) {
      const [min, max] = filters.locationCountRange;
      if (
        !project.location_count ||
        project.location_count < min ||
        project.location_count > max
      ) {
        return false;
      }
    }

    return true;
  });
}
