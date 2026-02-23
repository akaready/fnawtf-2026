'use client';

import { useState, useEffect, useMemo } from 'react';
import { FeaturedProject } from '@/types/project';
import { ProjectFilters, WorkPageSearchParams } from '@/types/filters';
import { WorkFilters } from './WorkFilters';
import { WorkGrid } from './WorkGrid';
import { filterProjects } from '@/lib/utils/filterProjects';
import { filtersToSearchParams, searchParamsToFilters } from '@/lib/utils/urlFilters';

interface WorkPageClientProps {
  initialProjects: FeaturedProject[];
  availableTags: {
    styleTags: string[];
    premiumAddons: string[];
    cameraTechniques: string[];
    categories: string[];
    deliverables: string[];
    productionDays: string[];
    crewSizes: string[];
    talentCounts: string[];
    locationCounts: string[];
  };
  initialSearchParams: WorkPageSearchParams;
}

export function WorkPageClient({
  initialProjects,
  availableTags,
  initialSearchParams,
}: WorkPageClientProps) {
  const [filters, setFilters] = useState<ProjectFilters>(() =>
    searchParamsToFilters(initialSearchParams)
  );
  const [search, setSearch] = useState('');

  // Sync filters to URL without triggering a Next.js navigation/server re-render
  useEffect(() => {
    const params = filtersToSearchParams(filters);
    const queryString = params.toString();
    const newUrl = queryString ? `/work?${queryString}` : '/work';
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  const filteredProjects = useMemo(() => {
    let result = initialProjects;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q)
      );
    }
    return filterProjects(result, filters);
  }, [initialProjects, search, filters]);

  return (
    <>
      <WorkFilters
        filters={filters}
        search={search}
        onFiltersChange={setFilters}
        onSearchChange={setSearch}
        availableTags={availableTags}
      />

      <div className="max-w-screen-2xl mx-auto py-8 px-6">
        <WorkGrid projects={filteredProjects} />
      </div>
    </>
  );
}
