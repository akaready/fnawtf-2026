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
}

interface Props {
  scenes: Scene[];
  activeSceneId: string;
  onJumpToScene: (sceneId: string) => void;
}

export function SceneBottomSheet({ scenes, activeSceneId, onJumpToScene }: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (sceneId: string) => {
    onJumpToScene(sceneId);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-colors"
        title="Scenes"
      >
        <List size={16} />
      </button>

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
        <div className="bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl max-h-[60vh] flex flex-col">
          {/* Handle + header */}
          <div className="flex flex-col items-center pt-3 pb-2 px-4 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Scenes ({scenes.length})
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scene list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 grid grid-cols-[auto_1fr] content-start">
            {scenes.map(scene => {
              const isActive = scene.id === activeSceneId;
              return (
                <SceneListItem
                  key={scene.id}
                  sceneNumber={scene.sceneNumber}
                  slug={`${scene.int_ext}. ${scene.location_name || '\u2014'}${scene.time_of_day ? ` \u2014 ${scene.time_of_day}` : ''}`}
                  description={scene.scene_description}
                  isActive={isActive}
                  onClick={() => handleSelect(scene.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
