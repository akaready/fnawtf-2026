'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, Check, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { BrowserProject } from '@/types/proposal';

interface ProjectBrowserProps {
  projects: BrowserProject[];
  selectedProjectIds: Set<string>;
  onAdd: (projectId: string) => Promise<void>;
  onRemove: (proposalProjectId: string) => Promise<void>;
  projectIdToProposalProjectId: Map<string, string>;
}

function FilterSelect({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-1 bg-black/40 border rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer min-w-0 ${
          value
            ? 'border-admin-border-emphasis text-admin-text-secondary'
            : 'border-admin-border text-admin-text-dim'
        } hover:border-admin-border-emphasis`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronsUpDown size={11} className="flex-shrink-0 text-admin-text-ghost" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-admin-bg-overlay border border-admin-border rounded-md shadow-xl overflow-hidden">
          <div className="px-2 py-1.5 border-b border-admin-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${placeholder.toLowerCase()}…`}
              className="w-full bg-transparent text-xs text-admin-text-secondary placeholder:text-admin-text-placeholder focus:outline-none"
            />
          </div>
          <div className="max-h-40 overflow-y-auto admin-scrollbar">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors ${
                !value ? 'text-[#999] bg-white/[0.06]' : 'text-white/35 hover:bg-white/[0.06] hover:text-admin-text-secondary'
              }`}
            >
              All
            </button>
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between ${
                  value === opt
                    ? 'text-[#ccc] bg-white/[0.06]'
                    : 'text-admin-text-secondary hover:bg-white/[0.06] hover:text-admin-text-secondary'
                }`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check size={11} className="flex-shrink-0 text-admin-text-dim" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-admin-text-placeholder">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function uniqueSortedArray(projects: BrowserProject[], field: keyof Pick<BrowserProject, 'style_tags' | 'premium_addons' | 'camera_techniques' | 'assets_delivered'>): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    const arr = p[field];
    if (arr) for (const v of arr) set.add(v);
  }
  return Array.from(set).sort();
}

function uniqueSortedScalar(projects: BrowserProject[], field: keyof Pick<BrowserProject, 'category'>): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    const v = p[field];
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}

