'use client';

import React from 'react';
import { ComputedScene } from '@/types/scripts';

interface Props {
  scenes: ComputedScene[];
  fullBeats: Set<string>;        // beatIds already at 4 active frames
  onSelect: (beatId: string) => void;
  onClose: () => void;
}

export function StoryboardBeatPicker({ scenes, fullBeats, onSelect, onClose }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

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
        {scenes.map(scene => {
          const sceneLabel = `${scene.int_ext}. ${scene.location_name} — ${scene.time_of_day}`;
          return (
            <div key={scene.id}>
              <div className="px-3 py-1.5 text-admin-sm font-medium text-admin-text-muted bg-admin-bg-inset border-b border-admin-border-subtle sticky top-0">
                Scene {scene.sceneNumber}: {sceneLabel}
              </div>
              {scene.beats.map((beat, beatIndex) => {
                const isFull = fullBeats.has(beat.id);
                const beatLabel = `Beat ${beatIndex + 1}`;
                return (
                  <button
                    key={beat.id}
                    disabled={isFull}
                    onClick={() => { onSelect(beat.id); onClose(); }}
                    className={[
                      'w-full text-left px-3 py-2 text-admin-sm transition-colors flex items-center justify-between',
                      isFull
                        ? 'text-admin-text-faint cursor-not-allowed'
                        : 'text-admin-text-primary hover:bg-admin-bg-hover cursor-pointer',
                    ].join(' ')}
                    title={isFull ? 'Beat full (4/4)' : undefined}
                  >
                    <span>{beatLabel}</span>
                    {isFull && (
                      <span className="text-admin-text-faint">(4/4)</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        {scenes.length === 0 && (
          <div className="px-3 py-4 text-admin-sm text-admin-text-muted text-center">
            No scenes available
          </div>
        )}
      </div>
    </div>
  );
}
