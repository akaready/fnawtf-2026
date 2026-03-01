'use client';

import { useState, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, Save, X } from 'lucide-react';
import {
  addProposalProject,
  removeProposalProject,
  updateProposalProjectBlurb,
  reorderProposalProjects,
} from '@/app/admin/actions';
import { ProjectBrowser } from '../shared/ProjectBrowser';
import type { BrowserProject, ProposalProjectWithProject } from '@/types/proposal';

// ── ProjectListItem ─────────────────────────────────────────────────────────

function ProjectListItem({
  item,
  onBlurbSave,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: ProposalProjectWithProject;
  onBlurbSave: (id: string, blurb: string) => Promise<void>;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [blurb, setBlurb] = useState(item.blurb ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onBlurbSave(item.id, blurb);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 rounded-lg border border-admin-border transition-colors">
      {/* Full-width thumbnail */}
      <div className="w-full rounded-md overflow-hidden bg-admin-bg-hover mb-2.5" style={{ aspectRatio: '16/9' }}>
        {item.project.thumbnail_url ? (
          <img
            src={item.project.thumbnail_url}
            alt={item.project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-admin-bg-selected" />
        )}
      </div>

      {/* Title + client */}
      <div className="mt-1 mb-2.5">
        <p className="text-base font-medium text-admin-text-primary/90 truncate leading-tight">
          {item.project.title}
        </p>
        <p className="text-sm text-admin-text-dim truncate mt-0.5">
          {item.project.client_name ?? ''}
        </p>
      </div>

      {/* Blurb textarea */}
      <textarea
        rows={4}
        value={blurb}
        onChange={(e) => setBlurb(e.target.value)}
        placeholder="What to look for..."
        className="w-full bg-black/40 border border-admin-border rounded text-sm text-admin-text-secondary placeholder:text-admin-text-ghost px-2.5 py-2 resize-none focus:outline-none focus:border-admin-border-emphasis transition-colors leading-relaxed"
      />

      {/* Action row */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
            blurb.trim()
              ? 'bg-white text-black hover:bg-white/90'
              : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
          }`}
        >
          {saving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : saved ? (
            <Check size={11} className={blurb.trim() ? 'text-black' : 'text-admin-success'} />
          ) : (
            <Save size={11} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>

        {/* Reorder up/down */}
        <button
          onClick={() => onMoveUp(item.id)}
          disabled={isFirst}
          title="Move up"
          className="w-6 h-6 flex items-center justify-center rounded bg-admin-bg-selected text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover-strong transition-colors disabled:opacity-20 disabled:hover:bg-admin-bg-selected disabled:hover:text-admin-text-faint"
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={() => onMoveDown(item.id)}
          disabled={isLast}
          title="Move down"
          className="w-6 h-6 flex items-center justify-center rounded bg-admin-bg-selected text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover-strong transition-colors disabled:opacity-20 disabled:hover:bg-admin-bg-selected disabled:hover:text-admin-text-faint"
        >
          <ChevronDown size={13} />
        </button>

        <div className="flex-1" />

        {/* Remove with confirm */}
        {confirmingRemove ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onRemove(item.id); setConfirmingRemove(false); }}
              title="Confirm remove"
              className="w-6 h-6 flex items-center justify-center rounded text-admin-danger hover:text-admin-danger-hover hover:bg-admin-danger-bg transition-colors"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setConfirmingRemove(false)}
              title="Cancel"
              className="w-6 h-6 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingRemove(true)}
            className="w-6 h-6 flex items-center justify-center rounded text-admin-text-ghost hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
            aria-label="Remove project"
          >
            <X size={12} />
          </button>
        )}
      </div>
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

  const handleBlurbSave = useCallback(async (id: string, blurb: string) => {
    await updateProposalProjectBlurb(id, blurb);
    setProposalProjects((prev) => prev.map((p) => (p.id === id ? { ...p, blurb } : p)));
  }, []);

  // Sort by sort_order for display
  const sortedProposalProjects = [...proposalProjects].sort((a, b) => a.sort_order - b.sort_order);

  const handleMove = useCallback(async (id: string, direction: 'up' | 'down') => {
    setProposalProjects((prev) => {
      const sorted = [...prev].sort((a, b) => a.sort_order - b.sort_order);
      const idx = sorted.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

      // Swap sort_order values
      const updated = sorted.map((p, i) => {
        if (i === idx) return { ...p, sort_order: sorted[swapIdx].sort_order };
        if (i === swapIdx) return { ...p, sort_order: sorted[idx].sort_order };
        return p;
      });

      // Persist in background
      void reorderProposalProjects(updated.map((p) => ({ id: p.id, sort_order: p.sort_order })));

      return updated;
    });
  }, []);

  return (
    <div className="flex h-full">
      {/* Left panel: selected + ordered list (40%) */}
      <div className="w-[40%] border-r border-admin-border overflow-y-auto admin-scrollbar p-4">
        <p className="text-xs font-mono text-admin-text-ghost uppercase tracking-widest mb-4">
          Selected ({proposalProjects.length})
        </p>

        {sortedProposalProjects.length === 0 ? (
          <p className="text-xs text-admin-text-ghost text-center mt-8">
            Click projects on the right to add them.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedProposalProjects.map((item, i) => (
              <ProjectListItem
                key={item.id}
                item={item}
                onBlurbSave={handleBlurbSave}
                onRemove={handleRemove}
                onMoveUp={(id) => handleMove(id, 'up')}
                onMoveDown={(id) => handleMove(id, 'down')}
                isFirst={i === 0}
                isLast={i === sortedProposalProjects.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right panel: project browser (60%) */}
      <div className="w-[60%] overflow-y-auto admin-scrollbar">
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
