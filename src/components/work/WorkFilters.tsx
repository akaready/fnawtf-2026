'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectFilters, SortOption } from '@/types/filters';
import { ChevronDown, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const dropdownAnim = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const } },
  exit:    { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12, ease: 'easeIn' } },
};

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

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  'title-asc': 'Title (A–Z)',
  'title-desc': 'Title (Z–A)',
};

type DropdownId = 'categories' | 'styleTags' | 'premiumAddons' | 'cameraTechniques' | 'sort';

interface FilterDropdownProps {
  id: DropdownId;
  label: string;
  options: string[];
  selected: string[];
  openId: DropdownId | null;
  onOpen: (id: DropdownId | null) => void;
  onToggle: (tag: string) => void;
}

function FilterDropdown({
  id,
  label,
  options,
  selected,
  openId,
  onOpen,
  onToggle,
}: FilterDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const count = selected.length;

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpen(isOpen ? null : id)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 whitespace-nowrap
          ${count > 0 || isOpen
            ? 'border-accent text-accent bg-accent/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-muted/40'
          }
        `}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">
            {count}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...dropdownAnim}
            className="absolute top-full left-0 mt-2 bg-[#070707] border border-border rounded-xl shadow-2xl z-50 p-3 w-[340px]"
          >
            <div className="flex flex-wrap gap-2 items-start">
              {options.map((option) => {
                const isActive = selected.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => onToggle(option)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                      ${isActive
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                      }
                    `}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SortDropdownProps {
  sortOption: SortOption;
  openId: DropdownId | null;
  onOpen: (id: DropdownId | null) => void;
  onSortChange: (sort: SortOption) => void;
}

function SortDropdown({ sortOption, openId, onOpen, onSortChange }: SortDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === 'sort';

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpen(isOpen ? null : 'sort')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 whitespace-nowrap
          ${isOpen
            ? 'border-accent text-accent bg-accent/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-muted/40'
          }
        `}
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>{SORT_LABELS[sortOption]}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...dropdownAnim}
            className="absolute top-full right-0 mt-2 bg-[#070707] border border-border rounded-xl shadow-2xl z-50 py-1 min-w-[180px]"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  onSortChange(key);
                  onOpen(null);
                }}
                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                  ${sortOption === key
                    ? 'text-accent font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }
                `}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WorkFilters({
  filters,
  sortOption,
  onFiltersChange,
  onSortChange,
  availableTags,
}: WorkFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);

  const toggleTag = (
    category: keyof Pick<ProjectFilters, 'styleTags' | 'premiumAddons' | 'cameraTechniques' | 'categories'>,
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
    filters.categories.length;

  return (
    <div className="bg-muted/30 border-b border-border sticky top-0 z-[30] backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="py-4 flex items-center gap-3 flex-wrap">
          {/* Filter icon */}
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />

          {/* Filter dropdowns */}
          {availableTags.categories.length > 0 && (
            <FilterDropdown
              id="categories"
              label="Project Type"
              options={availableTags.categories}
              selected={filters.categories}
              openId={openDropdown}
              onOpen={setOpenDropdown}
              onToggle={(tag) => toggleTag('categories', tag)}
            />
          )}
          {availableTags.styleTags.length > 0 && (
            <FilterDropdown
              id="styleTags"
              label="Style"
              options={availableTags.styleTags}
              selected={filters.styleTags}
              openId={openDropdown}
              onOpen={setOpenDropdown}
              onToggle={(tag) => toggleTag('styleTags', tag)}
            />
          )}
          {availableTags.premiumAddons.length > 0 && (
            <FilterDropdown
              id="premiumAddons"
              label="Add-ons"
              options={availableTags.premiumAddons}
              selected={filters.premiumAddons}
              openId={openDropdown}
              onOpen={setOpenDropdown}
              onToggle={(tag) => toggleTag('premiumAddons', tag)}
            />
          )}
          {availableTags.cameraTechniques.length > 0 && (
            <FilterDropdown
              id="cameraTechniques"
              label="Camera"
              options={availableTags.cameraTechniques}
              selected={filters.cameraTechniques}
              openId={openDropdown}
              onOpen={setOpenDropdown}
              onToggle={(tag) => toggleTag('cameraTechniques', tag)}
            />
          )}

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-accent transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* Sort — pushed to far right */}
          <div className="ml-auto shrink-0">
            <SortDropdown
              sortOption={sortOption}
              openId={openDropdown}
              onOpen={setOpenDropdown}
              onSortChange={onSortChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
