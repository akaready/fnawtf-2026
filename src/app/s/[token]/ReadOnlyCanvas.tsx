'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getGridTemplate, getVisibleColumns } from '@/app/admin/scripts/_components/gridUtils';
import { markdownToHtml } from '@/lib/scripts/parseContent';
import type { ScriptColumnConfig, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow } from '@/types/scripts';

interface Scene {
  id: string;
  sceneNumber: number;
  int_ext: string;
  location_name: string;
  time_of_day: string;
  scene_description?: string | null;
  beats: Beat[];
}

interface Beat {
  id: string;
  audio_content: string;
  visual_content: string;
  notes_content: string;
}

interface Reference {
  id: string;
  beat_id: string;
  image_url: string;
}

interface StoryboardFrame {
  id: string;
  beat_id: string | null;
  scene_id: string | null;
  image_url: string;
}

interface Props {
  scenes: Scene[];
  columnConfig: ScriptColumnConfig;
  references: Reference[];
  storyboardFrames: StoryboardFrame[];
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
}

export function ReadOnlyCanvas({
  scenes,
  columnConfig,
  references,
  storyboardFrames,
  characters,
  tags,
  locations,
}: Props) {
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const colHeaderRef = useRef<HTMLDivElement>(null);
  const [colHeaderHeight, setColHeaderHeight] = useState(32);

  useEffect(() => {
    if (colHeaderRef.current) {
      setColHeaderHeight(colHeaderRef.current.offsetHeight);
    }
  }, [columnConfig]);

  const gridTemplate = getGridTemplate(columnConfig);
  const visibleColumns = getVisibleColumns(columnConfig);

  const toggleCollapse = (sceneId: string) => {
    setCollapsedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  // Build reference lookup: beatId -> Reference[]
  const refMap = new Map<string, Reference[]>();
  for (const ref of references) {
    const list = refMap.get(ref.beat_id) ?? [];
    list.push(ref);
    refMap.set(ref.beat_id, list);
  }

  // Build storyboard lookup: beatId -> StoryboardFrame
  const frameMap = new Map<string, StoryboardFrame>();
  for (const frame of storyboardFrames) {
    if (frame.beat_id) frameMap.set(frame.beat_id, frame);
  }

  const beatLetter = (n: number) => String.fromCharCode(64 + n); // 1=A, 2=B...

  return (
    <div className="w-full">
      {/* Column headers — sticky */}
      <div ref={colHeaderRef} className="sticky top-0 z-20 bg-black">
        <div className="flex">
          <div className="w-10 flex-shrink-0" />
          <div className="grid flex-1 border-r border-border" style={{ gridTemplateColumns: gridTemplate }}>
            {visibleColumns.map((col) => (
              <div key={col.key} className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${col.color} border-l ${col.borderColor}`}>
                <span className="opacity-60">{col.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenes */}
      {scenes.map((scene) => {
        const isCollapsed = collapsedScenes.has(scene.id);
        return (
          <div key={scene.id} id={`scene-${scene.id}`}>
            {/* Scene header — sticky below column headers */}
            <div
              className="sticky z-[15] flex items-center bg-[#141414] border-b border-border cursor-pointer select-none"
              style={{ top: colHeaderHeight }}
              onClick={() => toggleCollapse(scene.id)}
            >
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                {isCollapsed
                  ? <ChevronRight size={13} className="text-muted-foreground" />
                  : <ChevronDown size={13} className="text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-0 pr-2 h-[44px] overflow-hidden">
                <span className="text-admin-border font-bebas text-[56px] leading-none flex-shrink-0 translate-y-[6px] px-2">
                  {scene.sceneNumber}
                </span>
                <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider flex-1 min-w-0 truncate">
                  {[scene.int_ext, scene.location_name || 'UNTITLED LOCATION', scene.time_of_day ? `\u2014 ${scene.time_of_day}` : ''].filter(Boolean).join('. ').replace('. \u2014', ' \u2014')}
                  {scene.scene_description && (
                    <span className="text-admin-text-muted font-normal ml-2">{scene.scene_description}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Beats */}
            {!isCollapsed && scene.beats.map((beat, beatIdx) => {
              const beatRefs = refMap.get(beat.id) ?? [];
              const frame = frameMap.get(beat.id);

              return (
                <div key={beat.id} className="relative">
                  {/* Beat letter gutter */}
                  <div className="absolute left-0 top-0 w-10 h-full flex items-center justify-center border-b border-b-[#1a1a1a]">
                    <span className="text-[10px] text-muted-foreground/30 font-mono">
                      {beatLetter(beatIdx + 1)}
                    </span>
                  </div>

                  {/* Content grid */}
                  <div className="relative ml-10 min-w-0 border-r border-border">
                    {/* Column border overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none grid" style={{ gridTemplateColumns: gridTemplate }}>
                      {columnConfig.audio && <div className="border-l border-l-[var(--admin-accent)]" />}
                      {columnConfig.visual && <div className="border-l border-l-[var(--admin-info)]" />}
                      {columnConfig.notes && <div className="border-l border-l-[var(--admin-warning)]" />}
                      {columnConfig.reference && <div className="border-l border-l-[var(--admin-danger)]" />}
                      {columnConfig.storyboard && <div className="border-l border-l-[var(--admin-success)]" />}
                    </div>

                    {/* Grid cells */}
                    <div className="grid items-stretch" style={{ gridTemplateColumns: gridTemplate }}>
                      {columnConfig.audio && (
                        <ReadOnlyCell content={beat.audio_content} characters={characters} tags={tags} locations={locations} />
                      )}
                      {columnConfig.visual && (
                        <ReadOnlyCell content={beat.visual_content} characters={characters} tags={tags} locations={locations} />
                      )}
                      {columnConfig.notes && (
                        <ReadOnlyCell content={beat.notes_content} characters={characters} tags={tags} locations={locations} />
                      )}
                      {columnConfig.reference && (
                        <ReadOnlyReferenceCell references={beatRefs} />
                      )}
                      {columnConfig.storyboard && (
                        <ReadOnlyStoryboardCell frame={frame} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Read-only text cell ──────────────────────────────────────────────────
// Content is sanitized by markdownToHtml via DOMPurify before rendering.

function ReadOnlyCell({
  content,
  characters,
  tags,
  locations,
}: {
  content: string;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // markdownToHtml uses DOMPurify which requires a browser DOM — skip during SSR
  const html = useMemo(
    () => (mounted ? markdownToHtml(content || '', characters, tags, locations) : ''),
    [mounted, content, characters, tags, locations],
  );

  return (
    <div
      className="min-h-[2.5rem] px-3 py-2 text-sm text-foreground border-b border-b-[#1a1a1a] [&_strong]:font-bold"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Read-only reference cell ─────────────────────────────────────────────

function ReadOnlyReferenceCell({ references }: { references: Reference[] }) {
  if (references.length === 0) {
    return <div className="min-h-[2.5rem] border-b border-b-[#1a1a1a]" />;
  }

  return (
    <div className="min-h-[2.5rem] border-b border-b-[#1a1a1a]">
      <div className={`grid ${references.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5 p-1`}>
        {references.map(ref => (
          <div key={ref.id} className="relative aspect-video rounded overflow-hidden">
            <img src={ref.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Read-only storyboard cell ────────────────────────────────────────────

function ReadOnlyStoryboardCell({ frame }: { frame?: StoryboardFrame }) {
  if (!frame) {
    return <div className="min-h-[2.5rem] border-b border-b-[#1a1a1a]" />;
  }

  return (
    <div className="min-w-0 overflow-hidden border-b border-b-[#1a1a1a]">
      <div className="mx-2 my-2">
        <img src={frame.image_url} alt="" className="w-full aspect-video object-cover rounded" />
      </div>
    </div>
  );
}
