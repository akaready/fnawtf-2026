'use client';

import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { CropConfig, ScriptStoryboardFrameRow, StoryboardSlotFrame } from '@/types/scripts';
import { STORYBOARD_LAYOUTS, DEFAULT_CROP_CONFIG, type LayoutDefinition } from './storyboardLayouts';
import { StoryboardLayoutRenderer } from './StoryboardLayoutRenderer';

interface Props {
  frames: ScriptStoryboardFrameRow[];
  draftLayout: string;
  draftSlots: Map<number, string>;
  draftCrops: Map<string, CropConfig>;
  selectedSlot: number;
  onLayoutChange: (layout: string) => void;
  onSlotAssign: (slot: number, frameId: string) => void;
  onSlotClick: (slot: number) => void;
  onReframe: (frameId: string, crop: CropConfig) => void;
}

const LAYOUT_GROUPS = [
  { label: 'Single Frame', count: 1 },
  { label: 'Two Frames',   count: 2 },
  { label: 'Three Frames', count: 3 },
  { label: 'Four Frames',  count: 4 },
].map(g => ({ ...g, layouts: STORYBOARD_LAYOUTS.filter(l => l.slotCount === g.count) }));

export function StoryboardFramesTab({
  frames, draftLayout, draftSlots, draftCrops, selectedSlot, onLayoutChange, onSlotAssign, onSlotClick, onReframe,
}: Props) {
  const activeFrames: StoryboardSlotFrame[] = [];
  draftSlots.forEach((frameId, slot) => {
    const frame = frames.find(f => f.id === frameId);
    if (frame) activeFrames.push({ ...frame, slot });
  });
  activeFrames.sort((a, b) => a.slot - b.slot);

  // Zoom controls for the selected slot's frame
  const selectedFrameId = draftSlots.get(selectedSlot);
  const selectedCrop = selectedFrameId
    ? (draftCrops.get(selectedFrameId) ?? DEFAULT_CROP_CONFIG)
    : null;

  const handleZoom = (delta: number) => {
    if (!selectedFrameId || !selectedCrop) return;
    onReframe(selectedFrameId, {
      ...selectedCrop,
      scale: Math.max(1.0, Math.min(3.0, selectedCrop.scale + delta)),
    });
  };

  const handleResetZoom = () => {
    if (!selectedFrameId || !selectedCrop) return;
    onReframe(selectedFrameId, { ...selectedCrop, scale: 1.0, x: 0.5, y: 0.5 });
  };

  return (
    <div className="flex-1 min-w-0 overflow-y-scroll admin-scrollbar px-6 py-5 space-y-8" style={{ scrollbarGutter: 'stable' }}>
      {/* Stage */}
      <div className="group/stage">
        <StoryboardLayoutRenderer
          layout={draftLayout}
          frames={activeFrames}
          size="stage"
          interactive={true}
          selectedSlot={selectedSlot}
          cropOverrides={draftCrops}
          onReframe={onReframe}
          onSlotDrop={onSlotAssign}
          onSlotClick={onSlotClick}
          gap={8}
          zoomControls={selectedFrameId ? (
            <div className="opacity-0 group-hover/stage:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={handleZoom.bind(null, -0.2)}
                className="w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all"
                title="Zoom out"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={handleResetZoom}
                className="w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all"
                title="Reset zoom &amp; position"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={handleZoom.bind(null, 0.2)}
                className="w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all"
                title="Zoom in"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : undefined}
        />
      </div>

      {/* Layout groups — 2-column grid of quadrants */}
      <div className="grid grid-cols-2 gap-4">
        {LAYOUT_GROUPS.map(group => (
          <div key={group.count}>
            <label className="admin-label">{group.label}</label>
            <div className="flex flex-wrap gap-2">
              {group.layouts.map(def => (
                <button
                  key={def.id}
                  onClick={() => onLayoutChange(def.id)}
                  title={def.label}
                  className={[
                    'flex-shrink-0 rounded-[4px] border transition-colors overflow-hidden',
                    draftLayout === def.id
                      ? 'border-[var(--admin-accent)] bg-admin-bg-active'
                      : 'border-admin-border hover:border-admin-border-strong bg-admin-bg-inset',
                  ].join(' ')}
                  style={{ width: '5rem', aspectRatio: '16/9' }}
                >
                  <LayoutIcon definition={def} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayoutIcon({ definition }: { definition: LayoutDefinition }) {
  return (
    <div
      className="w-full h-full p-0.5"
      style={{
        display: 'grid',
        gridTemplateRows: definition.gridTemplate.split('/')[0].trim(),
        gridTemplateColumns: definition.gridTemplate.split('/')[1].trim(),
        gridTemplateAreas: definition.templateAreas,
        gap: '1px',
      }}
    >
      {definition.gridAreas.map(area => (
        <div
          key={area}
          style={{ gridArea: area }}
          className="bg-admin-text-muted rounded-[2px] opacity-60"
        />
      ))}
    </div>
  );
}
