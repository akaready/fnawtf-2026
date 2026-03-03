'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, Check } from 'lucide-react';
import type { StoryboardStylePreset } from '@/types/scripts';

interface Props {
  presetKey: StoryboardStylePreset;
  label: string;
  image: string;
  prompt: string;
  isActive: boolean;
  onClick: () => void;
}

export function StylePresetCard({ presetKey: _presetKey, label, image, prompt, isActive, onClick }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <>
      <button
        onClick={onClick}
        className={`relative w-full rounded-admin-md overflow-hidden border-2 transition-colors text-left aspect-video ${
          isActive
            ? 'border-admin-text-primary'
            : 'border-admin-border hover:border-admin-border-subtle'
        }`}
      >
        <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />

        {/* Active checkmark */}
        {isActive && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-admin-text-primary rounded-full flex items-center justify-center z-10">
            <Check size={11} className="text-admin-bg-base" />
          </div>
        )}

        {/* Bottom overlay: title left, info right */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2.5 py-2 bg-gradient-to-t from-black/70 to-transparent z-10">
          <span className="text-xs font-semibold text-white leading-none">{label}</span>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setShowPrompt(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                setShowPrompt(true);
              }
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-colors flex-shrink-0 cursor-pointer"
            title="View style prompt"
          >
            <Info size={10} />
          </div>
        </div>
      </button>

      {/* Prompt popup — portal to avoid clipping */}
      {showPrompt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPrompt(false)}
          />
          <div className="relative bg-admin-bg-overlay border border-admin-border rounded-admin-lg shadow-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-admin-text-faint">
                {label} — Style Prompt
              </span>
              <button
                onClick={() => setShowPrompt(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                <X size={13} />
              </button>
            </div>
            <p className="text-[11px] text-admin-text-secondary leading-relaxed">
              {prompt}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
