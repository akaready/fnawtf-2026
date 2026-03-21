'use client';

import React from 'react';
import { LayoutGrid } from 'lucide-react';
import type { CropConfig, StoryboardSlotFrame } from '@/types/scripts';
import { getLayout, DEFAULT_CROP_CONFIG } from './storyboardLayouts';

interface Props {
  layout: string | null;
  frames: StoryboardSlotFrame[];           // already sorted by slot asc
  size: 'cell' | 'stage' | 'full';
  interactive?: boolean;                   // enable reframe drag (stage only)
  selectedSlot?: number;                   // which slot to overlay zoomControls on
  cropOverrides?: Map<string, CropConfig>; // external crop state (from zoom buttons)
  onReframe?: (frameId: string, crop: CropConfig) => void;
  /** Called when a frame is dragged from the sidebar and dropped on a slot */
  onSlotDrop?: (slot: number, frameId: string) => void;
  onSlotClick?: (slot: number) => void;
  gap?: number;                            // gap between panels in px, default 4
  /** Overlay rendered inside the selected slot (e.g. zoom controls) */
  zoomControls?: React.ReactNode;
}

export function StoryboardLayoutRenderer({
  layout,
  frames,
  size,
  interactive = false,
  selectedSlot,
  cropOverrides,
  onReframe,
  onSlotDrop,
  onSlotClick,
  gap = 4,
  zoomControls,
}: Props) {
  const def = getLayout(layout);
  const slotMap = new Map<number, StoryboardSlotFrame>();
  frames.forEach(f => slotMap.set(f.slot, f));

  return (
    <div
      className="w-full"
      style={{
        aspectRatio: '16/9',
        display: 'grid',
        gridTemplateRows: def.gridTemplate.split('/')[0].trim(),
        gridTemplateColumns: def.gridTemplate.split('/')[1].trim(),
        gridTemplateAreas: def.templateAreas,
        gap: `${gap}px`,
      }}
    >
      {def.gridAreas.map((area, idx) => {
        const slot = idx + 1;
        const frame = slotMap.get(slot) ?? null;
        return (
          <SlotPanel
            key={`${def.id}-${area}`}
            area={area}
            slot={slot}
            frame={frame}
            size={size}
            interactive={interactive}
            selectedSlot={selectedSlot}
            cropOverride={frame ? cropOverrides?.get(frame.id) : undefined}
            onReframe={onReframe}
            onSlotDrop={onSlotDrop}
            onSlotClick={onSlotClick}
            zoomControls={slot === selectedSlot ? zoomControls : undefined}
          />
        );
      })}
    </div>
  );
}

// ── SlotPanel ────────────────────────────────────────────────────────────────

function SlotPanel({
  area, slot, frame, size, interactive, selectedSlot, cropOverride, onReframe, onSlotDrop, onSlotClick, zoomControls,
}: {
  area: string;
  slot: number;
  frame: StoryboardSlotFrame | null;
  size: 'cell' | 'stage' | 'full';
  interactive: boolean;
  selectedSlot?: number;
  cropOverride?: CropConfig;
  onReframe?: (frameId: string, crop: CropConfig) => void;
  onSlotDrop?: (slot: number, frameId: string) => void;
  onSlotClick?: (slot: number) => void;
  zoomControls?: React.ReactNode;
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div
      style={{
        gridArea: area,
        outline: size !== 'cell'
          ? (isDragOver || slot === selectedSlot
            ? '3px solid var(--admin-accent)'
            : !frame ? '3px dashed var(--admin-border)' : 'none')
          : 'none',
        outlineOffset: '-1px',
      }}
      className={[
        'relative overflow-hidden',
        size === 'cell' ? 'rounded' : 'rounded-admin-md',
        onSlotClick && size !== 'cell' ? 'cursor-pointer' : '',
      ].join(' ')}
      onDragOver={e => { if (onSlotDrop) { e.preventDefault(); setIsDragOver(true); } }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        setIsDragOver(false);
        const frameId = e.dataTransfer.getData('application/x-frame-id');
        if (frameId && onSlotDrop) { e.preventDefault(); onSlotDrop(slot, frameId); }
      }}
      onClick={() => { if (onSlotClick) onSlotClick(slot); }}
    >
      {frame
        ? <FrameImage frame={frame} interactive={interactive} cropOverride={cropOverride} onReframe={onReframe} />
        : <EmptySlot size={size} />
      }
      {zoomControls && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 pointer-events-auto">
            {zoomControls}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FrameImage ───────────────────────────────────────────────────────────────

function FrameImage({
  frame, interactive, cropOverride, onReframe,
}: {
  frame: StoryboardSlotFrame;
  interactive: boolean;
  cropOverride?: CropConfig;
  onReframe?: (frameId: string, crop: CropConfig) => void;
}) {
  const cropRef = React.useRef<CropConfig>(frame.crop_config ?? DEFAULT_CROP_CONFIG);
  const [crop, setCrop] = React.useState<CropConfig>(frame.crop_config ?? DEFAULT_CROP_CONFIG);
  const dragRef = React.useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Keep cropRef in sync with crop state so event handlers always see current value
  React.useEffect(() => { cropRef.current = crop; }, [crop]);

  // Sync from external zoom/reset buttons
  React.useEffect(() => {
    if (cropOverride) { setCrop(cropOverride); }
  }, [cropOverride]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    dragRef.current = { mx: e.clientX, my: e.clientY, cx: cropRef.current.x, cy: cropRef.current.y };
  };

  React.useEffect(() => {
    if (!interactive) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragRef.current.mx) / rect.width;
      const dy = (e.clientY - dragRef.current.my) / rect.height;
      let nx = Math.max(0, Math.min(1, dragRef.current.cx - dx));
      let ny = Math.max(0, Math.min(1, dragRef.current.cy - dy));
      // Snap to center and rule-of-thirds
      [0.33, 0.5, 0.67].forEach(s => {
        if (Math.abs(nx - s) < 0.03) nx = s;
        if (Math.abs(ny - s) < 0.03) ny = s;
      });
      const next = { ...cropRef.current, x: nx, y: ny };
      setCrop(next);
      onReframe?.(frame.id, next);
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [interactive, frame.id, onReframe]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onMouseDown={handleMouseDown}
      style={{ cursor: interactive ? 'grab' : 'inherit' }}
    >
      {/* Image is centered and covers the slot. objectPosition drives panning so
          the full original image is always available — no blank edges on pan. */}
      <img
        src={frame.image_url}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${crop.x * 100}% ${crop.y * 100}%`,
          transform: `scale(${crop.scale})`,
          transformOrigin: `${crop.x * 100}% ${crop.y * 100}%`,
        }}
        alt=""
        draggable={false}
      />
    </div>
  );
}

// ── EmptySlot ────────────────────────────────────────────────────────────────

function EmptySlot({ size }: { size: 'cell' | 'stage' | 'full' }) {
  if (size === 'cell') return <div className="w-full h-full bg-admin-bg-inset" />;
  return (
    <div className="w-full h-full flex items-center justify-center text-admin-text-faint bg-admin-bg-inset">
      <div className="text-center">
        <LayoutGrid size={36} className="mx-auto mb-3 opacity-40" />
        <p className="text-admin-sm">Drop a frame here.</p>
      </div>
    </div>
  );
}
