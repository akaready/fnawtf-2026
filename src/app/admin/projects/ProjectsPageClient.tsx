'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
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
      <AdminPageHeader
        title="Projects"
        subtitle={`${projects.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects…"
        actions={
          <>
            <button
              onClick={() => exportRef.current?.()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1f1f1f] bg-black text-sm text-muted-foreground hover:text-foreground hover:border-[#333] hover:bg-white/5 transition-colors"
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
          </>
        }
      />

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
