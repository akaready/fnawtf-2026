'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Download, Search } from 'lucide-react';
import { ProjectsTable } from '../_components/ProjectsTable';

interface Props {
  projects: Record<string, unknown>[];
  tagSuggestions: Record<string, string[]>;
}

export function ProjectsPageClient({ projects, tagSuggestions }: Props) {
  const exportRef = useRef<(() => void) | null>(null);
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Page title — never scrolls */}
      <div className="flex-shrink-0 px-8 pt-10 pb-4 border-b border-white/[0.12]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projects.length} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-lg border border-border/60 bg-[#111] pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
              />
            </div>
            <button
              onClick={() => exportRef.current?.()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-white/5 transition-colors"
              title="Export filtered list as CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <Link
              href="/admin/projects/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-black hover:text-white border border-white transition-colors"
            >
              <Plus size={15} />
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Table area — fills remaining height, ProjectsTable manages its own scroll */}
      <div className="flex-1 min-h-0 px-8">
        <ProjectsTable
          projects={projects as never[]}
          tagSuggestions={tagSuggestions}
          exportRef={exportRef}
          search={search}
          onSearchChange={setSearch}
        />
      </div>
    </div>
  );
}
