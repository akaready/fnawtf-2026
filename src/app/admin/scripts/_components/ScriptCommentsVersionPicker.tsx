'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { History } from 'lucide-react';
import type { ScriptShareRow } from '@/types/scripts';
import { versionColor } from '@/types/scripts';

interface Props {
  shares: ScriptShareRow[];
  selectedShareId: string | null;
  currentMajorVersion: number;
  onSelect: (shareId: string) => void;
  /** Render inline (relative) instead of absolute-positioned */
  inline?: boolean;
}

export function ScriptCommentsVersionPicker({
  shares,
  selectedShareId,
  currentMajorVersion,
  onSelect,
  inline = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const loaded = shares.length > 0;
  const selectedShare = shares.find(s => s.id === selectedShareId) ?? null;
  const isHistorical = selectedShare?.snapshot_major_version != null
    && selectedShare.snapshot_major_version !== currentMajorVersion;

  return (
    <div className={inline ? 'relative inline-flex' : 'absolute right-2 top-1/2 -translate-y-1/2'}>
      <button
        onClick={(e) => { if (!loaded) return; e.stopPropagation(); setOpen(o => !o); }}
        disabled={!loaded}
        className={inline
          ? `w-7 h-7 flex items-center justify-center rounded transition-colors ${
              loaded
                ? `text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover ${isHistorical ? 'bg-admin-bg-active text-admin-text-secondary' : ''}`
                : 'text-admin-text-ghost opacity-20 cursor-default'
            }`
          : `p-1 rounded transition-all duration-300 ${
              loaded
                ? `text-admin-cream opacity-40 group-hover/colhdr:opacity-100 hover:bg-admin-bg-hover ${isHistorical ? 'opacity-100' : ''}`
                : 'text-admin-text-ghost opacity-20 cursor-default'
            }`
        }
        title={loaded ? 'Switch version' : 'Loading...'}
      ref={btnRef}
      >
        <History size={14} />
      </button>
      {open && (() => {
        const r = btnRef.current?.getBoundingClientRect();
        const dropdown = (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div
              className="bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[80px]"
              style={inline && r ? { position: 'fixed', top: r.bottom + 4, left: r.right - 80, zIndex: 30 } : { position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 30 }}
            >
            {shares.map(s => {
              const ver = s.snapshot_major_version ?? 0;
              const color = versionColor(ver);
              return (
                <button
                  key={s.id}
                  onClick={(e) => { e.stopPropagation(); onSelect(s.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-admin-sm transition-colors hover:bg-admin-bg-hover ${
                    s.id === selectedShareId
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted'
                  }`}
                >
                  <span
                    className="font-admin-mono font-bold px-2 py-0.5 rounded-full text-xs border"
                    style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}
                  >
                    {ver ? `v${ver}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </>
        );
        return inline ? createPortal(dropdown, document.body) : dropdown;
      })()}
    </div>
  );
}
