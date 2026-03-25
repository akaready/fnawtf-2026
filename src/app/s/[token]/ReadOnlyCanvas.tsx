'use client';

import { Fragment, useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getOrderedGridTemplate, getOrderedVisibleColumns, DEFAULT_COLUMN_ORDER } from '@/app/admin/scripts/_components/gridUtils';
import { markdownToHtml } from '@/lib/scripts/parseContent';
import { StoryboardLayoutRenderer } from '@/app/admin/scripts/_components/StoryboardLayoutRenderer';
import { ScriptCommentsCell } from '@/app/admin/scripts/_components/ScriptCommentsCell';
import type { ScriptColumnConfig, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow, ScriptShareCommentRow, CropConfig, StoryboardSlotFrame } from '@/types/scripts';

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
  storyboard_layout?: string | null;
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
  slot?: number | null;
  crop_config?: CropConfig | null;
}

interface Props {
  scenes: Scene[];
  columnConfig: ScriptColumnConfig;
  references: Reference[];
  storyboardFrames: StoryboardFrame[];
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  products: ScriptProductRow[];
  commentsMap: Map<string, ScriptShareCommentRow[]>;
  shareId: string;
  onRefreshComments: () => void;
  columnOrder?: string[];
}

export function ReadOnlyCanvas({
  scenes,
  columnConfig,
  references,
  storyboardFrames,
  characters,
  tags,
  locations,
  products,
  commentsMap,
  shareId,
  onRefreshComments,
  columnOrder,
}: Props) {
  const [collapsedScenes, setCollapsedScenes] = useState<Set<string>>(new Set());
  const colHeaderRef = useRef<HTMLDivElement>(null);
  const [colHeaderHeight, setColHeaderHeight] = useState(32);

  useEffect(() => {
    if (colHeaderRef.current) {
      setColHeaderHeight(colHeaderRef.current.offsetHeight);
    }
  }, [columnConfig]);

  const order = columnOrder ?? DEFAULT_COLUMN_ORDER;
  const gridTemplate = getOrderedGridTemplate(columnConfig, order);
  const visibleColumns = getOrderedVisibleColumns(columnConfig, order);

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

  // Build storyboard lookup: beatId -> StoryboardFrame[]
  const frameMap = new Map<string, StoryboardFrame[]>();
  for (const frame of storyboardFrames) {
    if (frame.beat_id) {
      const list = frameMap.get(frame.beat_id) ?? [];
      list.push(frame);
      frameMap.set(frame.beat_id, list);
    }
  }

  const beatLetter = (n: number) => String.fromCharCode(64 + n); // 1=A, 2=B...

  return (
    <div className="w-full">
      <div style={{ minWidth: Math.max(800, visibleColumns.length * 200) }}>
      {/* Column headers — sticky */}
      <div ref={colHeaderRef} className="sticky top-0 z-20 bg-black border-b border-admin-border">
        <div className="flex">
          <div className="w-10 flex-shrink-0 sticky left-0 bg-black z-[21] border-r border-r-admin-border" />
          <div className="grid flex-1" style={{ gridTemplateColumns: gridTemplate }}>
            {visibleColumns.map((col) => (
              <div key={col.key} className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest bg-black ${col.color} border-l ${col.borderColor}`}>
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
              className="sticky z-[15] flex items-center bg-admin-bg-raised border-b border-admin-border cursor-pointer select-none"
              style={{ top: colHeaderHeight }}
              onClick={() => toggleCollapse(scene.id)}
            >
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                {isCollapsed
                  ? <ChevronRight size={13} className="text-muted-foreground" />
                  : <ChevronDown size={13} className="text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-0 pr-2 h-[44px] overflow-hidden">
                <span className="text-admin-border font-bebas text-[44px] leading-none flex-shrink-0 translate-y-[2px] text-right pr-2 w-[90px]">
                  {scene.sceneNumber}
                </span>
                <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider flex-1 min-w-0 truncate">
                  {[scene.int_ext, scene.location_name || 'UNTITLED LOCATION', scene.time_of_day ? `\u2014 ${scene.time_of_day}` : ''].filter(Boolean).join('. ').replace('. \u2014', ' \u2014')}
                  {scene.scene_description && (
                    <><span className="text-admin-text-ghost mx-1.5">&bull;</span><span className="text-admin-text-muted font-normal">{scene.scene_description}</span></>
                  )}
                </span>
              </div>
            </div>

            {/* Beats */}
            {!isCollapsed && scene.beats.map((beat, beatIdx) => {
              const beatRefs = refMap.get(beat.id) ?? [];
              const beatFrames = frameMap.get(beat.id) ?? [];

              return (
                <div key={beat.id} id={`beat-${beat.id}`} className="flex">
                  {/* Beat letter gutter */}
                  <div className="sticky left-0 z-[10] w-10 flex-shrink-0 flex items-center justify-center border-b border-b-admin-border border-r border-r-admin-border bg-black">
                    <span className="text-[10px] text-muted-foreground/30 font-mono">
                      {beatLetter(beatIdx + 1)}
                    </span>
                  </div>

                  {/* Content grid */}
                  <div className="relative flex-1 min-w-0">
                    {/* Column border overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none grid" style={{ gridTemplateColumns: gridTemplate }}>
                      {visibleColumns.map(col => (
                        <div key={col.key} className={`border-l ${col.borderColor}`} />
                      ))}
                    </div>

                    {/* Grid cells */}
                    <div className="grid items-stretch" style={{ gridTemplateColumns: gridTemplate }}>
                      {(() => {
                        const cellRenderers: Record<string, React.ReactNode> = {
                          audio: <ReadOnlyCell content={beat.audio_content} characters={characters} tags={tags} locations={locations} products={products} />,
                          visual: <ReadOnlyCell content={beat.visual_content} characters={characters} tags={tags} locations={locations} products={products} />,
                          notes: <ReadOnlyCell content={beat.notes_content} characters={characters} tags={tags} locations={locations} products={products} />,
                          reference: <ReadOnlyReferenceCell references={beatRefs} />,
                          storyboard: <ReadOnlyStoryboardCell frames={beatFrames} storyboardLayout={beat.storyboard_layout ?? null} />,
                          comments: (
                            <div className="min-w-0 overflow-hidden border-b border-b-admin-border flex flex-col">
                              <ScriptCommentsCell comments={commentsMap.get(beat.id) ?? []} shareId={shareId} beatId={beat.id} onRefresh={onRefreshComments} />
                            </div>
                          ),
                        };
                        return visibleColumns.map(col => (
                          <Fragment key={col.key}>{cellRenderers[col.key]}</Fragment>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      </div>
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
  products,
}: {
  content: string;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  products: ScriptProductRow[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // markdownToHtml uses DOMPurify which requires a browser DOM — skip during SSR
  const html = useMemo(
    () => (mounted ? markdownToHtml(content || '', characters, tags, locations, products) : ''),
    [mounted, content, characters, tags, locations, products],
  );

  return (
    <div
      className="min-w-0 overflow-hidden break-words min-h-[2.5rem] px-3 py-2 text-sm text-foreground border-b border-b-admin-border [&_strong]:font-bold"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Read-only reference cell ─────────────────────────────────────────────

function ReadOnlyReferenceCell({ references }: { references: Reference[] }) {
  if (references.length === 0) {
    return <div className="min-w-0 overflow-hidden min-h-[2.5rem] border-b border-b-admin-border flex items-center" />;
  }

  return (
    <div className="min-w-0 overflow-hidden min-h-[2.5rem] border-b border-b-admin-border flex items-center">
      <div className={`grid ${references.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5 p-1 w-full`}>
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

function ReadOnlyStoryboardCell({ frames, storyboardLayout }: { frames: StoryboardFrame[]; storyboardLayout: string | null }) {
  const slottedFrames = frames
    .filter(f => f.slot != null)
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)) as StoryboardSlotFrame[];

  if (slottedFrames.length > 0) {
    return (
      <div className="min-w-0 overflow-hidden border-b border-b-admin-border flex items-center">
        <div className="p-1 w-full">
          <StoryboardLayoutRenderer
            layout={storyboardLayout ?? 'single'}
            frames={slottedFrames}
            size="cell"
            gap={2}
          />
        </div>
      </div>
    );
  }

  const frame = frames[0];
  if (!frame) {
    return <div className="min-h-[2.5rem] border-b border-b-admin-border flex items-center" />;
  }

  return (
    <div className="min-w-0 overflow-hidden border-b border-b-admin-border flex items-center">
      <div className="p-1 w-full">
        <img src={frame.image_url} alt="" className="w-full aspect-video object-cover rounded" />
      </div>
    </div>
  );
}
