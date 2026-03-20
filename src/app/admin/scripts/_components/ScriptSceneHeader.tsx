'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Check, X, Plus, Sparkles, Loader2, MapPin } from 'lucide-react';
import { createLocation } from '@/app/admin/actions';
import { AdminCombobox } from '../../_components/AdminCombobox';
import type { ComputedScene, ScriptLocationRow } from '@/types/scripts';

interface Props {
  scene: ComputedScene;
  scriptGroupId: string;
  locations?: ScriptLocationRow[];
  onUpdate: (sceneId: string, data: Record<string, unknown>) => void;
  onDelete?: (sceneId: string) => void;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onGenerate?: () => void;
  generating?: boolean;
  /** True when any beat in this scene is actively being batch-generated (e.g. scene is collapsed) */
  isGenerating?: boolean;
}

const INT_EXT_OPTIONS: { id: string; label: string }[] = [
  { id: 'INT', label: 'INT' },
  { id: 'EXT', label: 'EXT' },
  { id: 'INT/EXT', label: 'INT/EXT' },
];
const TIME_OPTIONS: { id: string; label: string }[] = [
  { id: 'DAY', label: 'DAY' },
  { id: 'NIGHT', label: 'NIGHT' },
  { id: 'DAWN', label: 'DAWN' },
  { id: 'DUSK', label: 'DUSK' },
  { id: 'CONTINUOUS', label: 'CONTINUOUS' },
  { id: 'LATER', label: 'LATER' },
];

