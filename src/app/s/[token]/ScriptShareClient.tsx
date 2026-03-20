'use client';

import { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeftOpen, SeparatorVertical, Expand, Shrink, MapPin, FileText } from 'lucide-react';
import { ScriptColumnToggle } from '@/app/admin/scripts/_components/ScriptColumnToggle';
import { buildPresentationSlides } from '@/app/admin/scripts/_components/presentationUtils';
import { ScriptShareIntro } from './ScriptShareIntro';
import { ScriptPresentationView } from './ScriptPresentationView';
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
  shareMode: 'presentation' | 'table';
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
  shareMode,
  script,
  projectTitle,
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
  const [showIntro, setShowIntro] = useState(true);
  const [columnConfig, setColumnConfig] = useState<ScriptColumnConfig>({
    audio: true, visual: true, notes: true, reference: true, storyboard: true,
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSlug, setShowSlug] = useState(true);
  const [showDesc, setShowDesc] = useState(true);
  const [containerIdx, setContainerIdx] = useState(0);
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
  const computedScenes = (computed as unknown as { id: string; sceneNumber: number; int_ext: string; location_name: string; time_of_day: string; scene_description?: string | null; beats: { id: string; audio_content: string; visual_content: string; notes_content: string }[] }[]);

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

  // Build presentation slides data
  const refsByBeat: Record<string, { image_url: string }[]> = {};
  for (const ref of typedReferences) {
    const list = refsByBeat[ref.beat_id] ?? [];
    list.push(ref);
    refsByBeat[ref.beat_id] = list;
  }

  const presentationSlides = buildPresentationSlides(computedScenes, typedStoryboardFrames, refsByBeat);

  const presentationScenes = computedScenes.map(sc => ({
    id: sc.id,
    sceneNumber: sc.sceneNumber,
    location_name: sc.location_name,
    int_ext: sc.int_ext,
    time_of_day: sc.time_of_day,
    scene_description: (sc as Record<string, unknown>).scene_description as string | null ?? null,
  }));

  // Intro page
  if (showIntro) {
    return (
      <ScriptShareIntro
        scriptTitle={script.title}
        projectTitle={projectTitle}
        clientName={clientName}
        clientLogoUrl={clientLogoUrl ?? null}
        versionLabel={versionLabel}
        shareNotes={shareNotes}
        onBegin={() => setShowIntro(false)}
      />
    );
  }

  // Presentation mode
  if (shareMode === 'presentation') {
    return (
      <ScriptPresentationView
        slides={presentationSlides}
        columnConfig={columnConfig}
        onClose={() => setShowIntro(true)}
        scriptTitle={script.title}
        clientName={clientName ?? undefined}
        clientLogoUrl={clientLogoUrl}
        versionLabel={versionLabel}
        scenes={presentationScenes}
        shareId={shareId}
        viewerEmail={viewerEmail}
        viewerName={null}
      />
    );
  }

  // Table mode — existing table view
  return (
    <div className="flex flex-col h-screen bg-black text-foreground">
      {/* Title header — collapses in focus mode */}
      {!isFocused && (
        <>
          <div className="relative flex items-center px-8 py-6 border-b border-border flex-shrink-0">
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
          className={`h-full grid transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showSidebar ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'}`}
        >
          <div className="overflow-hidden min-w-0 border-r border-admin-border bg-admin-bg-sidebar h-full flex flex-col">
            <div className="flex-1 overflow-y-auto admin-scrollbar">
              {computedScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneClick(scene.id)}
                  className={`w-full text-left flex items-center gap-1 pl-1 pr-1.5 h-[43px] overflow-hidden border-b border-admin-border-subtle transition-colors ${
                    activeSceneId === scene.id
                      ? 'bg-black/40 text-admin-text-primary'
                      : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
                  }`}
                >
                  <span className="text-admin-border-subtle font-bebas text-[50px] leading-none flex-shrink-0 translate-y-[6px]">
                    {scene.sceneNumber}
                  </span>
                  <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider flex-1 min-w-0 truncate">
                    {showSlug && <>{scene.int_ext}. {scene.location_name || '\u2014'}{scene.time_of_day ? ` \u2014 ${scene.time_of_day}` : ''}</>}
                    {showDesc && scene.scene_description && (
                      <span className="text-admin-text-muted font-normal ml-2">{scene.scene_description}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex-shrink-0 border-t border-admin-border px-3 py-2 flex items-center gap-1">
              <button
                onClick={() => setShowSlug(p => !p)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${showSlug ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-ghost hover:text-admin-text-muted'}`}
                title={showSlug ? 'Hide slugs' : 'Show slugs'}
              >
                <MapPin size={14} />
              </button>
              <button
                onClick={() => setShowDesc(p => !p)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${showDesc ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-ghost hover:text-admin-text-muted'}`}
                title={showDesc ? 'Hide descriptions' : 'Show descriptions'}
              >
                <FileText size={14} />
              </button>
            </div>
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

    </div>
  );
}
