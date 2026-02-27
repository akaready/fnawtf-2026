'use client';

import { useRef, useState, useCallback } from 'react';
import { Plus, Download } from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import { ProjectsTable } from '../_components/ProjectsTable';
import { ProjectPanel } from '../_components/ProjectPanel';
import type { TestimonialOption } from '../_components/ProjectForm';

interface Props {
  projects: Record<string, unknown>[];
  tagSuggestions: Record<string, string[]>;
  testimonials?: TestimonialOption[];
}

export function ProjectsPageClient({ projects: initialProjects, tagSuggestions, testimonials }: Props) {
  const exportRef = useRef<(() => void) | null>(null);
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState(initialProjects);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeProject = projects.find((p) => (p as { id: string }).id === activeId) ?? null;

  const handleRowClick = useCallback((project: { id: string }) => {
    setActiveId(project.id);
  }, []);

  const handleProjectUpdated = useCallback((updated: Record<string, unknown> & { id: string }) => {
    setProjects((prev) => prev.map((p) => ((p as { id: string }).id === updated.id ? updated : p)));
  }, []);

  const handleProjectDeleted = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => (p as { id: string }).id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleProjectCreated = useCallback((newProject: Record<string, unknown> & { id: string }) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveId(newProject.id);
  }, []);

  const openNewProject = useCallback(() => {
    setActiveId('__new__');
  }, []);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
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
              className="btn-secondary px-4 py-2.5 text-sm"
              title="Export filtered list as CSV"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={openNewProject}
              className="btn-primary px-4 py-2.5 text-sm"
            >
              <Plus size={15} />
              New Project
            </button>
          </>
        }
      />

      {/* Table area — fills remaining height, ProjectsTable manages its own scroll */}
      <div className="flex-1 min-h-0">
        <ProjectsTable
          projects={projects as never[]}
          tagSuggestions={tagSuggestions}
          exportRef={exportRef}
          search={search}
          onSearchChange={setSearch}
          onRowClick={handleRowClick}
        />
      </div>

      <ProjectPanel
        project={activeId === '__new__' ? null : (activeProject as (Record<string, unknown> & { id: string }) | null)}
        open={activeId !== null}
        onClose={() => setActiveId(null)}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={handleProjectDeleted}
        onProjectCreated={handleProjectCreated}
        tagSuggestions={tagSuggestions}
        testimonials={testimonials}
      />
    </div>
  );
}
