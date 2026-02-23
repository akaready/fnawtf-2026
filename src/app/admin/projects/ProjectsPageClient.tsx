'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { ProjectsTable } from '../_components/ProjectsTable';

interface Props {
  projects: Record<string, unknown>[];
  tagSuggestions: Record<string, string[]>;
}

export function ProjectsPageClient({ projects, tagSuggestions }: Props) {
  const exportRef = useRef<(() => void) | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportRef.current?.()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-white/5 transition-colors"
            title="Export filtered list as CSV"
          >
            <Download size={14} />
            CSV
          </button>
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-black hover:text-white border border-white transition-colors"
          >
            <Plus size={15} />
            New Project
          </Link>
        </div>
      </div>

      <ProjectsTable
        projects={projects as never[]}
        tagSuggestions={tagSuggestions}
        exportRef={exportRef}
      />
    </div>
  );
}
