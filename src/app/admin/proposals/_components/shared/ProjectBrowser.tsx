'use client';

import { useState, useMemo } from 'react';
import { Search, Loader2, Check, X } from 'lucide-react';
import type { BrowserProject } from '@/types/proposal';

interface ProjectBrowserProps {
  projects: BrowserProject[];
  selectedProjectIds: Set<string>;
  onAdd: (projectId: string) => Promise<void>;
  onRemove: (proposalProjectId: string) => Promise<void>;
  projectIdToProposalProjectId: Map<string, string>;
}

const selectCls =
  'bg-black/40 border border-white/[0.10] rounded-md px-2 py-1.5 text-xs text-white/50 focus:outline-none focus:border-white/20 transition-colors cursor-pointer min-w-0';

function uniqueSorted(projects: BrowserProject[], field: keyof Pick<BrowserProject, 'style_tags' | 'premium_addons' | 'camera_techniques'>): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    const arr = p[field];
    if (arr) for (const v of arr) set.add(v);
  }
  return Array.from(set).sort();
}

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
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const allStyleTags  = useMemo(() => uniqueSorted(projects, 'style_tags'),       [projects]);
  const allAddons     = useMemo(() => uniqueSorted(projects, 'premium_addons'),    [projects]);
  const allTechniques = useMemo(() => uniqueSorted(projects, 'camera_techniques'), [projects]);

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.client_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (styleTag)  result = result.filter((p) => p.style_tags?.includes(styleTag));
    if (addon)     result = result.filter((p) => p.premium_addons?.includes(addon));
    if (technique) result = result.filter((p) => p.camera_techniques?.includes(technique));
    return result;
  }, [projects, search, styleTag, addon, technique]);

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
      <div className="px-3 py-3 border-b border-white/[0.12] space-y-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-black/40 border border-white/[0.10] rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
        </div>
        <div className="flex gap-2">
          {allStyleTags.length > 0 && (
            <select value={styleTag} onChange={(e) => setStyleTag(e.target.value)} className={selectCls + ' flex-1'}>
              <option value="">Style</option>
              {allStyleTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {allAddons.length > 0 && (
            <select value={addon} onChange={(e) => setAddon(e.target.value)} className={selectCls + ' flex-1'}>
              <option value="">Scope</option>
              {allAddons.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          {allTechniques.length > 0 && (
            <select value={technique} onChange={(e) => setTechnique(e.target.value)} className={selectCls + ' flex-1'}>
              <option value="">Technique</option>
              {allTechniques.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto admin-scrollbar p-2">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-white/20 py-8">No matching projects.</p>
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
                    isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Thumbnail — exactly matches website sidebar: w-9 h-9 square */}
                  <div className="flex-shrink-0 w-9 h-9 rounded overflow-hidden bg-white/[0.04]">
                    {project.thumbnail_url ? (
                      <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-white/70' : 'text-white/50'}`}>
                      {project.title}
                    </p>
                    {project.client_name && (
                      <p className="text-xs text-white/25 truncate">{project.client_name}</p>
                    )}
                  </div>

                  {/* State indicator */}
                  {isLoading ? (
                    <Loader2 size={14} className="text-white/30 animate-spin flex-shrink-0" />
                  ) : isSelected ? (
                    <>
                      <span className="flex-shrink-0 text-green-400/60 group-hover/item:hidden">
                        <Check size={14} />
                      </span>
                      <span className="flex-shrink-0 text-red-400/60 hidden group-hover/item:block">
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
