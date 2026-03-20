'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { CropConfig, StoryboardSlotFrame } from '@/types/scripts';
import { getLayout, DEFAULT_CROP_CONFIG } from './storyboardLayouts';

interface Props {
  layout: string | null;
  frames: StoryboardSlotFrame[];
  size: 'cell' | 'stage' | 'full';
  interactive?: boolean;
  onReframe?: (frameId: string, crop: CropConfig) => void;
  onSlotDrop?: (slot: number, frameId: string) => void;
  onSlotClick?: (slot: number) => void;
  gap?: number;
}

export function StoryboardLayoutRenderer({
  layout, frames, size, interactive = false,
  onReframe, onSlotDrop, onSlotClick, gap = 4,
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
        gridTemplate: def.gridTemplate,
        gridTemplateAreas: def.templateAreas,
        gap: `${gap}px`,
      }}
    >
      {def.gridAreas.map((area, idx) => {
        const slot = idx + 1;
        return (
          <SlotPanel
            key={area}
            area={area}
            slot={slot}
            frame={slotMap.get(slot) ?? null}
            size={size}
            interactive={interactive}
            onReframe={onReframe}
            onSlotDrop={onSlotDrop}
            onSlotClick={onSlotClick}
          />
        );
      })}
    </div>
  );
}

function SlotPanel({
  area, slot, frame, size, interactive, onReframe, onSlotDrop, onSlotClick,
}: {
  area: string;
  slot: number;
  frame: StoryboardSlotFrame | null;
  size: 'cell' | 'stage' | 'full';
  interactive: boolean;
  onReframe?: (frameId: string, crop: CropConfig) => void;
  onSlotDrop?: (slot: number, frameId: string) => void;
  onSlotClick?: (slot: number) => void;
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div
      style={{ gridArea: area }}
      className={[
        'relative overflow-hidden rounded-admin-lg',
        isDragOver ? 'ring-2 ring-admin-info' : '',
      ].join(' ')}
      onDragOver={e => { if (onSlotDrop) { e.preventDefault(); setIsDragOver(true); } }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        setIsDragOver(false);
        const frameId = e.dataTransfer.getData('application/x-frame-id');
        if (frameId && onSlotDrop) { e.preventDefault(); onSlotDrop(slot, frameId); }
      }}
      onClick={() => onSlotClick?.(slot)}
    >
      {frame
        ? <FrameImage frame={frame} interactive={interactive} onReframe={onReframe} />
        : <EmptySlot size={size} />
      }
    </div>
  );
}

function FrameImage({
  frame, interactive, onReframe,
}: {
  frame: StoryboardSlotFrame;
  interactive: boolean;
  onReframe?: (frameId: string, crop: CropConfig) => void;
}) {
  const [crop, setCrop] = React.useState<CropConfig>(frame.crop_config ?? DEFAULT_CROP_CONFIG);
  const cropRef = React.useRef<CropConfig>(crop);
  cropRef.current = crop;
  const dragRef = React.useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    dragRef.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y };
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
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [interactive, frame.id, onReframe]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const next = { ...crop, scale: Math.max(1.0, Math.min(3.0, crop.scale - e.deltaY * 0.001)) };
    setCrop(next);
    onReframe?.(frame.id, next);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: interactive ? 'grab' : 'default' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${crop.scale}) translate(${(0.5 - crop.x) * 100}%, ${(0.5 - crop.y) * 100}%)`,
          transformOrigin: 'center center',
        }}
      >
        <img src={frame.image_url} className="w-full h-full object-cover" alt="" draggable={false} />
      </div>
    </div>
  );
}

function EmptySlot({ size }: { size: 'cell' | 'stage' | 'full' }) {
  if (size === 'cell') return <div className="w-full h-full bg-admin-bg-inset" />;
  return (
    <div className="w-full h-full flex items-center justify-center text-admin-text-faint border-2 border-dashed border-admin-border rounded-admin-lg">
      <Plus size={size === 'stage' ? 20 : 32} />
    </div>
  );
}