export function ScriptSceneHeader({ scene, scriptGroupId, locations = [], onUpdate, onDelete, editing, onEditingChange, onGenerate, generating, isGenerating }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [locQuery, setLocQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldClass = 'bg-admin-bg-base text-admin-text-primary text-xs px-2 h-7 rounded border border-admin-border-subtle focus:outline-none focus:border-admin-border-focus uppercase';

  // Filter locations by query
  const normalizedQuery = locQuery.trim().toLowerCase();
  const filtered = normalizedQuery
    ? locations.filter(l => l.name.toLowerCase().includes(normalizedQuery))
    : locations;
  const exactMatch = locations.some(l => l.name.toLowerCase() === normalizedQuery);
  const showCreate = normalizedQuery.length > 0 && !exactMatch;

  // Total items = filtered locations + optional "create" row
  const totalItems = filtered.length + (showCreate ? 1 : 0);

  // Reset highlight when list changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [normalizedQuery]);

  const selectLocation = (loc: ScriptLocationRow) => {
    onUpdate(scene.id, { location_name: loc.name, location_id: loc.id });
    setLocQuery('');
    setShowDropdown(false);
  };

  const handleCreateAndSelect = async () => {
    const name = locQuery.trim().toUpperCase();
    if (!name) return;
    const id = await createLocation(scriptGroupId, {
      name,
      description: '',
      sort_order: locations.length,
    });
    onUpdate(scene.id, { location_name: name, location_id: id });
    setLocQuery('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || totalItems === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => (i + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => (i - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx < filtered.length) {
        selectLocation(filtered[highlightIdx]);
      } else if (showCreate) {
        handleCreateAndSelect();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  if (editing) {
    return (
      <div
        className="flex items-center gap-2 py-2 pr-2"
        id={`scene-${scene.id}`}
        onClick={e => e.stopPropagation()}
        onBlur={e => {
          // Capture currentTarget before React recycles the event
          const container = e.currentTarget;
          // Delay to allow dropdown click
          setTimeout(() => {
            if (!container?.contains(document.activeElement)) {
              onEditingChange?.(false);
              setShowDropdown(false);
            }
          }, 150);
        }}
      >
        <div className="w-[5.5rem]">
          <AdminCombobox
            value={scene.int_ext}
            options={INT_EXT_OPTIONS}
            onChange={(v) => { if (v) onUpdate(scene.id, { int_ext: v }); }}
            nullable={false}
            placeholder="INT/EXT"
            searchable={false}
            compact
          />
        </div>

        {/* Location autocomplete */}
        <div className="relative w-44 flex-shrink-0">
          <input
            ref={inputRef}
            value={showDropdown ? locQuery : scene.location_name}
            onChange={e => {
              setLocQuery(e.target.value);
              if (!showDropdown) setShowDropdown(true);
            }}
            onFocus={() => {
              setLocQuery(scene.location_name);
            }}
            onKeyDown={handleKeyDown}
            placeholder="LOCATION NAME"
            className={`${fieldClass} w-full`}
          />
          {showDropdown && totalItems > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 z-50 bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl max-h-48 overflow-y-auto admin-scrollbar"
            >
              {filtered.map((loc, i) => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); selectLocation(loc); }}
                  className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wide transition-colors ${
                    i === highlightIdx
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-secondary hover:bg-admin-bg-hover'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
              {showCreate && (
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleCreateAndSelect(); }}
                  className={`w-full text-left px-3 py-2 text-xs tracking-wide transition-colors flex items-center gap-1.5 border-t border-admin-border-subtle ${
                    highlightIdx === filtered.length
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted hover:bg-admin-bg-hover'
                  }`}
                >
                  <Plus size={12} />
                  Create &ldquo;{locQuery.trim().toUpperCase()}&rdquo;
                </button>
              )}
            </div>
          )}
        </div>

        <span className="text-admin-text-faint text-xs">&mdash;</span>

        <div className="w-32">
          <AdminCombobox
            value={scene.time_of_day}
            options={TIME_OPTIONS}
            onChange={(v) => { if (v) onUpdate(scene.id, { time_of_day: v }); }}
            nullable={false}
            placeholder="TIME"
            searchable={false}
            compact
          />
        </div>

        {/* Scene description — inline after time-of-day */}
        <span className="text-admin-text-faint text-xs">[</span>
        <input
          value={scene.scene_description ?? ''}
          onChange={e => onUpdate(scene.id, { scene_description: e.target.value || null })}
          placeholder="SCENE DESCRIPTION"
          className={`${fieldClass} w-60`}
        />
        <span className="text-admin-text-faint text-xs">]</span>

        <div className="flex-1" />
        <button
          onClick={() => onEditingChange?.(false)}
          className="text-admin-success hover:text-green-300 p-1.5 transition-colors"
          title="Done editing"
        >
          <Check size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEditingChange?.(false); }}
          className="text-admin-text-faint hover:text-admin-text-primary p-1.5 transition-colors"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  const heading = [
    scene.int_ext,
    scene.location_name || 'UNTITLED LOCATION',
    scene.time_of_day ? `— ${scene.time_of_day}` : '',
  ].filter(Boolean).join('. ').replace('. —', ' —');

  // Check if this scene's location is linked to a global location
  const sceneLocation = locations?.find(l => l.id === scene.location_id);
  const hasGlobalLink = !!sceneLocation?.global_location_id;

  return (
    <div
      className="flex items-center gap-0 pr-2 h-[44px] overflow-hidden group/scene"
      id={`scene-${scene.id}`}
    >
      <span className="text-admin-border font-bebas text-[44px] leading-none flex-shrink-0 translate-y-[2px] text-right pr-2 pl-3" style={{ minWidth: '4ch' }}>
        {scene.sceneNumber}
      </span>
      {hasGlobalLink && (
        <span className="flex-shrink-0" title="Linked to locations library">
          <MapPin size={10} className="text-admin-info" />
        </span>
      )}
      <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider flex-1 min-w-0 truncate">
        {heading}
        {scene.scene_description && (
          <span className="text-admin-text-muted font-normal ml-2">{scene.scene_description}</span>
        )}
      </span>

      <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${confirmDelete ? 'opacity-100' : 'opacity-0 group-hover/scene:opacity-100'}`}>
        {confirmDelete ? (
          <>
            <button
              onClick={e => { e.stopPropagation(); onDelete?.(scene.id); }}
              className="text-admin-danger hover:text-red-300 p-1 transition-colors"
              title="Confirm delete scene"
            >
              <Check size={14} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
              className="text-admin-text-muted hover:text-admin-text-primary p-1 transition-colors"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            {(isGenerating && !onGenerate) && (
              <span className="p-1 text-admin-text-muted" title="Generating…">
                <Loader2 size={14} className="animate-spin" />
              </span>
            )}
            {onGenerate && (
              <button
                onClick={e => { e.stopPropagation(); onGenerate(); }}
                disabled={generating || isGenerating}
                className="text-admin-text-secondary hover:text-admin-text-primary p-1 transition-colors"
                title={(generating || isGenerating) ? 'Generating…' : 'Generate storyboards for scene'}
              >
                {(generating || isGenerating) ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onEditingChange?.(true); }}
              className="text-admin-text-secondary hover:text-admin-text-primary p-1 transition-colors"
              title="Edit scene"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
              className="text-admin-text-secondary hover:text-admin-danger p-1 transition-colors"
              title="Delete scene"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
