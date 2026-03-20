'use client';

import React from 'react';
import { GripVertical, Copy, ArrowRight, Download, Trash2, Check, X } from 'lucide-react';
import type { CropConfig, ScriptStoryboardFrameRow, StoryboardSlotFrame } from '@/types/scripts';
import type { ComputedScene } from '@/types/scripts';
import { STORYBOARD_LAYOUTS, type LayoutDefinition } from './storyboardLayouts';
import { StoryboardLayoutRenderer } from './StoryboardLayoutRenderer';
import { StoryboardBeatPicker } from './StoryboardBeatPicker';
import { ImageActionButton } from '../../_components/ImageActionButton';

interface Props {
  beatId: string;
  scenes: ComputedScene[];
  allScriptFrames: ScriptStoryboardFrameRow[];
  frames: ScriptStoryboardFrameRow[];
  draftLayout: string;
  draftSlots: Map<number, string>;
  draftCrops?: Map<string, CropConfig>;
  onLayoutChange: (layout: string) => void;
  onSlotAssign: (slot: number, frameId: string) => void;
  onReframe: (frameId: string, crop: CropConfig) => void;
  onDuplicate: (frameId: string) => Promise<void>;
  onMoveToBeat: (frameId: string, targetBeatId: string) => Promise<void>;
  onDownload: (frame: ScriptStoryboardFrameRow) => void;
  onDelete: (frameId: string) => Promise<void>;
}

