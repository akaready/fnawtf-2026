'use client';

import { useState, useEffect, useRef } from 'react';
import type { ScriptCharacterRow, ScriptTagRow } from '@/types/scripts';

interface Props {
  type: 'character' | 'tag';
  query: string;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  position: { x: number; y: number };
  onSelect: (item: ScriptCharacterRow | ScriptTagRow) => void;
  onDismiss: () => void;
}

export function MentionDropdown({ type, query, characters, tags, position, onSelect, onDismiss }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = type === 'character'
    ? characters.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : tags.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.slug.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && items.length > 0) {
        e.preventDefault();
        onSelect(items[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [items, selectedIndex, onSelect, onDismiss]);

  if (items.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="fixed z-[200] w-56 max-h-48 overflow-y-auto bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, i) => {
        const isChar = type === 'character';
        const char = isChar ? (item as ScriptCharacterRow) : null;
        const tag = !isChar ? (item as ScriptTagRow) : null;

        return (
          <button
            key={item.id}
            onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              i === selectedIndex
                ? 'bg-admin-bg-active text-admin-text-primary'
                : 'text-admin-text-secondary hover:bg-admin-bg-hover'
            }`}
          >
            {char && (
              <>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: char.color }}
                />
                <span className="truncate">@{char.name}</span>
              </>
            )}
            {tag && (
              <>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">#{tag.name}</span>
                <span className="text-admin-text-faint text-xs ml-auto">{tag.category}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
