'use client';

import { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeftOpen, SeparatorVertical, Play, Expand, Shrink } from 'lucide-react';
import { ScriptColumnToggle } from '@/app/admin/scripts/_components/ScriptColumnToggle';
import { ScriptPresentation } from '@/app/admin/scripts/_components/ScriptPresentation';
import { buildPresentationSlides } from '@/app/admin/scripts/_components/presentationUtils';
import { ReadOnlyCanvas } from './ReadOnlyCanvas';
import { startScriptViewSession, updateScriptViewDuration } from './actions';
import { computeSceneNumbers } from '@/lib/scripts/sceneNumbers';
import { formatScriptVersion } from '@/types/scripts';
import type { ScriptColumnConfig, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow } from '@/types/scripts';

const CONTAINER_WIDTHS = ['', 'max-w-7xl', 'max-w-5xl', 'max-w-3xl'] as const;
const CONTAINER_LABELS = ['Full', 'Wide', 'Medium', 'Narrow'] as const;

interface Props {
  shareId: string;
  shareNotes: string | null;
  script: {
    id: string;
    title: string;
    majorVersion: number;
    minorVersion: number;
    isPublished: boolean;
    contentMode: string;
  };
  projectTitle: string | null;
  projectNumber: number | null;
  clientName: string | null;
  clientLogoUrl?: string | null;
  scenes: Record<string, unknown>[];
  beats: Record<string, unknown>[];
  characters: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  locations: Record<string, unknown>[];
  references: Record<string, unknown>[];
  storyboardFrames: Record<string, unknown>[];
  viewerEmail: string;
  viewerName: string | null;
}