export function StoryboardFramesTab({
  beatId,
  scenes,
  allScriptFrames,
  frames,
  draftLayout,
  draftSlots,
  onLayoutChange,
  onSlotAssign,
  onReframe,
  onDuplicate,
  onMoveToBeat,
  onDownload,
  onDelete,
}: Props) {
  // Derive active slot frames from draftSlots
  const activeFrames: StoryboardSlotFrame[] = [];
  draftSlots.forEach((frameId, slot) => {
    const frame = frames.find(f => f.id === frameId);
    if (frame) activeFrames.push({ ...frame, slot });
  });
  activeFrames.sort((a, b) => a.slot - b.slot);

  // Compute fullBeats (beats at capacity) for beat picker
  const fullBeats = React.useMemo(() => {
    const countByBeat = new Map<string, number>();
    allScriptFrames.forEach(f => {
      if (f.slot !== null && f.beat_id !== null && f.beat_id !== beatId) {
        countByBeat.set(f.beat_id, (countByBeat.get(f.beat_id) ?? 0) + 1);
      }
    });
    const full = new Set<string>();
    countByBeat.forEach((count, bid) => { if (count >= 4) full.add(bid); });
    return full;
  }, [allScriptFrames, beatId]);

  return (
    <div className="flex gap-4 p-4 h-full overflow-hidden">
      {/* Stage + carousel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <StoryboardLayoutRenderer
            layout={draftLayout}
            frames={activeFrames}
            size="stage"
            interactive={true}
            onReframe={onReframe}
            onSlotDrop={onSlotAssign}
          />
        </div>
        {/* Layouts carousel */}
        <LayoutsCarousel current={draftLayout} onChange={onLayoutChange} />
      </div>

      {/* Sidebar */}
      <div className="w-44 flex-shrink-0 overflow-y-auto admin-scrollbar space-y-2">
        {frames.map(frame => {
          const slotEntry = [...draftSlots.entries()].find(([, id]) => id === frame.id);
          return (
            <FrameSidebarItem
              key={frame.id}
              frame={frame}
              isActive={slotEntry !== undefined}
              slotNumber={slotEntry?.[0]}
              scenes={scenes}
              fullBeats={fullBeats}
              onDuplicate={() => onDuplicate(frame.id)}
              onMoveToBeat={(targetId) => onMoveToBeat(frame.id, targetId)}
              onDownload={() => onDownload(frame)}
              onDelete={() => onDelete(frame.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── LayoutsCarousel ──────────────────────────────────────────────────────────

function LayoutsCarousel({ current, onChange }: { current: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0 admin-scrollbar-auto">
      {STORYBOARD_LAYOUTS.map(def => (
        <button
          key={def.id}
          type="button"
          onClick={() => onChange(def.id)}
          title={def.label}
          className={[
            'flex-shrink-0 w-16 h-9 rounded-admin-sm border transition-colors overflow-hidden',
            current === def.id
              ? 'border-admin-info bg-admin-info/10'
              : 'border-admin-border hover:border-admin-border-strong bg-admin-bg-inset',
          ].join(' ')}
        >
          <LayoutIcon definition={def} />
        </button>
      ))}
    </div>
  );
}

function LayoutIcon({ definition }: { definition: LayoutDefinition }) {
  return (
    <div
      className="w-full h-full p-1"
      style={{
        display: 'grid',
        gridTemplate: definition.gridTemplate,
        gridTemplateAreas: definition.templateAreas,
        gap: '1px',
      }}
    >
      {definition.gridAreas.map(area => (
        <div key={area} style={{ gridArea: area }} className="bg-admin-text-muted rounded-[1px] opacity-60" />
      ))}
    </div>
  );
}

// ── FrameSidebarItem ─────────────────────────────────────────────────────────

function FrameSidebarItem({
  frame,
  isActive,
  slotNumber,
  scenes,
  fullBeats,
  onDuplicate,
  onMoveToBeat,
  onDownload,
  onDelete,
}: {
  frame: ScriptStoryboardFrameRow;
  isActive: boolean;
  slotNumber: number | undefined;
  scenes: ComputedScene[];
  fullBeats: Set<string>;
  onDuplicate: () => void;
  onMoveToBeat: (targetBeatId: string) => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [showBeatPicker, setShowBeatPicker] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-frame-id', frame.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="group/frame relative" draggable onDragStart={handleDragStart}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-admin-sm bg-admin-bg-inset">
        {frame.image_url && (
          <img src={frame.image_url} className="w-full h-full object-cover" alt="" draggable={false} />
        )}
        {isActive && slotNumber !== undefined && (
          <span className="absolute top-1 right-1 text-[10px] leading-none bg-admin-info text-white rounded px-1 py-0.5">
            {slotNumber}
          </span>
        )}
        <div className="absolute top-1 left-1 opacity-0 group-hover/frame:opacity-100 transition-opacity cursor-grab">
          <GripVertical size={14} className="text-white drop-shadow" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5 mt-1 opacity-0 group-hover/frame:opacity-100 transition-opacity">
        <ImageActionButton icon={Copy} color="info" title="Duplicate" onClick={onDuplicate} variant="row" />
        <div className="relative">
          <ImageActionButton
            icon={ArrowRight}
            color="info"
            title="Move to beat…"
            onClick={() => setShowBeatPicker(v => !v)}
            variant="row"
          />
          {showBeatPicker && (
            <StoryboardBeatPicker
              scenes={scenes}
              fullBeats={fullBeats}
              onSelect={(targetBeatId) => { onMoveToBeat(targetBeatId); setShowBeatPicker(false); }}
              onClose={() => setShowBeatPicker(false)}
            />
          )}
        </div>
        <ImageActionButton icon={Download} color="info" title="Download" onClick={onDownload} variant="row" />
        {confirmDelete ? (
          <>
            <ImageActionButton
              icon={Check}
              color="danger"
              title="Confirm delete"
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              variant="row"
            />
            <ImageActionButton
              icon={X}
              color="neutral"
              title="Cancel"
              onClick={() => setConfirmDelete(false)}
              variant="row"
            />
          </>
        ) : (
          <ImageActionButton
            icon={Trash2}
            color="danger"
            title="Delete"
            onClick={() => setConfirmDelete(true)}
            variant="row"
          />
        )}
      </div>
    </div>
  );
}
