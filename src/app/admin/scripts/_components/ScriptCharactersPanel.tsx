'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { createCharacter, updateCharacter, deleteCharacter } from '@/app/admin/actions';
import type { ScriptCharacterRow, ScriptBeatRow, ScriptCharacterType } from '@/types/scripts';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  characters: ScriptCharacterRow[];
  beats: ScriptBeatRow[];
  onCharactersChange: (chars: ScriptCharacterRow[]) => void;
}

// Rainbow order — smooth hue rotation
const PRESET_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // yellow
  '#4ade80', // green
  '#34d399', // teal
  '#38bdf8', // sky
  '#818cf8', // indigo
  '#a78bfa', // violet
  '#c084fc', // purple
  '#e879f9', // fuchsia
];

const CHARACTER_TYPES: { value: ScriptCharacterType; label: string }[] = [
  { value: 'vo', label: 'VO' },
  { value: 'actor', label: 'Actor' },
  { value: 'animated', label: 'Animated' },
];

/** Count how many beats mention a character via @[Name](id) */
function countMentions(charId: string, beats: ScriptBeatRow[]): number {
  const pattern = `](${charId})`;
  let count = 0;
  for (const beat of beats) {
    if (beat.audio_content.includes(pattern)) count++;
    else if (beat.visual_content.includes(pattern)) count++;
    else if (beat.notes_content.includes(pattern)) count++;
  }
  return count;
}

export function ScriptCharactersPanel({ open, onClose, scriptId, characters, beats, onCharactersChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first character, or clear if deleted
  useEffect(() => {
    if (selectedId && !characters.find(c => c.id === selectedId)) {
      setSelectedId(characters[0]?.id ?? null);
    }
    if (!selectedId && characters.length > 0) {
      setSelectedId(characters[0].id);
    }
  }, [characters, selectedId]);

  const selected = characters.find(c => c.id === selectedId) ?? null;

  // Memoize mention counts
  const mentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const char of characters) {
      counts[char.id] = countMentions(char.id, beats);
    }
    return counts;
  }, [characters, beats]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const color = PRESET_COLORS[characters.length % PRESET_COLORS.length];
      const id = await createCharacter(scriptId, {
        name: 'New Character',
        description: '',
        color,
        sort_order: characters.length,
      });
      const newChar: ScriptCharacterRow = {
        id,
        script_id: scriptId,
        name: 'New Character',
        description: null,
        color,
        character_type: 'actor',
        sort_order: characters.length,
        created_at: new Date().toISOString(),
      };
      onCharactersChange([...characters, newChar]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (charId: string, field: string, value: string) => {
    onCharactersChange(characters.map(c => c.id === charId ? { ...c, [field]: value } : c));
    await updateCharacter(charId, { [field]: value });
  };

  const handleDelete = async (charId: string) => {
    await deleteCharacter(charId);
    onCharactersChange(characters.filter(c => c.id !== charId));
  };

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[620px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Characters</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Character list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            <div className="flex-1 overflow-y-auto admin-scrollbar-auto py-2">
              {characters.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No characters yet.
                </p>
              )}
              {characters.map(char => {
                const isSelected = selectedId === char.id;
                const count = mentionCounts[char.id] ?? 0;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedId(char.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: char.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{char.name}</div>
                      {count > 0 && (
                        <div className="text-[10px] text-admin-text-faint">{count} beat{count !== 1 ? 's' : ''}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detail pane */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar-auto">
            {selected ? (
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <input
                    value={selected.name}
                    onChange={e => handleUpdate(selected.id, 'name', e.target.value)}
                    className="admin-input w-full text-base font-semibold py-2 px-3"
                    placeholder="Character name"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Type</label>
                  <div className="flex items-center gap-1">
                    {CHARACTER_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => handleUpdate(selected.id, 'character_type', t.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selected.character_type === t.value
                            ? 'bg-admin-bg-active text-admin-text-primary'
                            : 'text-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={selected.description ?? ''}
                    onChange={e => handleUpdate(selected.id, 'description', e.target.value)}
                    placeholder="Physical description, voice notes…"
                    rows={4}
                    className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                  />
                </div>

                {/* Color presets — rainbow order */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Color</label>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdate(selected.id, 'color', color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          selected.color === color ? 'border-admin-text-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Mention count */}
                {(mentionCounts[selected.id] ?? 0) > 0 && (
                  <div className="text-xs text-admin-text-faint">
                    Mentioned in {mentionCounts[selected.id]} beat{mentionCounts[selected.id] !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-admin-text-faint">
                {characters.length === 0
                  ? 'Add a character to get started.'
                  : 'Select a character to edit.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer action bar — full width */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex items-center gap-2">
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Character
          </button>
          <div className="flex-1" />
          {selected && (
            <button
              onClick={() => handleDelete(selected.id)}
              className="btn-ghost-danger w-10 h-10"
              title="Delete character"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </PanelDrawer>
  );
}
