'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectFilters } from '@/types/filters';
import { ChevronDown, X, Search } from 'lucide-react';

/** Clamp a dropdown panel so it stays within the viewport horizontally. */
function useClampedPanel(isOpen: boolean) {
  const panelRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    // Reset so we measure from the natural centered position
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    const rect = el.getBoundingClientRect();
    const pad = 16;
    if (rect.right > window.innerWidth - pad) {
      const shift = rect.right - (window.innerWidth - pad);
      el.style.left = `calc(50% - ${shift}px)`;
    } else if (rect.left < pad) {
      const shift = pad - rect.left;
      el.style.left = `calc(50% + ${shift}px)`;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Clamp after paint so the panel is in the DOM
    requestAnimationFrame(clamp);
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [isOpen, clamp]);

  return panelRef;
}

const DAYS_OPTIONS     = ['1', '2', '3+'];
const CREW_OPTIONS     = ['2', '3', '4+'];
const TALENT_OPTIONS   = ['1', '2', '3', '4+'];
const LOCATION_OPTIONS = ['1', '2', '3+'];

const dropdownAnim = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const } },
  exit:    { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12, ease: 'easeIn' } },
};

const drawerAnim = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
  exit:    { y: '100%', transition: { duration: 0.22, ease: 'easeIn' } },
};

const backdropAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

interface WorkFiltersProps {
  filters: ProjectFilters;
  search: string;
  onFiltersChange: (filters: ProjectFilters) => void;
  onSearchChange: (value: string) => void;
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
}

type DropdownId =
  | 'categories'
  | 'styleTags'
  | 'premiumAddons'
  | 'cameraTechniques'
  | 'deliverables'
  | 'productionDays'
  | 'crewSizes'
  | 'talentCounts'
  | 'locationCounts'
  | 'sort';

// ── Tag filter dropdown (pill options) ────────────────────────────────────────

interface FilterDropdownProps {
  id: DropdownId;
  label: string;
  options: string[];
  selected: string[];
  openId: DropdownId | null;
  onOpen: (id: DropdownId | null) => void;
  onToggle: (tag: string) => void;
}

