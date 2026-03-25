'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PanelLeftClose, PanelLeftOpen, SeparatorVertical, Expand, Shrink, Mail, Play, Table2, MessageSquare, Eye, ListFilter } from 'lucide-react';
import { ViewSwitcher } from '@/app/admin/_components/ViewSwitcher';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { ScriptColumnToggle } from '@/app/admin/scripts/_components/ScriptColumnToggle';
import { DEFAULT_COLUMN_ORDER } from '@/app/admin/scripts/_components/gridUtils';
import { buildPresentationSlides } from '@/app/admin/scripts/_components/presentationUtils';
import { ScriptShareIntro } from './ScriptShareIntro';
import { ScriptPresentationView } from './ScriptPresentationView';
import { ReadOnlyCanvas } from './ReadOnlyCanvas';
import { SceneNav } from '@/app/admin/scripts/_components/SceneNav';
import { SceneSidebarShell } from '@/app/admin/scripts/_components/SceneSidebarShell';
import { startScriptViewSession, updateScriptViewDuration, getShareComments } from './actions';
import { computeSceneNumbers } from '@/lib/scripts/sceneNumbers';
import { formatScriptVersion, versionColor } from '@/types/scripts';
import type { ScriptColumnConfig, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow, ScriptShareCommentRow, SharePreferences } from '@/types/scripts';

const CONTAINER_WIDTHS = ['', 'max-w-7xl', 'max-w-5xl', 'max-w-3xl'] as const;
const CONTAINER_LABELS = ['Full', 'Wide', 'Medium', 'Narrow'] as const;

