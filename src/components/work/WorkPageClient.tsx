'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeaturedProject } from '@/types/project';
import { ProjectFilters, SortOption } from '@/types/filters';
import { WorkFilters } from './WorkFilters';
import { WorkGrid } from './WorkGrid';
import { filterProjects } from '@/lib/utils/filterProjects';
import { sortProjects } from '@/lib/utils/sortProjects';
import { filtersToSearchParams, searchParamsToFilters } from '@/lib/utils/urlFilters';

interface WorkPageClientProps {
  initialProjects: FeaturedProject[];
  availableTags: {
    styleTags: string[];
    premiumAddons: string[];
    cameraTechniques: string[];
    categories: string[];
  };
}

export function WorkPageClient({
  initialProjects,
  availableTags,
}: WorkPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ProjectFilters>(() =>
    searchParamsToFilters({
      tags: searchParams?.get('tags') || undefined,
      addons: searchParams?.get('addons') || undefined,
      techniques: searchParams?.get('techniques') || undefined,
      categories: searchParams?.get('categories') || undefined,
      sort: (searchParams?.get('sort') as SortOption) || undefined,
    })
  );

  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams?.get('sort') as SortOption) || 'newest'
  );

  // Update URL when filters change
  useEffect(() => {
    const params = filtersToSearchParams(filters, sortOption);
    const queryString = params.toString();
    const newUrl = queryString ? `/work?${queryString}` : '/work';
    router.replace(newUrl, { scroll: false });
  }, [filters, sortOption, router]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    const filtered = filterProjects(initialProjects, filters);
    return sortProjects(filtered, sortOption);
  }, [initialProjects, filters, sortOption]);

  return (
    <>
      <WorkFilters
        filters={filters}
        sortOption={sortOption}
        onFiltersChange={setFilters}
        onSortChange={setSortOption}
        availableTags={availableTags}
      />

      <div className="max-w-7xl mx-auto py-12 px-6">
        <WorkGrid projects={filteredAndSortedProjects} />
      </div>
    </>
  );
}
