'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const EMOJI_CATEGORIES = [
  { label: 'Frequently Used', emojis: ['👍', '👎', '❤️', '🔥', '💯', '👀', '🎉', '😂', '😍', '🤔', '👏', '🙌'] },
  { label: 'Smileys', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😎', '🥳', '😏', '😢', '😭', '😤', '🤯', '🥺', '😱', '🤮'] },
  { label: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '💪', '🫡', '🫶', '✋', '👋', '🖖', '🤘'] },
  { label: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💖', '💗', '💘'] },
  { label: 'Objects', emojis: ['🔥', '⭐', '💯', '✅', '❌', '⚡', '💡', '🎯', '🏆', '🎬', '🎥', '📸', '🎵', '🎶'] },
];

export function EmojiPicker({ onSelect, onClose, anchorRef }: { onSelect: (emoji: string) => void; onClose: () => void; anchorRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 240),
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="w-[240px] h-[280px] border border-admin-border rounded-admin-lg shadow-2xl flex flex-col overflow-hidden bg-admin-bg-sidebar"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Search */}
      <div className="px-3 py-2 bg-admin-bg-base flex-shrink-0 border-b border-admin-border">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-admin-sm text-white placeholder:text-admin-text-faint/30 focus:outline-none"
          autoFocus
        />
      </div>
      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto admin-scrollbar px-2 pb-2 bg-admin-bg-hover">
        {EMOJI_CATEGORIES.map(cat => {
          const matchesSearch = !search || cat.label.toLowerCase().includes(search.toLowerCase());
          if (!matchesSearch) return null;
          return (
            <div key={cat.label}>
              <p className="text-[10px] uppercase tracking-wider text-admin-text-faint/50 mt-2 mb-1 px-0.5">{cat.label}</p>
              <div className="grid grid-cols-7 gap-0.5">
                {cat.emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-admin-bg-hover text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