function FilterDropdown({ id, label, options, selected, openId, onOpen, onToggle }: FilterDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const count = selected.length;
  const panelRef = useClampedPanel(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpen(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpen(isOpen ? null : id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 whitespace-nowrap
          ${count > 0 || isOpen
            ? 'border-accent text-accent bg-accent/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-muted/40'}`}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">{count}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div ref={panelRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <motion.div {...dropdownAnim} className="bg-[#070707] border border-border rounded-xl shadow-2xl p-3 w-[340px]">
              <div className="flex flex-wrap gap-2 justify-center">
                {options.map((option) => {
                  const isActive = selected.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => onToggle(option)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                        ${isActive ? 'bg-accent text-accent-foreground shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Numeric filter dropdown (compact number chips) ────────────────────────────

interface NumericFilterDropdownProps {
  id: DropdownId;
  label: string;
  options: string[];
  selected: string[];
  openId: DropdownId | null;
  onOpen: (id: DropdownId | null) => void;
  onToggle: (tag: string) => void;
}

function NumericFilterDropdown({ id, label, options, selected, openId, onOpen, onToggle }: NumericFilterDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const count = selected.length;
  const panelRef = useClampedPanel(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpen(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => onOpen(isOpen ? null : id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 whitespace-nowrap
          ${count > 0 || isOpen
            ? 'border-accent text-accent bg-accent/10'
            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-muted/40'}`}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="bg-accent text-accent-foreground text-[10px] px-1 py-0.5 rounded-full leading-none">{count}</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div ref={panelRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <motion.div {...dropdownAnim} className="bg-[#070707] border border-border rounded-xl shadow-2xl p-3 min-w-max">
              <div className="flex flex-nowrap gap-1.5 justify-center">
                {options.map((option) => {
                  const isActive = selected.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => onToggle(option)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-150
                        ${isActive ? 'bg-accent text-accent-foreground shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ── Mobile filter drawer ───────────────────────────────────────────────────────

type ToggleTagFn = (
  category: keyof Pick<ProjectFilters,
    'styleTags' | 'premiumAddons' | 'cameraTechniques' | 'categories' | 'deliverables'
    | 'productionDays' | 'crewSizes' | 'talentCounts' | 'locationCounts'>,
  tag: string
) => void;

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ProjectFilters;
  availableTags: WorkFiltersProps['availableTags'];
  activeFilterCount: number;
  onClearAll: () => void;
  toggleTag: ToggleTagFn;
}

type DrawerSectionId = 'categories' | 'styleTags' | 'premiumAddons' | 'cameraTechniques' | 'deliverables' | 'productionDays' | 'crewSizes' | 'talentCounts' | 'locationCounts';

interface DrawerSectionProps {
  id: DrawerSectionId;
  label: string;
  options: string[];
  selected: string[];
  openId: DrawerSectionId | null;
  onToggleOpen: (id: DrawerSectionId) => void;
  onToggle: (option: string) => void;
  numeric?: boolean;
}

function DrawerSection({ id, label, options, selected, openId, onToggleOpen, onToggle, numeric }: DrawerSectionProps) {
  const isOpen = openId === id;
  const count = selected.length;
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => onToggleOpen(id)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${count > 0 ? 'text-accent' : 'text-foreground'}`}>{label}</span>
          {count > 0 && (
            <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">{count}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            className="overflow-hidden"
          >
            <div className={`pb-4 flex flex-wrap ${numeric ? 'gap-1.5' : 'gap-2'}`}>
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => onToggle(option)}
                  className={`transition-all duration-150 font-medium
                    ${numeric
                      ? `w-9 h-9 rounded-lg text-sm font-semibold ${selected.includes(option) ? 'bg-accent text-accent-foreground shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'}`
                      : `px-3 py-1.5 rounded-full text-sm ${selected.includes(option) ? 'bg-accent text-accent-foreground shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'}`
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterDrawer({ open, onClose, filters, availableTags, activeFilterCount, onClearAll, toggleTag }: FilterDrawerProps) {
  const [openSection, setOpenSection] = useState<DrawerSectionId | null>(null);

  const toggleSection = (id: DrawerSectionId) => setOpenSection((prev) => (prev === id ? null : id));

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Reset open section when drawer closes
  useEffect(() => { if (!open) setOpenSection(null); }, [open]);

  if (typeof document === 'undefined') return null;

  const sections = ([
    { id: 'categories'       as DrawerSectionId, label: 'Project Type', options: availableTags.categories,      selected: filters.categories },
    { id: 'styleTags'        as DrawerSectionId, label: 'Style',        options: availableTags.styleTags,        selected: filters.styleTags },
    { id: 'premiumAddons'    as DrawerSectionId, label: 'Add-ons',      options: availableTags.premiumAddons,    selected: filters.premiumAddons },
    { id: 'cameraTechniques' as DrawerSectionId, label: 'Techniques',   options: availableTags.cameraTechniques, selected: filters.cameraTechniques },
    { id: 'deliverables'     as DrawerSectionId, label: 'Deliverables', options: availableTags.deliverables,     selected: filters.deliverables },
    { id: 'productionDays'   as DrawerSectionId, label: 'Days',         options: DAYS_OPTIONS,     selected: filters.productionDays,  numeric: true },
    { id: 'crewSizes'        as DrawerSectionId, label: 'Crew',         options: CREW_OPTIONS,     selected: filters.crewSizes,       numeric: true },
    { id: 'talentCounts'     as DrawerSectionId, label: 'Talent',       options: TALENT_OPTIONS,   selected: filters.talentCounts,    numeric: true },
    { id: 'locationCounts'   as DrawerSectionId, label: 'Locations',    options: LOCATION_OPTIONS, selected: filters.locationCounts,  numeric: true },
  ]).filter((s) => s.options.length > 0);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div {...backdropAnim} className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />

          <motion.div {...drawerAnim} className="fixed bottom-0 left-0 right-0 bg-[#070707] border-t border-border rounded-t-2xl z-50 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-border shrink-0 bg-white/[0.03] rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-display text-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>
                )}
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Accordion body */}
            <div className="overflow-y-auto flex-1 px-5">
              {sections.map((s) => (
                <DrawerSection
                  key={s.id}
                  id={s.id}
                  label={s.label}
                  options={s.options}
                  selected={s.selected}
                  openId={openSection}
                  onToggleOpen={toggleSection}
                  onToggle={(option) => toggleTag(s.id, option)}
                  numeric={s.numeric}
                />
              ))}
            </div>

            {/* Footer */}
            {activeFilterCount > 0 && (
              <div className="px-5 py-4 border-t border-border shrink-0">
                <button
                  onClick={() => { onClearAll(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-accent hover:border-accent transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Main WorkFilters ──────────────────────────────────────────────────────────

export function WorkFilters({ filters, search, onFiltersChange, onSearchChange, availableTags }: WorkFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleTag: ToggleTagFn = (category, tag) => {
    const current = filters[category];
    const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    onFiltersChange({ ...filters, [category]: updated });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      styleTags: [], premiumAddons: [], cameraTechniques: [], categories: [], deliverables: [],
      productionDays: [], crewSizes: [], talentCounts: [], locationCounts: [],
    });
    onSearchChange('');
  };

  const activeFilterCount =
    filters.styleTags.length + filters.premiumAddons.length + filters.cameraTechniques.length +
    filters.categories.length + filters.deliverables.length + filters.productionDays.length +
    filters.crewSizes.length + filters.talentCounts.length + filters.locationCounts.length;

  const hasNumericFilters =
    availableTags.productionDays.length > 0 || availableTags.crewSizes.length > 0 ||
    availableTags.talentCounts.length > 0 || availableTags.locationCounts.length > 0;

  return (
    <div className="bg-muted/30 border-b border-border sticky top-0 z-[30] backdrop-blur-lg">
      <div className="max-w-screen-2xl mx-auto px-6">

        {/* ── Mobile bar (< lg) ── */}
        <div className="flex lg:hidden items-center gap-2 py-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-border bg-muted/40 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:bg-accent/10 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
            {search && (
              <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Filters button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 shrink-0
              ${activeFilterCount > 0
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-muted/40'}`}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* ── Desktop (lg+) ── */}
        <div className="hidden lg:flex items-center justify-between gap-4 py-3">

          {/* Left: Search */}
          <div className="relative w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-border bg-muted/40 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:bg-accent/10 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
            {search && (
              <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Filter dropdowns */}
          <div className="flex flex-col items-end gap-2">
            {/* Row 1: categorical filters */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {availableTags.categories.length > 0 && (
                <FilterDropdown id="categories" label="Project Type" options={availableTags.categories}
                  selected={filters.categories} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('categories', tag)} />
              )}
              {availableTags.styleTags.length > 0 && (
                <FilterDropdown id="styleTags" label="Style" options={availableTags.styleTags}
                  selected={filters.styleTags} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('styleTags', tag)} />
              )}
              {availableTags.premiumAddons.length > 0 && (
                <FilterDropdown id="premiumAddons" label="Add-ons" options={availableTags.premiumAddons}
                  selected={filters.premiumAddons} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('premiumAddons', tag)} />
              )}
              {availableTags.cameraTechniques.length > 0 && (
                <FilterDropdown id="cameraTechniques" label="Techniques" options={availableTags.cameraTechniques}
                  selected={filters.cameraTechniques} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('cameraTechniques', tag)} />
              )}
              {availableTags.deliverables.length > 0 && (
                <FilterDropdown id="deliverables" label="Deliverables" options={availableTags.deliverables}
                  selected={filters.deliverables} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('deliverables', tag)} />
              )}
              {(activeFilterCount > 0 || search) && (
                <button onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-accent transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Row 2: numeric filters */}
            {hasNumericFilters && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <NumericFilterDropdown id="productionDays" label="Days" options={DAYS_OPTIONS}
                  selected={filters.productionDays} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('productionDays', tag)} />
                <NumericFilterDropdown id="crewSizes" label="Crew" options={CREW_OPTIONS}
                  selected={filters.crewSizes} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('crewSizes', tag)} />
                <NumericFilterDropdown id="talentCounts" label="Talent" options={TALENT_OPTIONS}
                  selected={filters.talentCounts} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('talentCounts', tag)} />
                <NumericFilterDropdown id="locationCounts" label="Locations" options={LOCATION_OPTIONS}
                  selected={filters.locationCounts} openId={openDropdown} onOpen={setOpenDropdown}
                  onToggle={(tag) => toggleTag('locationCounts', tag)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        availableTags={availableTags}
        activeFilterCount={activeFilterCount}
        onClearAll={clearAllFilters}
        toggleTag={toggleTag}
      />
    </div>
  );
}
