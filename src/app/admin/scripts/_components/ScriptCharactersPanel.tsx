'use client';

import { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { Plus, Trash2, Loader2, X, UserCircle, RefreshCw, Pencil, Sparkles, Check } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
// @dnd-kit/utilities CSS removed — using raw translate3d to avoid scale distortion
import { createClient } from '@/lib/supabase/client';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { SaveButton } from '@/app/admin/_components/SaveButton';
import {
  createCharacter, updateCharacter, deleteCharacter,
  getContactsWithHeadshots,
  assignCastMember, removeCastMember,
  updateCastAppearancePrompt, reorderCastMembers,
} from '@/app/admin/actions';
import type { ScriptCharacterRow, ScriptBeatRow, ScriptCharacterType, CharacterCastWithContact } from '@/types/scripts';
import type { ContactRow } from '@/types/proposal';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptId: string;
  characters: ScriptCharacterRow[];
  beats: ScriptBeatRow[];
  onCharactersChange: (chars: ScriptCharacterRow[]) => void;
  castMap: Record<string, CharacterCastWithContact[]>;
  onCastMapChange: (map: Record<string, CharacterCastWithContact[]>) => void;
}

// Rainbow order — smooth hue rotation
const PRESET_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#4ade80', '#34d399',
  '#38bdf8', '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
];

