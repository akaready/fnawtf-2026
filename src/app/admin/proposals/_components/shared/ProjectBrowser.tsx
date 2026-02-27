'use client';

import { useState, useMemo } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import type { BrowserProject } from '@/types/proposal';

interface ProjectBrowserProps {
  projects: BrowserProject[];
  selectedProjectIds: Set<string>;
  onAdd: (projectId: string) => Promise<void>;
  onRemove: (proposalProjectId: string) => Promise<void>;
  projectIdToProposalProjectId: Map<string, string>;
}

export function ProjectBrowser({
  projects,
  selectedProjectIds,
  onAdd,
  onRemove,
  projectIdToProposalProjectId,
}: ProjectBrowserProps) {
  const [search, setSearch] = useState('');
  const [activeStyleTags, setActiveStyleTags] = useState<string[]>([]);
  const [activeTechniques, setActiveTechniques] = useState<string[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const allStyleTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.style_tags) {
        for (const tag of p.style_tags) set.add(tag);
      }
    }
    return Array.from(set).sort();
  }, [projects]);

  const allTechniques = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.camera_techniques) {
        for (const t of p.camera_techniques) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (activeStyleTags.length > 0) {
      result = result.filter((p) =>
        activeStyleTags.every((tag) => p.style_tags?.includes(tag))
      );
    }

    if (activeTechniques.length > 0) {
      result = result.filter((p) =>
        activeTechniques.every((t) => p.camera_techniques?.includes(t))
      );
    }

    return result;
  }, [projects, search, activeStyleTags, activeTechniques]);

  const toggleStyleTag = (tag: string) => {
    setActiveStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleTechnique = (technique: string) => {
    setActiveTechniques((prev) =>
      prev.includes(technique)
        ? prev.filter((t) => t !== technique)
        : [...prev, technique]
    );
  };

  const handleClick = async (project: BrowserProject) => {
    if (loadingIds.has(project.id)) return;

    setLoadingIds((prev) => new Set(prev).add(project.id));
    try {
      if (selectedProjectIds.has(project.id)) {
        const proposalProjectId = projectIdToProposalProjectId.get(project.id);
        if (proposalProjectId) {
          await onRemove(proposalProjectId);
        }
      } else {
        await onAdd(project.id);
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  };

  const hasPills = allStyleTags.length > 0 || allTechniques.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Filter pills */}
      {hasPills && (
        <div className="px-4 pb-3 flex-shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 w-max">
            {allStyleTags.map((tag) => (
              <button
                key={`style-${tag}`}
                onClick={() => toggleStyleTag(tag)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors whitespace-nowrap ${
                  activeStyleTags.includes(tag)
                    ? 'border-white/40 text-white bg-white/[0.08]'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {tag}
              </button>
            ))}
            {allStyleTags.length > 0 && allTechniques.length > 0 && (
              <span className="w-px bg-white/10 mx-0.5 self-stretch" />
            )}
            {allTechniques.map((technique) => (
              <button
                key={`technique-${technique}`}
                onClick={() => toggleTechnique(technique)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors whitespace-nowrap ${
                  activeTechniques.includes(technique)
                    ? 'border-white/40 text-white bg-white/[0.08]'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {technique}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Project grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredProjects.length === 0 ? (
          <p className="text-xs text-white/25 text-center pt-8">No projects match your filters.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredProjects.map((project) => {
              const isSelected = selectedProjectIds.has(project.id);
              const isLoading = loadingIds.has(project.id);

              return (
                <div
                  key={project.id}
                  onClick={() => handleClick(project)}
                  className={`relative rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${
                    isSelected ? 'ring-2 ring-[var(--accent)]' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-white/[0.06]">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/[0.04]" />
                    )}
                  </div>

                  {/* Selected overlay */}
                  {isSelected && !isLoading && (
                    <div className="absolute inset-0 bg-[var(--accent)]/20 flex items-center justify-center">
                      <div className="bg-[var(--accent)] rounded-full p-0.5">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 size={16} className="text-white animate-spin" />
                    </div>
                  )}

                  {/* Title */}
                  <div className="px-1.5 py-1.5">
                    <p className="text-xs text-white/70 truncate leading-tight">{project.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
