import { FeaturedProject } from '@/types/project';
import { SortOption } from '@/types/filters';

/**
 * Sort projects based on selected sort option
 */
export function sortProjects(
  projects: FeaturedProject[],
  sortOption: SortOption
): FeaturedProject[] {
  const sorted = [...projects];

  switch (sortOption) {
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    case 'oldest':
      return sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));

    default:
      return sorted;
  }
}
