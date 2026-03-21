'use client';

import React from 'react';
import type { ComputedScene } from '@/types/scripts';

interface Props {
  scenes: ComputedScene[];
  fullBeats: Set<string>;        // beatIds that already have 4 active frames
  onSelect: (beatId: string) => void;
  onClose: () => void;
}

export function StoryboardBeatPicker({ scenes, fullBeats, onSelect, onClose }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 w-64 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-lg overflow-hidden"
    >
      <div className="max-h-72 overflow-y-auto admin-scrollbar">
        {scenes.map((scene, si) => {
          const sceneLabel = `${scene.int_ext}. ${scene.location_name} — ${scene.time_of_day}`;
          return (
            <div key={scene.id ?? si}>
              {/* Scene header */}
              <div className="px-3 py-1.5 text-admin-sm font-medium text-admin-text-muted bg-admin-bg-inset border-b border-admin-border-subtle sticky top-0">
                {scene.sceneNumber}. {sceneLabel}
              </div>
              {/* Beat list */}
              {scene.beats.map((beat, bi) => {
                const isFull = fullBeats.has(beat.id);
                return (
                  <button
                    key={beat.id}
                    disabled={isFull}
                    onClick={() => { onSelect(beat.id); onClose(); }}
                    className={[
                      'w-full text-left px-3 py-2 text-admin-sm transition-colors',
                      isFull
                        ? 'text-admin-text-faint cursor-not-allowed'
                        : 'text-admin-text-primary hover:bg-admin-bg-hover cursor-pointer',
                    ].join(' ')}
                    title={isFull ? 'Beat full (4/4)' : undefined}
                  >
                    Beat {bi + 1}
                    {isFull && <span className="ml-2 text-admin-text-faint">(4/4)</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
