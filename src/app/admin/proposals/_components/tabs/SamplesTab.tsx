'use client';

import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import {
  addProposalProject,
  removeProposalProject,
  updateProposalProjectBlurb,
} from '@/app/admin/actions';
import { ProjectBrowser } from '../shared/ProjectBrowser';
import type { BrowserProject, ProposalProjectWithProject } from '@/types/proposal';

// ── ProjectListItem ─────────────────────────────────────────────────────────

function ProjectListItem({
  item,
  onBlurbChange,
  onRemove,
}: {
  item: ProposalProjectWithProject;
  onBlurbChange: (id: string, blurb: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="group p-3 rounded-lg border border-white/[0.12] hover:border-white/[0.12] transition-colors">
      <div className="flex items-center gap-2.5">
        {/* Thumbnail */}
        <div
          className="flex-shrink-0 w-12 rounded-md overflow-hidden bg-white/[0.06]"
          style={{ aspectRatio: '16/9' }}
        >
          {item.project.thumbnail_url ? (
            <img
              src={item.project.thumbnail_url}
              alt={item.project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/[0.04]" />
          )}
        </div>

        {/* Title + client */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate leading-tight">
            {item.project.title}
          </p>
          {item.project.client_name && (
            <p className="text-xs text-white/40 truncate mt-0.5">{item.project.client_name}</p>
          )}
        </div>

        {/* Remove — hover only */}
        <button
          onClick={() => onRemove(item.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
          aria-label="Remove project"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Full-width blurb */}
      <textarea
        rows={2}
        defaultValue={item.blurb ?? ''}
        onChange={(e) => onBlurbChange(item.id, e.target.value)}
        placeholder="What to look for..."
        className="mt-2.5 w-full bg-white/[0.04] border border-white/[0.12] rounded text-xs text-white/55 placeholder:text-white/20 px-2.5 py-1.5 resize-none focus:outline-none focus:border-white/20 transition-colors leading-relaxed"
      />
    </div>
  );
}

// ── SamplesTab ─────────────────────────────────────────────────────────────

interface SamplesTabProps {
  proposalId: string;
  allProjects: BrowserProject[];
  initialProposalProjects: ProposalProjectWithProject[];
}

export function SamplesTab({ proposalId, allProjects, initialProposalProjects }: SamplesTabProps) {
  const [proposalProjects, setProposalProjects] = useState<ProposalProjectWithProject[]>(
    initialProposalProjects
  );

  const blurbTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const selectedProjectIds = new Set(proposalProjects.map((p) => p.project_id));
  const projectIdToProposalProjectId = new Map(
    proposalProjects.map((p) => [p.project_id, p.id])
  );

  const handleAdd = useCallback(
    async (projectId: string) => {
      const id = await addProposalProject({
        proposal_id: proposalId,
        project_id: projectId,
        sort_order: proposalProjects.length,
      });
      const project = allProjects.find((p) => p.id === projectId)!;
      setProposalProjects((prev) => [
        ...prev,
        { id, proposal_id: proposalId, project_id: projectId, section_id: null, sort_order: prev.length, blurb: null, project },
      ]);
    },
    [proposalId, proposalProjects.length, allProjects]
  );

  const handleRemove = useCallback(async (proposalProjectId: string) => {
    await removeProposalProject(proposalProjectId);
    setProposalProjects((prev) => prev.filter((p) => p.id !== proposalProjectId));
  }, []);

  const handleBlurbChange = useCallback((id: string, blurb: string) => {
    if (blurbTimers.current[id]) clearTimeout(blurbTimers.current[id]);
    blurbTimers.current[id] = setTimeout(async () => {
      await updateProposalProjectBlurb(id, blurb);
      setProposalProjects((prev) => prev.map((p) => (p.id === id ? { ...p, blurb } : p)));
    }, 800);
  }, []);

  // Sort selected projects by client name, then project title
  const sortedProposalProjects = [...proposalProjects].sort((a, b) => {
    const aClient = a.project.client_name ?? '';
    const bClient = b.project.client_name ?? '';
    const clientCmp = aClient.localeCompare(bClient);
    if (clientCmp !== 0) return clientCmp;
    return a.project.title.localeCompare(b.project.title);
  });

  return (
    <div className="flex h-full">
      {/* Left panel: selected + ordered list (40%) */}
      <div className="w-[40%] border-r border-white/[0.12] overflow-y-auto p-4">
        <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-4">
          Selected ({proposalProjects.length})
        </p>

        {sortedProposalProjects.length === 0 ? (
          <p className="text-xs text-white/25 text-center mt-8">
            Click projects on the right to add them.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedProposalProjects.map((item) => (
              <ProjectListItem
                key={item.id}
                item={item}
                onBlurbChange={handleBlurbChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right panel: project browser (60%) */}
      <div className="w-[60%] overflow-y-auto">
        <ProjectBrowser
          projects={allProjects}
          selectedProjectIds={selectedProjectIds}
          onAdd={handleAdd}
          onRemove={handleRemove}
          projectIdToProposalProjectId={projectIdToProposalProjectId}
        />
      </div>
    </div>
  );
}
