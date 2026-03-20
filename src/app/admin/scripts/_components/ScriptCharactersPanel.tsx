'use client';

import { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { Plus, Trash2, Loader2, X, UserCircle, RefreshCw, Pencil, Sparkles, Check, ImagePlus } from 'lucide-react';
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
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';
import { AdminCombobox } from '../../_components/AdminCombobox';
import { ColorPicker, PRESET_COLORS } from './ColorPicker';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import {
  createCharacter, updateCharacter, deleteCharacter,
  getContactsWithHeadshots,
  assignCastMember, removeCastMember,
  updateCastAppearancePrompt, reorderCastMembers,
  uploadCharacterReference, deleteCharacterReference,
} from '@/app/admin/actions';
import type { ScriptCharacterRow, ScriptBeatRow, ScriptCharacterType, CharacterCastWithContact, CharacterReferenceRow } from '@/types/scripts';
import type { ContactRow } from '@/types/proposal';

interface Props {
  open: boolean;
  onClose: () => void;
  scriptGroupId: string;
  characters: ScriptCharacterRow[];
  beats: ScriptBeatRow[];
  onCharactersChange: (chars: ScriptCharacterRow[]) => void;
  castMap: Record<string, CharacterCastWithContact[]>;
  onCastMapChange: (map: Record<string, CharacterCastWithContact[]>) => void;
  referenceMap: Record<string, CharacterReferenceRow[]>;
  onReferenceMapChange: (map: Record<string, CharacterReferenceRow[]>) => void;
}

// PRESET_COLORS imported from ColorPicker

const CHARACTER_TYPES: { id: string; label: string }[] = [
  { id: 'actor', label: 'OS' },
  { id: 'vo', label: 'VO' },
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
      style={{ ...style, borderColor: isFeatured ? 'var(--admin-warning)' : 'var(--admin-border-subtle)' }}
      {...attributes}
      {...listeners}
      className="group/cast rounded-admin-md transition-colors cursor-grab active:cursor-grabbing border bg-admin-bg-overlay hover:bg-admin-bg-hover"
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
      setContacts(all as CastContact[]);
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
  open, onClose, scriptGroupId, characters, beats, onCharactersChange,
  castMap, onCastMapChange,
  referenceMap, onReferenceMapChange,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editingAppearanceId, setEditingAppearanceId] = useState<string | null>(null);
  const [appearanceDraft, setAppearanceDraft] = useState('');
  const [extractingCastId, setExtractingCastId] = useState<string | null>(null);

  // ── Draft state ───────────────────────────────────────────────────
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [draftType, setDraftType] = useState<ScriptCharacterType>('actor');
  const [draftCastMode, setDraftCastMode] = useState<'people' | 'references'>('people');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [extractingRefDescription, setExtractingRefDescription] = useState(false);
  const [editingRefAppearance, setEditingRefAppearance] = useState(false);
  const [refAppearanceDraft, setRefAppearanceDraft] = useState('');
  const refUploadInputRef = useRef<HTMLInputElement>(null);

  // Refs for autoSave closure
  const draftNameRef = useRef(draftName);
  const draftDescriptionRef = useRef(draftDescription);
  const draftColorRef = useRef(draftColor);
  const draftTypeRef = useRef(draftType);
  const draftCastModeRef = useRef(draftCastMode);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { draftNameRef.current = draftName; });
  useEffect(() => { draftDescriptionRef.current = draftDescription; });
  useEffect(() => { draftColorRef.current = draftColor; });
  useEffect(() => { draftTypeRef.current = draftType; });
  useEffect(() => { draftCastModeRef.current = draftCastMode; });
  useEffect(() => { selectedIdRef.current = selectedId; });

  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Chat panel context
  const { setPanelContext } = useChatContext();

  useEffect(() => {
    if (!scriptGroupId) return;
    const lines: string[] = [];
    lines.push(`Total Characters: ${characters.length}`);
    characters.forEach(char => {
      const charCast = castMap[char.id] ?? [];
      const mentions = countMentions(char.id, beats);
      lines.push(`\n[${char.name}]`);
      lines.push(`  Type: ${char.character_type}`);
      if (char.description) lines.push(`  Description: ${char.description}`);
      if (char.color) lines.push(`  Color: ${char.color}`);
      if (mentions > 0) lines.push(`  Mentioned in: ${mentions} beat${mentions !== 1 ? 's' : ''}`);
      if (charCast.length > 0) {
        lines.push(`  Cast (${charCast.length}):`);
        charCast.forEach(c => {
          const name = `${c.contact.first_name} ${c.contact.last_name}`;
          const extras: string[] = [];
          if (c.is_featured) extras.push('featured');
          if (c.appearance_prompt) extras.push(`appearance: ${c.appearance_prompt.slice(0, 80)}...`);
          lines.push(`    - ${name}${extras.length ? ` (${extras.join(', ')})` : ''}`);
        });
      }
    });
    setPanelContext({
      recordType: 'script-characters',
      recordId: scriptGroupId,
      recordLabel: `Characters (${characters.length})`,
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [scriptGroupId, characters, castMap, beats, setPanelContext]);

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
      setDraftCastMode(selected.cast_mode ?? 'people');
      setConfirmDeleteId(null);
      setEditingAppearanceId(null);
      setShowPicker(false);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ───────────────────────────────────────────────────
  const autoSave = useAutoSave(async () => {
    const charId = selectedIdRef.current;
    if (!charId) return;
    const updates = {
      name: draftNameRef.current,
      description: draftDescriptionRef.current || null,
      color: draftColorRef.current,
      character_type: draftTypeRef.current,
      cast_mode: draftCastModeRef.current,
    };
    await updateCharacter(charId, updates);
    onCharactersChange(characters.map(c =>
      c.id === charId ? { ...c, ...updates, description: draftDescriptionRef.current || null } : c,
    ));
  });

  const handleClose = useCallback(() => {
    autoSave.flush();
    onClose();
  }, [autoSave, onClose]);

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
      const id = await createCharacter(scriptGroupId, {
        name: 'New Character',
        description: '',
        color,
        sort_order: characters.length,
      });
      const newChar: ScriptCharacterRow = {
        id,
        script_group_id: scriptGroupId,
        name: 'New Character',
        description: null,
        color,
        character_type: 'actor',
        sort_order: characters.length,
        max_cast_slots: 3,
        cast_mode: 'people',
        appearance_prompt: null,
        created_at: new Date().toISOString(),
      };
      onCharactersChange([...characters, newChar]);
      setSelectedId(id);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = useCallback(async (charId: string) => {
    setDeleting(true);
    try {
      await deleteCharacter(charId);
      onCharactersChange(characters.filter(c => c.id !== charId));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }, [characters, onCharactersChange]);

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

  const extractRefAppearance = useCallback(async (
    charId: string,
    refs: CharacterReferenceRow[],
  ) => {
    if (refs.length === 0) return;
    setExtractingRefDescription(true);
    try {
      const res = await fetch('/api/admin/cast-appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headshotUrls: refs.map(r => r.image_url) }),
      });
      if (!res.ok) return;
      const { appearancePrompt } = await res.json();
      await updateCharacter(charId, { appearance_prompt: appearancePrompt });
      onCharactersChange(characters.map(c =>
        c.id === charId ? { ...c, appearance_prompt: appearancePrompt } : c,
      ));
    } catch (err) {
      console.error('Character ref appearance extraction error:', err);
    } finally {
      setExtractingRefDescription(false);
    }
  }, [characters, onCharactersChange]);

  const handleUploadReference = useCallback(async (file: File) => {
    if (!selected) return;
    const currentRefs = referenceMap[selected.id] ?? [];
    if (currentRefs.length >= 8) return;
    setUploadingRef(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const row = await uploadCharacterReference(selected.id, fd);
      const updatedRefs = [...currentRefs, row];
      onReferenceMapChange({ ...referenceMap, [selected.id]: updatedRefs });
      // Auto-generate on first upload or when no description yet
      if (!selected.appearance_prompt) {
        await extractRefAppearance(selected.id, updatedRefs);
      }
    } finally {
      setUploadingRef(false);
    }
  }, [selected, referenceMap, onReferenceMapChange, extractRefAppearance]);

  const handleDeleteReference = useCallback(async (ref: CharacterReferenceRow) => {
    if (!selected) return;
    await deleteCharacterReference(ref.id, ref.storage_path);
    const updated = (referenceMap[selected.id] ?? []).filter(r => r.id !== ref.id);
    onReferenceMapChange({ ...referenceMap, [selected.id]: updated });
  }, [selected, referenceMap, onReferenceMapChange]);

  const handleSaveRefAppearance = useCallback(async () => {
    if (!selected) return;
    await updateCharacter(selected.id, { appearance_prompt: refAppearanceDraft });
    onCharactersChange(characters.map(c =>
      c.id === selected.id ? { ...c, appearance_prompt: refAppearanceDraft } : c,
    ));
    setEditingRefAppearance(false);
  }, [selected, refAppearanceDraft, characters, onCharactersChange]);

  const assignedContactIds = useMemo(
    () => new Set(selectedCast.map(c => c.contact_id)),
    [selectedCast],
  );

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[620px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[4rem] border-b border-admin-border bg-admin-bg-sidebar">
          <h2 className="text-admin-lg font-semibold text-admin-text-primary">Characters</h2>
          <div className="flex items-center">
            <SaveDot status={autoSave.status} />
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors" title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Character list */}
          <div className="w-[220px] flex-shrink-0 border-r border-admin-border flex flex-col">
            {/* Add button at top */}
            <div className="flex-shrink-0 border-b border-admin-border px-3 py-3 flex items-center">
              <button
                onClick={handleAdd}
                disabled={adding}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary bg-admin-bg-active hover:bg-admin-bg-hover-strong border border-transparent rounded-lg h-[36px] transition-colors"
              >
                {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add Character
              </button>
            </div>
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
                  <div
                    key={char.id}
                    className={`group/row w-full flex items-center px-4 py-2.5 gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (selectedId !== char.id) {
                          autoSave.flush();
                        }
                        setSelectedId(char.id);
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
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
                    {/* Two-step delete */}
                    {confirmDeleteId === char.id ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(char.id)}
                          className="p-1 text-admin-danger hover:text-red-300 transition-colors"
                          title="Confirm delete"
                        >
                          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 text-admin-text-faint hover:text-admin-text-primary transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(char.id)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-admin-text-ghost hover:text-admin-danger transition-all flex-shrink-0"
                        title="Delete character"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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
                      onChange={e => { setDraftName(e.target.value); autoSave.trigger(); }}
                      className="admin-input flex-1 min-w-0 text-base font-semibold py-2 px-3"
                      placeholder="Character name"
                    />
                    <div className="w-[72px]">
                      <AdminCombobox
                        value={draftType}
                        options={CHARACTER_TYPES}
                        onChange={(v) => { if (v) { setDraftType(v as ScriptCharacterType); autoSave.trigger(); } }}
                        nullable={false}
                        placeholder="Type"
                        searchable={false}
                      />
                    </div>
                    <ColorPicker value={draftColor} onChange={c => { setDraftColor(c); autoSave.trigger(); }} />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Description</label>
                  <textarea
                    value={draftDescription}
                    onChange={e => { setDraftDescription(e.target.value); autoSave.trigger(); }}
                    placeholder="Physical description, voice notes…"
                    rows={4}
                    className="admin-input w-full text-sm resize-none py-2.5 px-3 leading-relaxed"
                  />
                </div>

                {/* ── Casting Options — Tabbed ────────────────────────── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">
                    Casting Options
                  </label>

                  {/* Tab strip */}
                  <div className="flex items-center gap-0.5 bg-admin-bg-inset border border-admin-border rounded-admin-md p-0.5">
                    {(['people', 'references'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => { setDraftCastMode(mode); autoSave.trigger(); }}
                        className={`flex-1 py-1.5 text-admin-sm font-medium rounded-admin-sm transition-colors ${
                          draftCastMode === mode
                            ? 'bg-admin-text-primary text-admin-bg-base'
                            : 'text-admin-text-ghost hover:text-admin-text-muted'
                        }`}
                      >
                        {mode === 'people' ? 'Person' : 'References'}
                      </button>
                    ))}
                  </div>

                  {draftCastMode === 'people' ? (
                    <>
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
                            Add Person
                          </button>
                        )
                      )}
                    </>
                  ) : (
                    /* References tab — up to 8 uploaded images + auto-description */
                    <div className="space-y-3">
                      <input
                        ref={refUploadInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleUploadReference(file);
                          e.target.value = '';
                        }}
                      />
                      <div className="flex gap-2 flex-wrap">
                        {(referenceMap[selected.id] ?? []).map(ref => (
                          <div key={ref.id} className="group/refslot relative w-20 h-20 flex-shrink-0">
                            <img
                              src={ref.image_url}
                              alt=""
                              className="w-full h-full object-cover rounded-admin-md"
                            />
                            <button
                              onClick={() => handleDeleteReference(ref)}
                              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover/refslot:opacity-100 transition-opacity hover:bg-admin-danger"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {(referenceMap[selected.id] ?? []).length < 8 && (
                          <button
                            onClick={() => refUploadInputRef.current?.click()}
                            disabled={uploadingRef}
                            className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-admin-md border-2 border-dashed border-admin-border text-admin-text-faint hover:border-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover transition-colors disabled:opacity-50"
                          >
                            {uploadingRef ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <ImagePlus size={16} />
                                <span className="text-[10px]">Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-admin-sm text-admin-text-faint">
                        Up to 8 images used as visual references for storyboard generation.
                      </p>
                      {/* Auto-generated visual description */}
                      {(referenceMap[selected.id] ?? []).length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-admin-text-faint">Visual Description</label>
                          {extractingRefDescription ? (
                            <div className="flex items-center gap-1.5 text-xs text-admin-text-faint">
                              <Loader2 size={11} className="animate-spin" />
                              Generating description…
                            </div>
                          ) : editingRefAppearance ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={refAppearanceDraft}
                                onChange={e => setRefAppearanceDraft(e.target.value)}
                                rows={5}
                                className="admin-input w-full text-xs resize-none py-2 px-2.5 leading-relaxed"
                              />
                              <div className="flex items-center gap-2">
                                <button onClick={handleSaveRefAppearance} className="btn-primary px-4 py-2 text-xs">Save</button>
                                <button onClick={() => setEditingRefAppearance(false)} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : selected.appearance_prompt ? (
                            <div className="group/refappearance space-y-1.5">
                              <p className="text-xs text-admin-text-muted leading-relaxed line-clamp-4">
                                {selected.appearance_prompt}
                              </p>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/refappearance:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setRefAppearanceDraft(selected.appearance_prompt ?? ''); setEditingRefAppearance(true); }}
                                  className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                                  title="Edit description"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => extractRefAppearance(selected.id, referenceMap[selected.id] ?? [])}
                                  className="w-6 h-6 flex items-center justify-center rounded-admin-sm text-admin-text-faint hover:text-admin-info hover:bg-admin-bg-hover transition-colors"
                                  title="Regenerate description"
                                >
                                  <RefreshCw size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => extractRefAppearance(selected.id, referenceMap[selected.id] ?? [])}
                              className="text-xs text-admin-text-ghost hover:text-admin-info transition-colors flex items-center gap-1.5"
                            >
                              <Sparkles size={12} />
                              Generate description…
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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

        <PanelFooter onSave={handleClose} />
      </div>
    </PanelDrawer>
  );
}
