'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// 15 bright colors in 5 groups of 3 neighboring shades
export const PRESET_COLORS = [
  // warm
  '#f87171', // red         ~0°
  '#fb923c', // orange      ~30°
  '#fbbf24', // amber       ~45°
  // natural
  '#a3e635', // lime        ~80°
  '#4ade80', // green       ~140°
  '#2dd4bf', // teal        ~170°
  // cool
  '#22d3ee', // cyan        ~190°
  '#38bdf8', // sky         ~205°
  '#3b82f6', // blue        ~225°
  // purple
  '#818cf8', // indigo      ~245°
  '#a78bfa', // violet      ~265°
  '#e879f9', // fuchsia     ~295°
  // neutrals
  '#d4d4d4', // light grey
  '#a3a3a3', // mid grey
  '#737373', // dark grey
];

// Popover size: 3 cols × 24px dots + 2 gaps × 12px + 2 × 16px padding
const POPOVER_W = 3 * 24 + 2 * 12 + 2 * 16; // 128px
const POPOVER_H = 5 * 24 + 4 * 12 + 2 * 16; // 200px

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    // Vertical: prefer below, flip above if clipped
    let top: number;
    if (rect.bottom + gap + POPOVER_H > window.innerHeight) {
      top = rect.top - gap - POPOVER_H;
    } else {
      top = rect.bottom + gap;
    }

    // Horizontal: prefer right-aligned to trigger, flip left if clipped
    let left: number;
    if (rect.right - POPOVER_W < 8) {
      left = rect.left;
    } else {
      left = rect.right - POPOVER_W;
    }

    setPos({ top, left });
  }, []);

  // Close on outside click / escape / scroll
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    // Close on any scroll (panels, page, etc.)
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  // Position on open
  useEffect(() => {
    if (open) computePosition();
  }, [open, computePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full border-2 border-admin-border hover:border-admin-text-faint transition-colors flex-shrink-0"
        style={{ backgroundColor: value }}
        title="Pick color"
      />
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed bg-admin-bg-overlay border border-admin-border rounded-admin-lg shadow-xl p-4 z-[9999] animate-dropdown-in"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="grid grid-cols-3 gap-3">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => { onChange(color); setOpen(false); }}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                  value === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-admin-bg-overlay' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
