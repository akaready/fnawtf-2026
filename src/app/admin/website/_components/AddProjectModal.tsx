'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import type { BrowserProject } from '@/types/proposal';

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  allProjects: BrowserProject[];
  placedProjectIds: Set<string>;
  onAdd: (projectId: string) => Promise<void>;
}

export function AddProjectModal({
  open,
  onClose,
  allProjects,
  placedProjectIds,
  onAdd,
}: AddProjectModalProps) {
  const [search, setSearch] = useState('');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const available = useMemo(() => {
    let list = allProjects.filter((p) => !placedProjectIds.has(p.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return list;
  }, [allProjects, placedProjectIds, search]);

  const handleAdd = useCallback(
    async (projectId: string) => {
      setLoadingIds((prev) => new Set(prev).add(projectId));
      try {
        await onAdd(projectId);
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    },
    [onAdd],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-white/[0.1] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
          <Search size={15} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search published projects…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto admin-scrollbar p-2">
          {available.length === 0 ? (
            <p className="text-center text-xs text-white/25 py-8">
              {search ? 'No matching projects.' : 'All projects are already placed on this page.'}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {available.map((project) => {
                const isLoading = loadingIds.has(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => handleAdd(project.id)}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-10 h-7 rounded overflow-hidden bg-white/[0.04]">
                      {project.thumbnail_url ? (
                        <img
                          src={project.thumbnail_url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>

                    <span className="flex-1 text-sm text-white/70 truncate">{project.title}</span>

                    {isLoading ? (
                      <Loader2 size={13} className="text-white/30 animate-spin flex-shrink-0" />
                    ) : placedProjectIds.has(project.id) ? (
                      <Check size={13} className="text-green-400 flex-shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
