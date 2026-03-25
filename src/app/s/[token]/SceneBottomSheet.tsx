'use client';

import { useState } from 'react';
import { List, X } from 'lucide-react';
import { SceneListItem } from '@/app/admin/scripts/_components/SceneListItem';

interface Scene {
  id: string;
  sceneNumber: number;
  location_name: string;
  int_ext: string;
  time_of_day: string;
  scene_description: string | null;
  beats?: { id: string; sort_order: number }[];
}

interface Props {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  activeBeatId?: string | null;
  onSelectBeat?: (beatId: string) => void;
  /** When provided, hides the built-in trigger and uses external open state */
  externalOpen?: boolean;
  onClose?: () => void;
}

export function SceneBottomSheet({ scenes, activeSceneId, onSelectScene, activeBeatId, onSelectBeat, externalOpen, onClose }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (externalOpen !== undefined) { if (!v && onClose) onClose(); }
    else setInternalOpen(v);
  };

  const handleSelect = (sceneId: string) => {
    onSelectScene(sceneId);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button — hidden when externally controlled */}
      {externalOpen === undefined && (
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-admin-md bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-colors"
          title="Scenes"
        >
          <List size={16} />
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[61] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-[#111111] border-t border-admin-border-subtle rounded-t-2xl max-h-[70vh] flex flex-col">
          {/* Handle + header */}
          <div className="flex flex-col items-center pt-4 pb-3 px-5 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/10 mb-4" />
            <div className="flex items-center justify-between w-full">
              <span className="text-admin-sm font-semibold uppercase tracking-widest text-admin-text-faint">
                Scenes
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-admin-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scene list */}
          <div className="flex-1 overflow-y-auto flex flex-col border-t border-admin-border-subtle">
            {scenes.map(scene => {
              const beatNavItems = (scene.beats ?? []).length >= 2
                ? [...scene.beats!]
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((beat, i) => ({
                      beatId: beat.id,
                      label: String.fromCharCode(65 + i),
                      isActive: beat.id === activeBeatId,
                      onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        onSelectBeat?.(beat.id);
                        setOpen(false);
                      },
                    }))
                : undefined;

              return (
                <SceneListItem
                  key={scene.id}
                  sceneNumber={scene.sceneNumber}
                  slug={`${scene.int_ext}. ${scene.location_name || '\u2014'}${scene.time_of_day ? ` \u2014 ${scene.time_of_day}` : ''}`}
                  description={scene.scene_description}
                  isActive={scene.id === activeSceneId}
                  onClick={() => handleSelect(scene.id)}
                  beats={beatNavItems}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