const CHARACTER_TYPES: { value: ScriptCharacterType; label: string }[] = [
  { value: 'actor', label: 'OS' },
  { value: 'vo', label: 'VO' },
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

// ── Sortable Cast Row ────────────────────────────────────────────────────

function SortableCastRow({
  cast,
  isFeatured,
  isExtracting,
  editingAppearanceId,
  appearanceDraft,
  onAppearanceDraftChange,
  onStartEditAppearance,
  onCancelEditAppearance,
  onSaveAppearance,
  onRemove,
  onGenerate,
}: {
  cast: CharacterCastWithContact;
  isFeatured: boolean;
  isExtracting: boolean;
  editingAppearanceId: string | null;
  appearanceDraft: string;
  onAppearanceDraftChange: (v: string) => void;
  onStartEditAppearance: (castId: string, text: string) => void;
  onCancelEditAppearance: () => void;
  onSaveAppearance: (castId: string) => void;
  onRemove: (castId: string) => void;
  onGenerate: (cast: CharacterCastWithContact) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cast.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };
  const isEditingThis = editingAppearanceId === cast.id;
  const hasHeadshot = cast.contact.headshot_url || (cast.contact.all_headshot_urls?.length ?? 0) > 0;
  const descriptionText = cast.appearance_prompt || cast.contact.appearance_prompt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group/cast rounded-admin-md transition-colors cursor-grab active:cursor-grabbing ${
        isFeatured
          ? 'bg-admin-warning/10 border border-admin-warning/20'
          : 'hover:bg-admin-bg-hover'
      }`}
    >
      <div className="px-3 py-2.5 space-y-1">
        {/* Top row: headshot + name + ALL hover actions */}
        <div className="flex items-center gap-3">
          {cast.contact.headshot_url ? (
            <img
              src={cast.contact.headshot_url}
              alt=""
              className="w-10 h-10 rounded-admin-sm object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-admin-sm bg-admin-bg-inset flex items-center justify-center flex-shrink-0">
              <UserCircle size={20} className="text-admin-text-ghost" />
            </div>
          )}
          <div className="text-base font-semibold text-admin-text-primary truncate flex-1 min-w-0">
            {cast.contact.first_name} {cast.contact.last_name}
          </div>
          {/* ALL actions in one row on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/cast:opacity-100 transition-opacity flex-shrink-0">
            {descriptionText && !isExtracting && !isEditingThis && (
              <button
                onClick={() => onStartEditAppearance(cast.id, descriptionText)}
                className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                title="Edit description"
              >
                <Pencil size={12} />
              </button>
            )}
            {hasHeadshot && !isExtracting && (
              <button
                onClick={() => onGenerate(cast)}
                className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-info hover:bg-admin-bg-hover transition-colors"
                title={descriptionText ? 'Regenerate appearance' : 'Generate appearance'}
              >
                {descriptionText ? <RefreshCw size={12} /> : <Sparkles size={12} />}
              </button>
            )}
            <button
              onClick={() => onRemove(cast.id)}
              className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Description — full width, no buttons here */}
        {isExtracting ? (
          <div className="flex items-center gap-1.5 text-xs text-admin-text-faint">
            <Loader2 size={11} className="animate-spin" />
            Generating appearance…
          </div>
        ) : isEditingThis ? (
          <div className="space-y-1.5">
            <textarea
              value={appearanceDraft}
              onChange={e => onAppearanceDraftChange(e.target.value)}
              rows={6}
              className="admin-input w-full text-xs resize-none py-2 px-2.5 leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <button onClick={() => onSaveAppearance(cast.id)} className="btn-primary px-4 py-2 text-xs">Save</button>
              <button onClick={onCancelEditAppearance} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
            </div>
          </div>
        ) : descriptionText ? (
          <p className="text-xs text-admin-text-muted leading-relaxed line-clamp-3">
            {descriptionText}
          </p>
        ) : hasHeadshot ? (
          <button
            onClick={() => onGenerate(cast)}
            className="text-xs text-admin-text-ghost italic hover:text-admin-info transition-colors"
          >
            Generate description…
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Cast Picker ──────────────────────────────────────────────────────────

type CastContact = ContactRow & { featured_headshot_url: string | null };

function CastPickerPopover({
  onSelect,
  onClose,
  assignedContactIds,
}: {
  onSelect: (contact: CastContact) => void;
  onClose: () => void;
  assignedContactIds: Set<string>;
}) {
  const [contacts, setContacts] = useState<CastContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getContactsWithHeadshots().then(all => {
      setContacts(all.filter(c => c.type === 'cast') as CastContact[]);
      setLoading(false);
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const filtered = search
    ? contacts.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()),
      )
    : contacts;

  return (
    <div
      ref={popoverRef}
      className="w-full bg-admin-bg-overlay border border-admin-border rounded-admin-lg shadow-xl overflow-hidden"
    >
      <div className="p-2 border-b border-admin-border-subtle">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search cast…"
          className="admin-input w-full text-xs py-1.5 px-2.5"
        />
      </div>
      <div className="max-h-[200px] overflow-y-auto admin-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={14} className="animate-spin text-admin-text-faint" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-admin-text-faint text-center py-4">No cast members found.</p>
        ) : (
          filtered.map(c => {
            const assigned = assignedContactIds.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => !assigned && onSelect(c)}
                disabled={assigned}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                  assigned
                    ? 'opacity-40 cursor-default'
                    : 'hover:bg-admin-bg-hover'
                }`}
              >
                {c.featured_headshot_url ? (
                  <img
                    src={c.featured_headshot_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-admin-bg-inset flex items-center justify-center flex-shrink-0">
                    <UserCircle size={16} className="text-admin-text-ghost" />
                  </div>
                )}
                <span className="text-sm text-admin-text-primary">
                  {c.first_name} {c.last_name}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

export function ScriptCharactersPanel({
  open, onClose, scriptId, characters, beats, onCharactersChange,
  castMap, onCastMapChange,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editingAppearanceId, setEditingAppearanceId] = useState<string | null>(null);
  const [appearanceDraft, setAppearanceDraft] = useState('');
  const [extractingCastId, setExtractingCastId] = useState<string | null>(null);

  // ── Draft state (buffered until Save) ───────────────────────────────
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [draftType, setDraftType] = useState<ScriptCharacterType>('actor');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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
  const selectedCast = selected ? (castMap[selected.id] ?? []) : [];

  // Sync draft from selected character
  useEffect(() => {
    if (selected) {
      setDraftName(selected.name);
      setDraftDescription(selected.description ?? '');
      setDraftColor(selected.color);
      setDraftType(selected.character_type === 'animated' ? 'actor' : selected.character_type);
      setConfirmDelete(false);
      setEditingAppearanceId(null);
      setShowPicker(false);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dirty detection
  const isDirty = useMemo(() => {
    if (!selected) return false;
    return (
      draftName !== selected.name ||
      draftDescription !== (selected.description ?? '') ||
      draftColor !== selected.color ||
      draftType !== (selected.character_type === 'animated' ? 'actor' : selected.character_type)
    );
  }, [draftName, draftDescription, draftColor, draftType, selected]);

  // Close guard
  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleDiscard = useCallback(() => {
    if (selected) {
      setDraftName(selected.name);
      setDraftDescription(selected.description ?? '');
      setDraftColor(selected.color);
      setDraftType(selected.character_type === 'animated' ? 'actor' : selected.character_type);
    }
    setConfirmClose(false);
    onClose();
  }, [selected, onClose]);

  // Save all draft fields for selected character
  const handleSave = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updates = {
        name: draftName,
        description: draftDescription || null,
        color: draftColor,
        character_type: draftType,
      };
      await updateCharacter(selected.id, updates);
      onCharactersChange(characters.map(c =>
        c.id === selected.id ? { ...c, ...updates, description: draftDescription || null } : c,
      ));
      onClose();
    } finally {
      setSaving(false);
    }
  }, [selected, draftName, draftDescription, draftColor, draftType, characters, onCharactersChange, onClose]);

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
        max_cast_slots: 3,
        created_at: new Date().toISOString(),
      };
      onCharactersChange([...characters, newChar]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteCharacter(selected.id);
      onCharactersChange(characters.filter(c => c.id !== selected.id));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }, [selected, characters, onCharactersChange]);

  // ── Cast handlers ───────────────────────────────────────────────────

  const castMapRef = useRef(castMap);
  castMapRef.current = castMap;

  const extractAppearance = useCallback(async (
    castEntry: CharacterCastWithContact,
    characterId: string,
  ) => {
    const urls = castEntry.contact.all_headshot_urls?.length
      ? castEntry.contact.all_headshot_urls
      : castEntry.contact.headshot_url ? [castEntry.contact.headshot_url] : [];
    if (urls.length === 0) return;

    setExtractingCastId(castEntry.id);
    try {
      const res = await fetch('/api/admin/cast-appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headshotUrls: urls }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Appearance extraction failed:', err);
        return;
      }
      const { appearancePrompt } = await res.json();
      await updateCastAppearancePrompt(castEntry.id, appearancePrompt);
      // Always read latest castMap from ref to avoid stale closures
      const latestCast = castMapRef.current[characterId] ?? [];
      const updated = latestCast.map(c =>
        c.id === castEntry.id ? { ...c, appearance_prompt: appearancePrompt } : c,
      );
      onCastMapChange({ ...castMapRef.current, [characterId]: updated });
    } catch (err) {
      console.error('Appearance extraction error:', err);
    } finally {
      setExtractingCastId(null);
    }
  }, [onCastMapChange]);

  const handleAssignCast = useCallback(async (contact: CastContact) => {
    if (!selected) return;
    setShowPicker(false);

    const castId = await assignCastMember(selected.id, contact.id);
    const isFirst = selectedCast.length === 0;

    // Fetch fresh appearance_prompt from contacts table (picker cache may be stale)
    const supabase = createClient();
    const { data: freshContact } = await supabase
      .from('contacts')
      .select('appearance_prompt')
      .eq('id', contact.id)
      .single() as { data: { appearance_prompt: string | null } | null };
    const freshAppearance = freshContact?.appearance_prompt ?? null;

    const newEntry: CharacterCastWithContact = {
      id: castId,
      character_id: selected.id,
      contact_id: contact.id,
      slot_order: selectedCast.length,
      is_featured: isFirst,
      appearance_prompt: freshAppearance,
      created_at: new Date().toISOString(),
      contact: {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        headshot_url: contact.featured_headshot_url,
        all_headshot_urls: contact.featured_headshot_url ? [contact.featured_headshot_url] : [],
        appearance_prompt: freshAppearance,
      },
    };

    const updated = [...selectedCast, newEntry];
    onCastMapChange({ ...castMap, [selected.id]: updated });

    // Auto-extract appearance only if contact doesn't already have one
    if (!freshAppearance && (newEntry.contact.all_headshot_urls.length > 0 || newEntry.contact.headshot_url)) {
      extractAppearance(newEntry, selected.id);
    }
  }, [selected, selectedCast, castMap, onCastMapChange, extractAppearance]);

  const handleRemoveCast = useCallback(async (castId: string) => {
    if (!selected) return;
    await removeCastMember(castId);
    const updated = selectedCast.filter(c => c.id !== castId);
    onCastMapChange({ ...castMap, [selected.id]: updated });
  }, [selected, selectedCast, castMap, onCastMapChange]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!selected) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedCast.findIndex(c => c.id === active.id);
    const newIndex = selectedCast.findIndex(c => c.id === over.id);
    const reordered = arrayMove(selectedCast, oldIndex, newIndex).map((c, i) => ({
      ...c,
      slot_order: i,
      is_featured: i === 0,
    }));

    onCastMapChange({ ...castMap, [selected.id]: reordered });
    await reorderCastMembers(selected.id, reordered.map(c => c.id));
  }, [selected, selectedCast, castMap, onCastMapChange]);

  const handleSaveAppearance = useCallback(async (castId: string) => {
    if (!selected) return;
    await updateCastAppearancePrompt(castId, appearanceDraft);
    const updated = selectedCast.map(c =>
      c.id === castId ? { ...c, appearance_prompt: appearanceDraft } : c,
    );
    onCastMapChange({ ...castMap, [selected.id]: updated });
    setEditingAppearanceId(null);
  }, [selected, appearanceDraft, selectedCast, castMap, onCastMapChange]);

  const assignedContactIds = useMemo(
    () => new Set(selectedCast.map(c => c.contact_id)),
    [selectedCast],
  );

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[620px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight">Characters</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Character list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            <div className="flex-1 overflow-y-auto admin-scrollbar py-2">
              {characters.length === 0 && (
                <p className="text-xs text-admin-text-faint text-center py-6 px-3">
                  No characters yet.
                </p>
              )}
              {characters.map(char => {
                const isSelected = selectedId === char.id;
                const count = mentionCounts[char.id] ?? 0;
                const charCast = castMap[char.id] ?? [];
                const featured = charCast.find(c => c.is_featured);
                return (
                  <button
                    key={char.id}
                    onClick={() => {
                      if (isDirty && selectedId !== char.id) {
                        handleSave().then(() => setSelectedId(char.id));
                        return;
                      }
                      setSelectedId(char.id);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    {featured?.contact.headshot_url ? (
                      <img
                        src={featured.contact.headshot_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        style={{ boxShadow: `0 0 0 2px ${char.color}` }}
                      />
                    ) : (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: char.color }}
                      />
                    )}
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
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar">
            {selected ? (
              <div className="p-6 space-y-5">
                {/* Name + Type (inline, matched heights) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Name</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      className="admin-input flex-1 min-w-0 text-base font-semibold py-2 px-3"
                      placeholder="Character name"
                    />
                    <select
                      value={draftType}
                      onChange={e => setDraftType(e.target.value as ScriptCharacterType)}
                      className="admin-input px-3 py-2 text-base font-medium w-[72px] text-center"
                    >
                      {CHARACTER_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={draftDescription}
                    onChange={e => setDraftDescription(e.target.value)}
                    placeholder="Physical description, voice notes…"
                    rows={4}
                    className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                  />
                </div>

                {/* Color presets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Color</label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setDraftColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                          draftColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-admin-bg-base' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Casting Options — Row List ────────────────────────── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
                    Casting Options
                  </label>

                  {selectedCast.length > 0 && (
                    <DndContext
                      id={dndId}
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedCast.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1">
                          {selectedCast.map((cast, i) => (
                            <SortableCastRow
                              key={cast.id}
                              cast={cast}
                              isFeatured={i === 0}
                              isExtracting={extractingCastId === cast.id}
                              editingAppearanceId={editingAppearanceId}
                              appearanceDraft={appearanceDraft}
                              onAppearanceDraftChange={setAppearanceDraft}
                              onStartEditAppearance={(id, text) => { setEditingAppearanceId(id); setAppearanceDraft(text); }}
                              onCancelEditAppearance={() => setEditingAppearanceId(null)}
                              onSaveAppearance={handleSaveAppearance}
                              onRemove={handleRemoveCast}
                              onGenerate={(c) => extractAppearance(c, selected.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Add cast member */}
                  {selectedCast.length < 10 && (
                    showPicker ? (
                      <CastPickerPopover
                        onSelect={handleAssignCast}
                        onClose={() => setShowPicker(false)}
                        assignedContactIds={assignedContactIds}
                      />
                    ) : (
                      <button
                        onClick={() => setShowPicker(true)}
                        className="w-full py-2 rounded-admin-md border-2 border-dashed border-admin-border text-xs text-admin-text-faint hover:border-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCircle size={14} />
                        Add Cast Member
                      </button>
                    )
                  )}
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

        {/* Footer action bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-wash">
          <div className="flex items-center gap-2">
            <SaveButton saving={saving} saved={false} onClick={handleSave} className="px-5 py-2.5 text-sm" />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Character
            </button>
          </div>

          {selected && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-admin-danger mr-1">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger hover:bg-admin-danger-bg transition-colors"
                  title="Confirm delete"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
                title="Delete character"
              >
                <Trash2 size={14} />
              </button>
            )
          )}
        </div>

        {/* Discard changes dialog */}
        <DiscardChangesDialog
          open={confirmClose}
          onKeepEditing={() => setConfirmClose(false)}
          onDiscard={handleDiscard}
        />
      </div>
    </PanelDrawer>
  );
}