const iconVariants = {
  hidden: { opacity: 0, x: 8, width: 0, marginLeft: -8 },
  visible: { opacity: 1, x: 0, width: 'auto', marginLeft: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

interface Props {
  shareId: string;
  shareNotes: string | null;
  shareMode: 'presentation' | 'table';
  sharePreferences: SharePreferences;
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
  products: Record<string, unknown>[];
  references: Record<string, unknown>[];
  storyboardFrames: Record<string, unknown>[];
  viewerEmail: string;
  viewerName: string | null;
}

export function ScriptShareClient({
  shareId,
  shareNotes,
  shareMode: _shareMode,
  sharePreferences,
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
  products: rawProducts,
  references: rawReferences,
  storyboardFrames: rawStoryboardFrames,
  viewerEmail,
  viewerName,
}: Props) {
  const [showIntro, setShowIntro] = useState(true);
  const [viewMode, setViewMode] = useState<'story' | 'table'>(sharePreferences.default_view);
  const [columnConfig, setColumnConfig] = useState<ScriptColumnConfig>(() => {
    const base: ScriptColumnConfig = { audio: true, visual: true, notes: true, reference: true, storyboard: true, comments: true };
    for (const key of Object.keys(base) as (keyof ScriptColumnConfig)[]) {
      if (sharePreferences.table_columns?.[key] === false) base[key] = false;
    }
    return base;
  });
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [commentsMap, setCommentsMap] = useState<Map<string, ScriptShareCommentRow[]>>(new Map());
  const [showSidebar, setShowSidebar] = useState(true);
  const [containerIdx, setContainerIdx] = useState(0);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [presentationActiveSceneId, setPresentationActiveSceneId] = useState<string | null>(null);
  const [presentationActiveBeatId, setPresentationActiveBeatId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [commentHideCompleted, setCommentHideCompleted] = useState(false);
  const [commentSortMode, setCommentSortMode] = useState<'script' | 'oldest' | 'newest' | 'unresolved'>('script');
  const [commentSceneFilter, setCommentSceneFilter] = useState<'current' | 'all'>('all');
  const emailBtnRef = useRef<HTMLAnchorElement>(null);
  const emailFillRef = useRef<HTMLDivElement>(null);
  const presentationToggleCommentsRef = useRef<(() => void) | null>(null);
  const presentationNavRef = useRef<{
    jumpToScene: (sceneId: string) => void;
    jumpToBeat: (beatId: string) => void;
    getActiveSceneId: () => string | null;
    getActiveBeatId: () => string | null;
  } | null>(null);

  useDirectionalFill(emailBtnRef, emailFillRef, {
    onFillStart: () => {
      setIsEmailHovered(true);
      const textSpan = emailBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      setIsEmailHovered(false);
      const textSpan = emailBtnRef.current?.querySelector('span');
      if (textSpan) gsap.to(textSpan, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
  });

  // Cast raw data to typed arrays
  const typedScenes = rawScenes as unknown as { id: string; sort_order: number; location_name: string; time_of_day: string; int_ext: string; scene_notes: string | null }[];
  const typedBeats = rawBeats as unknown as { id: string; scene_id: string; sort_order: number; audio_content: string; visual_content: string; notes_content: string; storyboard_layout: string | null }[];
  const typedCharacters = rawCharacters as unknown as ScriptCharacterRow[];
  const typedTags = rawTags as unknown as ScriptTagRow[];
  const typedLocations = rawLocations as unknown as ScriptLocationRow[];
  const typedProducts = rawProducts as unknown as ScriptProductRow[];
  const typedReferences = rawReferences as unknown as { id: string; beat_id: string; image_url: string }[];
  const typedStoryboardFrames = rawStoryboardFrames as unknown as { id: string; beat_id: string | null; scene_id: string | null; image_url: string; slot: number | null; crop_config: import('@/types/scripts').CropConfig | null }[];

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
  const computedScenes = (computed as unknown as { id: string; sceneNumber: number; int_ext: string; location_name: string; time_of_day: string; scene_description?: string | null; beats: { id: string; sort_order: number; audio_content: string; visual_content: string; notes_content: string }[] }[]);

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

    startScriptViewSession(shareId, viewerEmail, viewerName ?? undefined).then(id => {
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

  // Load comments for this share
  const loadComments = useCallback(async () => {
    if (!shareId || sharePreferences.table_columns?.comments === false) return;
    try {
      const comments = await getShareComments(shareId) as unknown as ScriptShareCommentRow[];
      const map = new Map<string, ScriptShareCommentRow[]>();
      for (const comment of comments) {
        if (!map.has(comment.beat_id)) map.set(comment.beat_id, []);
        map.get(comment.beat_id)!.push(comment);
      }
      setCommentsMap(map);
    } catch (err) {
      console.error('[Comments] Failed to load:', err);
    }
  }, [shareId, sharePreferences.table_columns?.comments]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const versionLabel = formatScriptVersion(script.majorVersion, script.minorVersion, script.isPublished);
  const nextWidth = CONTAINER_LABELS[(containerIdx + 1) % CONTAINER_WIDTHS.length];

  const handleSceneClick = (sceneId: string) => {
    setActiveSceneId(sceneId);
    const el = document.getElementById(`scene-${sceneId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBeatClick = useCallback((beatId: string) => {
    const el = document.getElementById(`beat-${beatId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const btnCls = 'h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';
  const btnOn = 'bg-admin-bg-active text-admin-text-secondary';

  // Columns disabled by admin — can't be toggled by viewer
  const excludedColumns = Object.entries(sharePreferences.table_columns ?? {})
    .filter(([, v]) => v === false)
    .map(([k]) => k as keyof ScriptColumnConfig);

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
    beats: sc.beats.map(b => ({ id: b.id, sort_order: b.sort_order })),
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

  const availableViews = [
    ...(sharePreferences.allow_story_view ? [{ key: 'story' as const, icon: Play, label: 'Story View' }] : []),
    ...(sharePreferences.allow_table_view ? [{ key: 'table' as const, icon: Table2, label: 'Table View' }] : []),
  ];

  // Unified layout
  return (
    <div className="flex flex-col h-screen bg-black text-foreground">
      {/* Title header — collapses in focus mode */}
      {!isFocused && (
        <>
          <div className="relative flex items-center px-4 py-4 md:px-8 md:py-6 border-b border-border flex-shrink-0">
            {/* Left — logos */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-5" />
              {clientLogoUrl && (
                <>
                  <span className="text-muted-foreground/30 text-lg leading-none select-none">⤫</span>
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
                <div className="flex items-center justify-center gap-2.5">
                  <h1 className="font-display text-lg font-bold text-foreground leading-tight truncate">
                    {script.title}
                  </h1>
                  <span
                    className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-admin-mono font-bold rounded-full border ${script.isPublished ? '' : 'border-dashed'}`}
                    style={{
                      borderColor: versionColor(script.majorVersion) + '40',
                      backgroundColor: script.isPublished ? versionColor(script.majorVersion) + '15' : 'transparent',
                      color: versionColor(script.majorVersion),
                    }}
                  >
                    {versionLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right — email button (hidden on mobile) */}
            <div className="ml-auto flex-shrink-0 hidden md:block">
              <a
                ref={emailBtnRef}
                href="mailto:hi@fna.wtf"
                className="relative px-5 py-2 font-medium text-white bg-black border border-white rounded-lg overflow-hidden flex items-center justify-center"
              >
                <div
                  ref={emailFillRef}
                  className="absolute inset-0 bg-white pointer-events-none"
                  style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
                />
                <span className="relative flex items-center justify-center gap-2 whitespace-nowrap text-sm" style={{ zIndex: 10 }}>
                  <motion.span
                    variants={iconVariants}
                    initial="hidden"
                    animate={isEmailHovered ? 'visible' : 'hidden'}
                    className="flex items-center"
                  >
                    <Mail size={14} strokeWidth={1.5} />
                  </motion.span>
                  hi@fna.wtf
                </span>
              </a>
            </div>
          </div>
        </>
      )}

      {/* Toolbar */}
      <div className="relative h-[3rem] flex items-center px-4 border-b border-border bg-admin-bg-inset flex-shrink-0">
        {/* Left — Scenes toggle + Fullscreen + Width */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSidebar(prev => !prev)}
            className={`${btnCls} gap-1.5 px-2 ${showSidebar ? btnOn : ''}`}
            title={showSidebar ? 'Hide scenes' : 'Show scenes'}
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            <span className="hidden md:inline text-[10px] font-semibold uppercase tracking-widest">Scenes</span>
          </button>
          <button
            onClick={() => setIsFocused(prev => !prev)}
            className={`hidden md:flex ${btnCls} w-8 ${isFocused ? btnOn : ''}`}
            title={isFocused ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFocused ? <Shrink size={16} /> : <Expand size={16} />}
          </button>
          {viewMode === 'table' && (
            <button
              onClick={() => setContainerIdx(prev => (prev + 1) % CONTAINER_WIDTHS.length)}
              className={`hidden md:flex ${btnCls} w-8 ${containerIdx !== 0 ? btnOn : ''}`}
              title={`Width: ${CONTAINER_LABELS[containerIdx]} \u2192 ${nextWidth}`}
            >
              <SeparatorVertical size={16} />
            </button>
          )}
        </div>
        {/* Center — view mode toggle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <div className="hidden md:block">
              <ViewSwitcher views={availableViews} activeView={viewMode} showLabels onChange={(mode) => setViewMode(mode)} />
            </div>
            <div className="md:hidden">
              <ViewSwitcher views={availableViews} activeView={viewMode} onChange={(mode) => setViewMode(mode)} />
            </div>
          </div>
        </div>
        {/* Right — mode-dependent controls */}
        <div className="ml-auto flex-shrink-0">
          {viewMode === 'table' ? (
            excludedColumns.length < 6 ? <ScriptColumnToggle config={columnConfig} onChange={setColumnConfig} compact exclude={excludedColumns} columnOrder={columnOrder} onColumnOrderChange={setColumnOrder} /> : null
          ) : (
            <div className="ml-auto flex-shrink-0 flex items-center gap-1">
              {/* Scene filter toggle */}
              <div className="flex items-center rounded-lg border border-admin-border overflow-hidden">
                {(['current', 'all'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setCommentSceneFilter(mode)}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                      commentSceneFilter === mode
                        ? 'bg-admin-bg-active text-admin-text-secondary'
                        : 'text-admin-text-ghost hover:text-admin-text-muted'
                    }`}
                  >
                    {mode === 'current' ? 'Scene' : 'All'}
                  </button>
                ))}
              </div>
              {/* Filter button */}
              <button
                onClick={() => setCommentHideCompleted(prev => !prev)}
                className={`${btnCls} w-8 ${commentHideCompleted ? btnOn : ''}`}
                title={commentHideCompleted ? 'Show resolved' : 'Hide resolved'}
              >
                <Eye size={16} />
              </button>
              {/* Sort button */}
              <button
                onClick={() => {
                  const modes = ['script', 'oldest', 'newest', 'unresolved'] as const;
                  const idx = modes.indexOf(commentSortMode);
                  setCommentSortMode(modes[(idx + 1) % modes.length]);
                }}
                className={`${btnCls} w-8 ${commentSortMode !== 'script' ? btnOn : ''}`}
                title={`Sort: ${commentSortMode}`}
              >
                <ListFilter size={16} />
              </button>
              {/* Comments toggle */}
              <button
                onClick={() => presentationToggleCommentsRef.current?.()}
                className={`${btnCls} gap-1.5 px-2 w-auto`}
                title="Comments"
              >
                <MessageSquare size={16} />
                <span className="text-[10px] font-semibold uppercase tracking-widest">
                  Comments{commentsMap.size > 0 ? ` (${Array.from(commentsMap.values()).reduce((sum, arr) => sum + arr.length, 0)})` : ''}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0">
        {/* Shared scene sidebar */}
        <SceneSidebarShell open={showSidebar}>
          <SceneNav
            scenes={viewMode === 'table'
              ? computedScenes.map(s => ({
                  id: s.id,
                  sceneNumber: s.sceneNumber,
                  int_ext: s.int_ext,
                  location_name: s.location_name,
                  time_of_day: s.time_of_day,
                  scene_description: s.scene_description ?? null,
                  beats: s.beats.map(b => ({ id: b.id, sort_order: b.sort_order })),
                }))
              : presentationScenes}
            activeSceneId={viewMode === 'table' ? activeSceneId : presentationActiveSceneId}
            onSelectScene={viewMode === 'table' ? handleSceneClick : (id) => presentationNavRef.current?.jumpToScene(id)}
            onSelectBeat={viewMode === 'table' ? handleBeatClick : (id) => presentationNavRef.current?.jumpToBeat(id)}
            activeBeatId={viewMode === 'story' ? (presentationActiveBeatId ?? undefined) : undefined}
          />
        </SceneSidebarShell>

        {viewMode === 'table' ? (
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar">
            <div className={`${CONTAINER_WIDTHS[containerIdx]} mx-auto`}>
              <ReadOnlyCanvas
                  scenes={computedScenes}
                  columnConfig={columnConfig}
                  columnOrder={columnOrder}
                  references={typedReferences}
                  storyboardFrames={typedStoryboardFrames}
                  characters={typedCharacters}
                  tags={typedTags}
                  locations={typedLocations}
                  products={typedProducts}
                  commentsMap={commentsMap}
                  shareId={shareId}
                  onRefreshComments={loadComments}
                />
              </div>
            </div>
        ) : (
          <ScriptPresentationView
            slides={presentationSlides}
            onClose={() => setShowIntro(true)}
            scriptTitle={script.title}
            clientName={clientName ?? undefined}
            clientLogoUrl={clientLogoUrl}
            versionLabel={versionLabel}
            scenes={presentationScenes}
            shareId={shareId}
            viewerEmail={viewerEmail}
            viewerName={viewerName}
            characters={typedCharacters}
            tags={typedTags}
            locations={typedLocations}
            products={typedProducts}
            hideVisual={sharePreferences.presentation_columns?.visual === false}
            hideNotes={sharePreferences.presentation_columns?.notes === false}
            hideReference={sharePreferences.presentation_columns?.reference === false}
            hideComments={sharePreferences.presentation_columns?.comments === false}
            onRegisterCommentsToggle={(fn) => { presentationToggleCommentsRef.current = fn; }}
            onRegisterNavCallbacks={(cbs) => { presentationNavRef.current = cbs; }}
            externalSidebar
            commentHideCompleted={commentHideCompleted}
            commentSortMode={commentSortMode}
            commentSceneFilter={commentSceneFilter}
            currentSceneId={presentationActiveSceneId}
            onSlideChange={(sceneId, beatId) => { setPresentationActiveSceneId(sceneId); setPresentationActiveBeatId(beatId); }}
          />
        )}
      </div>

    </div>
  );
}