const numInputCls =
  'bg-black/40 border border-admin-border rounded-md text-xs text-admin-text-secondary focus:outline-none focus:border-admin-border-emphasis transition-colors w-full text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export function ProjectBrowser({
  projects,
  selectedProjectIds,
  onAdd,
  onRemove,
  projectIdToProposalProjectId,
}: ProjectBrowserProps) {
  const [search, setSearch] = useState('');
  const [styleTag, setStyleTag] = useState('');
  const [addon, setAddon] = useState('');
  const [technique, setTechnique] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [projectType, setProjectType] = useState('');
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [crewFilter, setCrewFilter] = useState<number | null>(null);
  const [talentFilter, setTalentFilter] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const allTypes        = useMemo(() => uniqueSortedScalar(projects, 'category'),         [projects]);
  const allDeliverables = useMemo(() => uniqueSortedArray(projects, 'assets_delivered'),  [projects]);
  const allStyleTags    = useMemo(() => uniqueSortedArray(projects, 'style_tags'),       [projects]);
  const allAddons       = useMemo(() => uniqueSortedArray(projects, 'premium_addons'),    [projects]);
  const allTechniques   = useMemo(() => uniqueSortedArray(projects, 'camera_techniques'), [projects]);

  const stepNum = useCallback((current: number | null, delta: number, min: number) => {
    if (current == null) return min;
    const next = current + delta;
    return next < min ? null : next;
  }, []);

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.client_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (projectType)           result = result.filter((p) => p.category === projectType);
    if (deliverable)           result = result.filter((p) => p.assets_delivered?.includes(deliverable));
    if (styleTag)              result = result.filter((p) => p.style_tags?.includes(styleTag));
    if (addon)                 result = result.filter((p) => p.premium_addons?.includes(addon));
    if (technique)             result = result.filter((p) => p.camera_techniques?.includes(technique));
    if (daysFilter != null)     result = result.filter((p) => p.production_days != null && p.production_days >= daysFilter);
    if (crewFilter != null)     result = result.filter((p) => p.crew_count != null && p.crew_count >= crewFilter);
    if (talentFilter != null)   result = result.filter((p) => p.talent_count != null && p.talent_count >= talentFilter);
    if (locationFilter != null) result = result.filter((p) => p.location_count != null && p.location_count >= locationFilter);
    return result;
  }, [projects, search, styleTag, addon, technique, deliverable, projectType, daysFilter, crewFilter, talentFilter, locationFilter]);

  const handleClick = async (project: BrowserProject) => {
    if (loadingIds.has(project.id)) return;
    setLoadingIds((prev) => new Set(prev).add(project.id));
    try {
      if (selectedProjectIds.has(project.id)) {
        const ppId = projectIdToProposalProjectId.get(project.id);
        if (ppId) await onRemove(ppId);
      } else {
        await onAdd(project.id);
      }
    } finally {
      setLoadingIds((prev) => { const n = new Set(prev); n.delete(project.id); return n; });
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Search + filter dropdowns */}
      <div className="px-3 py-3 border-b border-admin-border space-y-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-text-ghost pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-black/40 border border-admin-border rounded-md pl-8 pr-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:border-admin-border-emphasis"
          />
        </div>
        {/* Tag filters — ordered to match tags admin page */}
        <div className="grid grid-cols-2 gap-1.5">
          <FilterSelect value={projectType} onChange={setProjectType} placeholder="Type" options={allTypes} />
          <FilterSelect value={deliverable} onChange={setDeliverable} placeholder="Deliverable" options={allDeliverables} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <FilterSelect value={styleTag} onChange={setStyleTag} placeholder="Style" options={allStyleTags} />
          <FilterSelect value={addon} onChange={setAddon} placeholder="Add-ons" options={allAddons} />
          <FilterSelect value={technique} onChange={setTechnique} placeholder="Technique" options={allTechniques} />
        </div>
        {/* Production scope — number inputs with up/down steppers */}
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { label: 'Days', value: daysFilter, set: setDaysFilter, min: 1, step: 0.5 },
            { label: 'Crew', value: crewFilter, set: setCrewFilter, min: 1, step: 1 },
            { label: 'Talent', value: talentFilter, set: setTalentFilter, min: 1, step: 1 },
            { label: 'Locs', value: locationFilter, set: setLocationFilter, min: 1, step: 1 },
          ] as const).map(({ label, value, set, min, step }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-xs text-admin-text-faint leading-none whitespace-nowrap">{label}</span>
              <input
                type="number"
                value={value ?? ''}
                onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))}
                placeholder="—"
                min={min}
                step={step}
                className={numInputCls + ' w-8 py-0.5 px-0'}
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => set(stepNum(value, step, min))}
                  className="px-1 py-px rounded hover:bg-white/[0.08] text-admin-text-faint hover:text-[#999] transition-colors leading-none"
                >
                  <ChevronUp size={12} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => set(stepNum(value, -step, min))}
                  className="px-1 py-px rounded hover:bg-white/[0.08] text-admin-text-faint hover:text-[#999] transition-colors leading-none"
                >
                  <ChevronDown size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto admin-scrollbar p-2">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-admin-text-placeholder py-8">No matching projects.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((project) => {
              const isSelected = selectedProjectIds.has(project.id);
              const isLoading  = loadingIds.has(project.id);

              return (
                <button
                  key={project.id}
                  onClick={() => handleClick(project)}
                  disabled={isLoading}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors disabled:opacity-50 group/item w-full ${
                    isSelected ? 'bg-admin-bg-selected' : 'hover:bg-admin-bg-selected'
                  }`}
                >
                  {/* Thumbnail — exactly matches website sidebar: w-9 h-9 square */}
                  <div className="flex-shrink-0 w-9 h-9 rounded overflow-hidden bg-admin-bg-selected">
                    {project.thumbnail_url ? (
                      <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-admin-text-secondary' : 'text-admin-text-secondary'}`}>
                      {project.title}
                    </p>
                    {project.client_name && (
                      <p className="text-xs text-admin-text-ghost truncate">{project.client_name}</p>
                    )}
                  </div>

                  {/* State indicator */}
                  {isLoading ? (
                    <Loader2 size={14} className="text-admin-text-faint animate-spin flex-shrink-0" />
                  ) : isSelected ? (
                    <>
                      <span className="flex-shrink-0 text-admin-success/60 group-hover/item:hidden">
                        <Check size={14} />
                      </span>
                      <span className="flex-shrink-0 text-admin-danger/60 hidden group-hover/item:block">
                        <X size={14} />
                      </span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
