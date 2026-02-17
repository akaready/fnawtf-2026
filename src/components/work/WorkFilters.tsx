'use client';

import { useState } from 'react';
import { TagFilter } from './TagFilter';
import { RangeFilter } from './RangeFilter';
import { ProjectFilters, SortOption } from '@/types/filters';
import { ChevronDown, X } from 'lucide-react';

interface WorkFiltersProps {
  filters: ProjectFilters;
  sortOption: SortOption;
  onFiltersChange: (filters: ProjectFilters) => void;
  onSortChange: (sort: SortOption) => void;
  availableTags: {
    styleTags: string[];
    premiumAddons: string[];
    cameraTechniques: string[];
    categories: string[];
  };
}

export function WorkFilters({
  filters,
  sortOption,
  onFiltersChange,
  onSortChange,
  availableTags,
}: WorkFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleTag = (
    category: keyof Pick<
      ProjectFilters,
      'styleTags' | 'premiumAddons' | 'cameraTechniques' | 'categories'
    >,
    tag: string
  ) => {
    const current = filters[category];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];

    onFiltersChange({ ...filters, [category]: updated });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      styleTags: [],
      premiumAddons: [],
      cameraTechniques: [],
      categories: [],
      productionDaysRange: null,
      crewCountRange: null,
      talentCountRange: null,
      locationCountRange: null,
    });
    onSortChange('newest');
  };

  const activeFilterCount =
    filters.styleTags.length +
    filters.premiumAddons.length +
    filters.cameraTechniques.length +
    filters.categories.length +
    (filters.productionDaysRange ? 1 : 0) +
    (filters.crewCountRange ? 1 : 0) +
    (filters.talentCountRange ? 1 : 0) +
    (filters.locationCountRange ? 1 : 0);

  return (
    <div className="bg-muted/30 border-y border-border sticky top-0 z-40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6">
        {/* Filter Header */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-foreground font-semibold hover:text-accent transition-colors"
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>

        {/* Filter Content */}
        {isExpanded && (
          <div className="pb-6 space-y-6 border-t border-border pt-6">
            {/* Style Tags */}
            {availableTags.styleTags.length > 0 && (
              <TagFilter
                label="Style"
                tags={availableTags.styleTags}
                selectedTags={filters.styleTags}
                onToggle={(tag) => toggleTag('styleTags', tag)}
              />
            )}

            {/* Categories */}
            {availableTags.categories.length > 0 && (
              <TagFilter
                label="Project Type"
                tags={availableTags.categories}
                selectedTags={filters.categories}
                onToggle={(tag) => toggleTag('categories', tag)}
              />
            )}

            {/* Premium Add-ons */}
            {availableTags.premiumAddons.length > 0 && (
              <TagFilter
                label="Premium Add-ons"
                tags={availableTags.premiumAddons}
                selectedTags={filters.premiumAddons}
                onToggle={(tag) => toggleTag('premiumAddons', tag)}
              />
            )}

            {/* Camera Techniques */}
            {availableTags.cameraTechniques.length > 0 && (
              <TagFilter
                label="Camera Techniques"
                tags={availableTags.cameraTechniques}
                selectedTags={filters.cameraTechniques}
                onToggle={(tag) => toggleTag('cameraTechniques', tag)}
              />
            )}

            {/* Production Scope Ranges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border">
              <RangeFilter
                label="Production Days"
                min={1}
                max={30}
                value={filters.productionDaysRange}
                onChange={(range) =>
                  onFiltersChange({ ...filters, productionDaysRange: range })
                }
                unit=" days"
              />
              <RangeFilter
                label="Crew Count"
                min={1}
                max={50}
                value={filters.crewCountRange}
                onChange={(range) =>
                  onFiltersChange({ ...filters, crewCountRange: range })
                }
                unit=" crew"
              />
              <RangeFilter
                label="Talent Count"
                min={0}
                max={20}
                value={filters.talentCountRange}
                onChange={(range) =>
                  onFiltersChange({ ...filters, talentCountRange: range })
                }
                unit=" talent"
              />
              <RangeFilter
                label="Locations"
                min={1}
                max={20}
                value={filters.locationCountRange}
                onChange={(range) =>
                  onFiltersChange({ ...filters, locationCountRange: range })
                }
                unit=" locations"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
