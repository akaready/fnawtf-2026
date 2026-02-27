'use client';

import { useState, useRef, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import {
  addProposalProject,
  removeProposalProject,
  reorderProposalProjects,
  updateProposalProjectBlurb,
} from '@/app/admin/actions';
import { ProjectBrowser } from '../shared/ProjectBrowser';
import type { BrowserProject, ProposalProjectWithProject } from '@/types/proposal';

// ── SortableProjectItem ────────────────────────────────────────────────────

function SortableProjectItem({
  item,
  onBlurbChange,
  onRemove,
}: {
  item: ProposalProjectWithProject;
  onBlurbChange: (id: string, blurb: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] group"
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="mt-0.5 flex-shrink-0 text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-10 rounded overflow-hidden bg-white/[0.06]" style={{ height: 28 }}>
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80 truncate mb-1.5">{item.project.title}</p>
        <textarea
          rows={3}
          defaultValue={item.blurb ?? ''}
          onChange={(e) => onBlurbChange(item.id, e.target.value)}
          placeholder="What to look for..."
          className="w-full bg-white/[0.04] border border-white/[0.07] rounded text-xs text-white/60 placeholder:text-white/20 px-2 py-1.5 resize-none focus:outline-none focus:border-white/20 transition-colors leading-relaxed"
        />
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="mt-0.5 flex-shrink-0 text-white/20 hover:text-red-400 transition-colors"
        aria-label="Remove project"
      >
        <Trash2 size={13} />
      </button>
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

  // Debounce refs per item id
  const blurbTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Derived maps
  const selectedProjectIds = new Set(proposalProjects.map((p) => p.project_id));
  const projectIdToProposalProjectId = new Map(
    proposalProjects.map((p) => [p.project_id, p.id])
  );

  // ── Add ──────────────────────────────────────────────────────────────────

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
        {
          id,
          proposal_id: proposalId,
          project_id: projectId,
          section_id: null,
          sort_order: prev.length,
          blurb: null,
          project,
        },
      ]);
    },
    [proposalId, proposalProjects.length, allProjects]
  );

  // ── Remove ───────────────────────────────────────────────────────────────

  const handleRemove = useCallback(async (proposalProjectId: string) => {
    await removeProposalProject(proposalProjectId);
    setProposalProjects((prev) => prev.filter((p) => p.id !== proposalProjectId));
  }, []);

  // ── Blurb change (debounced 800ms) ───────────────────────────────────────

  const handleBlurbChange = useCallback((id: string, blurb: string) => {
    // Optimistic local update is skipped here since textarea is uncontrolled;
    // just debounce the server call.
    if (blurbTimers.current[id]) clearTimeout(blurbTimers.current[id]);
    blurbTimers.current[id] = setTimeout(async () => {
      await updateProposalProjectBlurb(id, blurb);
      setProposalProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, blurb } : p))
      );
    }, 800);
  }, []);

  // ── Drag end ─────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (event: import('@dnd-kit/core').DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setProposalProjects((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === active.id);
        const newIndex = prev.findIndex((p) => p.id === over.id);
        const newOrder = arrayMove(prev, oldIndex, newIndex);

        // Fire-and-forget server sync
        reorderProposalProjects(newOrder.map((p, i) => ({ id: p.id, sort_order: i }))).catch(
          console.error
        );

        return newOrder;
      });
    },
    []
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full">
      {/* Left panel: project browser (55%) */}
      <div className="w-[55%] border-r border-white/[0.06] overflow-y-auto">
        <ProjectBrowser
          projects={allProjects}
          selectedProjectIds={selectedProjectIds}
          onAdd={handleAdd}
          onRemove={handleRemove}
          projectIdToProposalProjectId={projectIdToProposalProjectId}
        />
      </div>

      {/* Right panel: selected / ordered list (45%) */}
      <div className="w-[45%] overflow-y-auto p-4">
        <p className="text-xs font-mono text-white/25 uppercase tracking-widest mb-4">
          Selected ({proposalProjects.length})
        </p>

        {proposalProjects.length === 0 ? (
          <p className="text-xs text-white/25 text-center mt-8">
            Click projects on the left to add them.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={proposalProjects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {proposalProjects.map((item) => (
                  <SortableProjectItem
                    key={item.id}
                    item={item}
                    onBlurbChange={handleBlurbChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