export function ScriptShareClient({
  shareId,
  shareNotes,
  script,
  projectTitle: _projectTitle,
  projectNumber,
  clientName,
  clientLogoUrl,
  scenes: rawScenes,
  beats: rawBeats,
  characters: rawCharacters,
  tags: rawTags,
  locations: rawLocations,
  references: rawReferences,
  storyboardFrames: rawStoryboardFrames,
  viewerEmail,
}: Props) {
  const [columnConfig, setColumnConfig] = useState<ScriptColumnConfig>({
    audio: true, visual: true, notes: true, reference: true, storyboard: true,
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [containerIdx, setContainerIdx] = useState(0);
  const [showPresentation, setShowPresentation] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Cast raw data to typed arrays
  const typedScenes = rawScenes as unknown as { id: string; sort_order: number; location_name: string; time_of_day: string; int_ext: string; scene_notes: string | null }[];
  const typedBeats = rawBeats as unknown as { id: string; scene_id: string; sort_order: number; audio_content: string; visual_content: string; notes_content: string }[];
  const typedCharacters = rawCharacters as unknown as ScriptCharacterRow[];
  const typedTags = rawTags as unknown as ScriptTagRow[];
  const typedLocations = rawLocations as unknown as ScriptLocationRow[];
  const typedReferences = rawReferences as unknown as { id: string; beat_id: string; image_url: string }[];
  const typedStoryboardFrames = rawStoryboardFrames as unknown as { id: string; beat_id: string | null; scene_id: string | null; image_url: string }[];

  // Sort scenes and build beats-by-scene map
  const sortedScenes = typedScenes.sort((a, b) => a.sort_order - b.sort_order);
  const beatsByScene: Record<string, typeof typedBeats> = {};
  for (const beat of typedBeats) {
    const list = beatsByScene[beat.scene_id] ?? [];
    list.push(beat);
    beatsByScene[beat.scene_id] = list;
  }
  // Sort beats within each scene
  for (const sceneId of Object.keys(beatsByScene)) {
    beatsByScene[sceneId].sort((a, b) => a.sort_order - b.sort_order);
  }

  const computed = computeSceneNumbers(sortedScenes as never, beatsByScene as never);
  const computedScenes = (computed as unknown as { id: string; sceneNumber: number; int_ext: string; location_name: string; time_of_day: string; beats: { id: string; audio_content: string; visual_content: string; notes_content: string }[] }[]);

  // Set initial active scene
  useEffect(() => {
    if (!activeSceneId && computedScenes.length > 0) {
      setActiveSceneId(computedScenes[0].id);
    }
  }, [activeSceneId, computedScenes]);

  // View duration tracking (skip for admin preview when shareId is empty)
  const viewIdRef = useRef<string | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!shareId) return;

    startScriptViewSession(shareId, viewerEmail).then(id => {
      viewIdRef.current = id;
    });

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && viewIdRef.current) {
        elapsedRef.current += 30;
        updateScriptViewDuration(viewIdRef.current, elapsedRef.current);
      }
    }, 30_000);

    return () => {
      clearInterval(interval);
      if (viewIdRef.current) {
        updateScriptViewDuration(viewIdRef.current, elapsedRef.current);
      }
    };
  }, [shareId, viewerEmail]);

  const versionLabel = formatScriptVersion(script.majorVersion, script.minorVersion, script.isPublished);
  const nextWidth = CONTAINER_LABELS[(containerIdx + 1) % CONTAINER_WIDTHS.length];

  const handleSceneClick = (sceneId: string) => {
    setActiveSceneId(sceneId);
    const el = document.getElementById(`scene-${sceneId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const btnCls = 'w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';

  return (
    <div className="flex flex-col h-screen bg-black text-foreground">
      {/* Title header — collapses in focus mode */}
      {!isFocused && (
        <>
          <div className="relative flex items-center px-8 py-4 border-b border-border flex-shrink-0">
            {/* Left — logos */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-5" />
              {clientLogoUrl && (
                <>
                  <span className="text-border text-xs">/</span>
                  <img src={clientLogoUrl} alt="" className="h-5 object-contain admin-logo" />
                </>
              )}
            </div>

            {/* Center — absolute positioned so it's truly centered regardless of left/right widths */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center min-w-0 px-40">
                {clientName && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5 truncate">
                    {clientName}{projectNumber ? ` \u00B7 #${projectNumber}` : ''}
                  </p>
                )}
                <h1 className="font-display text-lg font-bold text-foreground leading-tight truncate">
                  {script.title}
                </h1>
              </div>
            </div>

            {/* Right — version tag */}
            <div className="ml-auto flex-shrink-0">
              <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-muted-foreground bg-white/[0.05] border border-border rounded-full">
                v{versionLabel}
              </span>
            </div>
          </div>

          {/* Notes banner */}
          {shareNotes && (
            <div className="px-8 py-3 border-b border-border bg-white/[0.02] flex-shrink-0">
              <div className="max-w-2xl mx-auto text-sm text-muted-foreground/80 whitespace-pre-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mr-2">What to Look For</span>
                {shareNotes}
              </div>
            </div>
          )}
        </>
      )}

      {/* Toolbar */}
      <div className="relative h-[3rem] flex items-center px-4 border-b border-border bg-black/50 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSidebar(prev => !prev)}
            className={btnCls}
            title={showSidebar ? 'Hide scenes' : 'Show scenes'}
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <button
            onClick={() => setContainerIdx(prev => (prev + 1) % CONTAINER_WIDTHS.length)}
            className={btnCls}
            title={`Width: ${CONTAINER_LABELS[containerIdx]} \u2192 ${nextWidth}`}
          >
            <SeparatorVertical size={16} />
          </button>
          <button
            onClick={() => setIsFocused(prev => !prev)}
            className={btnCls}
            title={isFocused ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFocused ? <Shrink size={16} /> : <Expand size={16} />}
          </button>
          <button
            onClick={() => setShowPresentation(true)}
            className={btnCls}
            title="Present"
          >
            <Play size={16} />
          </button>
        </div>
        {/* Dots — absolutely centered to match header centering */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <ScriptColumnToggle config={columnConfig} onChange={setColumnConfig} compact />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div
          className={`flex-shrink-0 h-full border-r border-border bg-[#0a0a0a] overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showSidebar ? 'w-56' : 'w-0'}`}
        >
          <div className="w-56 h-full overflow-y-auto admin-scrollbar">
            {computedScenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => handleSceneClick(scene.id)}
                className={`w-full text-left flex items-center gap-1 px-2 py-3 border-b border-border/30 transition-colors ${
                  activeSceneId === scene.id
                    ? 'bg-white/[0.06] text-foreground'
                    : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
                }`}
              >
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-sm font-bold">{scene.sceneNumber}</span>
                  </div>
                  <div className="text-xs truncate uppercase tracking-wide mt-0.5 opacity-70">
                    {scene.int_ext}. {scene.location_name || '\u2014'}
                  </div>
                  {scene.time_of_day && (
                    <div className="text-xs text-muted-foreground/50">{scene.time_of_day}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar">
          <div className={`${CONTAINER_WIDTHS[containerIdx]} mx-auto`}>
            <ReadOnlyCanvas
              scenes={computedScenes}
              columnConfig={columnConfig}
              references={typedReferences}
              storyboardFrames={typedStoryboardFrames}
              characters={typedCharacters}
              tags={typedTags}
              locations={typedLocations}
            />
          </div>
        </div>
      </div>

      {showPresentation && (() => {
        const refsByBeat: Record<string, { image_url: string }[]> = {};
        for (const ref of typedReferences) {
          const list = refsByBeat[ref.beat_id] ?? [];
          list.push(ref);
          refsByBeat[ref.beat_id] = list;
        }
        return (
          <ScriptPresentation
            slides={buildPresentationSlides(computedScenes, typedStoryboardFrames, refsByBeat)}
            columnConfig={columnConfig}
            onClose={() => setShowPresentation(false)}
            scriptTitle={script.title}
            clientName={clientName ?? undefined}
            clientLogoUrl={clientLogoUrl}
            versionLabel={formatScriptVersion(script.majorVersion, script.minorVersion, script.isPublished)}
          />
        );
      })()}
    </div>
  );
}
