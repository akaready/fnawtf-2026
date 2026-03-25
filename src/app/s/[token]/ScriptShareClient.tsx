'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { List, SeparatorVertical, Expand, Shrink, Mail, Play, Table2, MessageSquare, Eye, ListFilter, User, Check, Camera } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewSwitcher } from '@/app/admin/_components/ViewSwitcher';
import { ScriptColumnToggle } from '@/app/admin/scripts/_components/ScriptColumnToggle';
import { DEFAULT_COLUMN_ORDER } from '@/app/admin/scripts/_components/gridUtils';
import { buildPresentationSlides } from '@/app/admin/scripts/_components/presentationUtils';
import { ScriptShareIntro } from './ScriptShareIntro';
import { ScriptPresentationView } from './ScriptPresentationView';
import { ReadOnlyCanvas } from './ReadOnlyCanvas';
import { SceneBottomSheet } from './SceneBottomSheet';
import { CommentBottomSheet } from './CommentBottomSheet';
import { SceneNav } from '@/app/admin/scripts/_components/SceneNav';
import { SceneSidebarShell } from '@/app/admin/scripts/_components/SceneSidebarShell';
import { startScriptViewSession, updateScriptViewDuration, getShareComments, getViewerProfile, updateViewerProfile, uploadViewerAvatar } from './actions';
import { computeSceneNumbers } from '@/lib/scripts/sceneNumbers';
import { formatScriptVersion, versionColor } from '@/types/scripts';
import type { ScriptColumnConfig, ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow, ScriptShareCommentRow, SharePreferences } from '@/types/scripts';

const CONTAINER_WIDTHS = ['', 'max-w-7xl', 'max-w-5xl', 'max-w-3xl'] as const;
const CONTAINER_LABELS = ['Full', 'Wide', 'Medium', 'Narrow'] as const;

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
  const [showSidebar, setShowSidebar] = useState(false);
  const userWantsSidebar = useRef(false);

  // Auto-collapse scenes sidebar when viewport is narrow
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 1100) {
        setShowSidebar(false);
      } else {
        setShowSidebar(userWantsSidebar.current);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [containerIdx, setContainerIdx] = useState(0);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [presentationActiveSceneId, setPresentationActiveSceneId] = useState<string | null>(null);
  const [presentationActiveBeatId, setPresentationActiveBeatId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [commentHideCompleted, setCommentHideCompleted] = useState(false);
  const [commentSortMode, setCommentSortMode] = useState<'script' | 'oldest' | 'newest' | 'unresolved'>('script');
  const [commentSceneFilter, setCommentSceneFilter] = useState<'current' | 'all'>('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const userPopoverRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSceneSheetOpen, setMobileSceneSheetOpen] = useState(false);
  const [mobileCommentSheetOpen, setMobileCommentSheetOpen] = useState(false);
  const presentationToggleCommentsRef = useRef<(() => void) | null>(null);
  const presentationNavRef = useRef<{
    jumpToScene: (sceneId: string) => void;
    jumpToBeat: (beatId: string) => void;
    getActiveSceneId: () => string | null;
    getActiveBeatId: () => string | null;
  } | null>(null);

  // Profile editor state
  const [profileFirstName, setProfileFirstName] = useState(viewerName?.split(' ')[0] ?? '');
  const [profileLastName, setProfileLastName] = useState(viewerName?.split(' ').slice(1).join(' ') ?? '');
  const profileEmail = viewerEmail;
  const [profileColor, setProfileColor] = useState('#e67e22');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    getViewerProfile(viewerEmail).then(p => {
      if (p) {
        if (p.first_name) setProfileFirstName(p.first_name);
        if (p.last_name) setProfileLastName(p.last_name);
        if (p.avatar_color) setProfileColor(p.avatar_color);
        if (p.headshot_url) setProfileAvatarUrl(p.headshot_url);
      }
    });
  }, [viewerEmail]);

  // Click-outside handler for user popover
  useEffect(() => {
    if (!userPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (userPopoverRef.current && !userPopoverRef.current.contains(e.target as Node)) {
        setUserPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userPopoverOpen]);

  // Click-outside handler for filter dropdown (check both trigger + portaled menu)
  useEffect(() => {
    if (!filterDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (filterDropdownRef.current?.contains(t) || filterMenuRef.current?.contains(t)) return;
      setFilterDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterDropdownOpen]);

  // Click-outside handler for sort dropdown (check both trigger + portaled menu)
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sortDropdownRef.current?.contains(t) || sortMenuRef.current?.contains(t)) return;
      setSortDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortDropdownOpen]);

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
      <AnimatePresence>
      {!isFocused && (
        <motion.div
          key="share-header"
          initial={{ height: 'auto', opacity: 1 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          {/* Mobile header */}
          <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex-1 min-w-0">
              {clientName && <p className="text-[10px] text-muted-foreground/50 truncate">{clientName}</p>}
              <div className="flex items-center gap-2">
                <h1 className="font-display text-sm font-bold text-foreground truncate">{script.title}</h1>
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-admin-mono font-bold rounded-full border"
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
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-admin-md border border-white/20 text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <User size={16} />
            </button>
          </div>
          {/* Mobile menu overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute right-4 top-16 w-[250px] bg-admin-bg-raised border border-admin-border rounded-admin-md shadow-xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 pb-3 border-b border-admin-border">
                  <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-4" />
                  {clientLogoUrl && (
                    <>
                      <span className="text-muted-foreground/30 text-sm select-none">&#x2922;</span>
                      <img src={clientLogoUrl} alt="" className="h-4 object-contain admin-logo" />
                    </>
                  )}
                </div>
                {clientName && (
                  <p className="text-admin-sm text-admin-text-faint">{clientName}</p>
                )}
                <a href="mailto:hi@fna.wtf" className="flex items-center gap-2 text-admin-sm text-white/70 hover:text-white transition-colors">
                  <Mail size={14} /> hi@fna.wtf
                </a>
              </div>
            </div>
          )}
          {/* Desktop header */}
          <div className="relative hidden md:flex items-center px-4 py-4 md:px-8 md:py-6 border-b border-border flex-shrink-0">
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
              <div className="text-center min-w-0 max-w-[50%]">
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

            {/* Right — user settings + email */}
            <div className="ml-auto flex-shrink-0 hidden md:flex items-center gap-2">
              {/* User settings popover */}
              <div className="relative" ref={userPopoverRef}>
                <button
                  onClick={() => setUserPopoverOpen(prev => !prev)}
                  className="w-10 h-10 flex items-center justify-center rounded-admin-md border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors overflow-hidden"
                  title="Profile settings"
                >
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </button>
                {userPopoverOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[320px] bg-[#111] border border-admin-border rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-admin-sm text-admin-text-faint">Commenting as:</p>
                      <p className="text-admin-sm text-white font-medium">{profileFirstName || profileLastName ? `${profileFirstName} ${profileLastName}`.trim() : viewerEmail} <span className="text-admin-text-faint">({profileEmail})</span></p>
                    </div>
                    {/* Body */}
                    <div className="px-4 py-4 space-y-4">
                      {/* Avatar */}
                      <div className="flex justify-center">
                        <div className="relative group/avatar flex-shrink-0">
                          <div
                            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-admin-lg font-bold"
                            style={{ backgroundColor: profileAvatarUrl ? undefined : profileColor }}
                          >
                            {profileAvatarUrl ? (
                              <img src={profileAvatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(profileFirstName?.[0] ?? viewerEmail[0] ?? '?').toUpperCase()}</span>
                            )}
                          </div>
                          <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                          >
                            <Camera size={16} className="text-white" />
                          </button>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const fd = new FormData();
                              fd.append('file', file);
                              fd.append('email', viewerEmail);
                              try {
                                const url = await uploadViewerAvatar(fd);
                                setProfileAvatarUrl(url);
                              } catch (err) {
                                console.error('Avatar upload failed:', err);
                              }
                            }}
                          />
                        </div>
                      </div>
                      {/* Color picker */}
                      {!profileAvatarUrl && (
                        <div className="flex items-center justify-between">
                          {['#ef4444','#e67e22','#f59e0b','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899'].map(color => (
                            <button
                              key={color}
                              onClick={() => setProfileColor(color)}
                              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: color,
                                borderColor: profileColor === color ? 'white' : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {/* Name inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={profileFirstName}
                          onChange={(e) => setProfileFirstName(e.target.value)}
                          placeholder="First name"
                          className="w-full px-3 py-2 text-admin-sm bg-white/[0.06] border border-white/[0.14] rounded-lg text-white placeholder:text-admin-text-faint outline-none focus:border-white/30"
                        />
                        <input
                          type="text"
                          value={profileLastName}
                          onChange={(e) => setProfileLastName(e.target.value)}
                          placeholder="Last name"
                          className="w-full px-3 py-2 text-admin-sm bg-white/[0.06] border border-white/[0.14] rounded-lg text-white placeholder:text-admin-text-faint outline-none focus:border-white/30"
                        />
                      </div>
                      {/* Email (read-only) */}
                      <input
                        type="email"
                        value={profileEmail}
                        readOnly
                        className="w-full px-3 py-2 text-admin-sm bg-white/[0.06] border border-white/[0.14] rounded-lg text-admin-text-faint outline-none cursor-not-allowed"
                      />
                    </div>
                    {/* Footer — Save + Cancel */}
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
                      <button
                        disabled={profileSaving}
                        onClick={async () => {
                          setProfileSaving(true);
                          try {
                            await updateViewerProfile(
                              viewerEmail,
                              profileFirstName,
                              profileLastName,
                              profileAvatarUrl ? undefined : profileColor,
                              false,
                            );
                            setUserPopoverOpen(false);
                          } catch (err) {
                            console.error('Profile save failed:', err);
                          } finally {
                            setProfileSaving(false);
                          }
                        }}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setUserPopoverOpen(false)}
                        className="btn-secondary px-3 py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Email button */}
              <a
                href="mailto:hi@fna.wtf"
                className="w-10 h-10 flex items-center justify-center rounded-admin-md border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors"
                title="hi@fna.wtf"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="relative h-[3rem] flex items-center px-4 border-b border-border bg-admin-bg-inset flex-shrink-0 overflow-hidden">
        {/* Left — Scenes toggle + Fullscreen + Width */}
        <div className="flex items-center gap-1">
          {/* Desktop: sidebar toggle; Mobile: bottom sheet trigger */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setMobileSceneSheetOpen(true);
              } else {
                setShowSidebar(prev => { userWantsSidebar.current = !prev; return !prev; });
              }
            }}
            className={`${btnCls} gap-1.5 px-2 ${showSidebar ? btnOn : ''}`}
            title={showSidebar ? 'Hide scenes' : 'Show scenes'}
          >
            <List size={16} />
            <span className="hidden md:inline text-[10px] font-semibold uppercase tracking-widest">Scenes</span>
          </button>
          <button
            onClick={() => setIsFocused(prev => !prev)}
            className={`${btnCls} w-8 hidden md:flex ${isFocused ? btnOn : ''}`}
            title={isFocused ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFocused ? <Shrink size={16} /> : <Expand size={16} />}
          </button>
          {viewMode === 'table' && (
            <button
              onClick={() => setContainerIdx(prev => (prev + 1) % CONTAINER_WIDTHS.length)}
              className={`${btnCls} w-8 hidden md:flex ${containerIdx !== 0 ? btnOn : ''}`}
              title={`Width: ${CONTAINER_LABELS[containerIdx]} \u2192 ${nextWidth}`}
            >
              <SeparatorVertical size={16} />
            </button>
          )}
        </div>
        {/* Center — view mode toggle */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          <div className="hidden md:block">
            <ViewSwitcher views={availableViews} activeView={viewMode} showLabels onChange={(mode) => setViewMode(mode)} />
          </div>
          <div className="md:hidden">
            <ViewSwitcher views={availableViews} activeView={viewMode} onChange={(mode) => setViewMode(mode)} />
          </div>
        </div>
        {/* Right — mode-dependent controls */}
        <div className="flex-shrink-0 overflow-hidden">
          <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div key="table-controls" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            {excludedColumns.length < 6 ? <ScriptColumnToggle config={columnConfig} onChange={setColumnConfig} compact exclude={excludedColumns} columnOrder={columnOrder} onColumnOrderChange={setColumnOrder} /> : null}
            </motion.div>
          ) : (
            <motion.div key="story-controls" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-1">
              <AnimatePresence>
                {commentsOpen && (
                  <>
                  <motion.div
                    key="filter-btn"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  >
              {/* Filter dropdown */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => { setFilterDropdownOpen(prev => !prev); setSortDropdownOpen(false); }}
                  className={`${btnCls} w-8 ${(commentHideCompleted || commentSceneFilter !== 'all') ? btnOn : ''}`}
                  title="Filter comments"
                >
                  <Eye size={16} />
                </button>
                {filterDropdownOpen && createPortal(
                  <div
                    ref={filterMenuRef}
                    className="fixed bg-admin-bg-raised border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[180px] z-[9999]"
                    style={{
                      top: (filterDropdownRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                      right: window.innerWidth - (filterDropdownRef.current?.getBoundingClientRect().right ?? 0),
                    }}
                  >
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-admin-text-faint/50">By Scene</p>
                    {(['all', 'current'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setCommentSceneFilter(mode)}
                        className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center justify-between"
                      >
                        {mode === 'all' ? 'All Scenes' : 'Current Scene'}
                        {commentSceneFilter === mode && <Check size={14} className="text-admin-info" />}
                      </button>
                    ))}
                    <div className="border-t border-admin-border my-1" />
                    <button
                      onClick={() => setCommentHideCompleted(prev => !prev)}
                      className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center justify-between"
                    >
                      Hide Resolved
                      {commentHideCompleted && <Check size={14} className="text-admin-info" />}
                    </button>
                  </div>,
                  document.body
                )}
              </div>
              </motion.div>
              <motion.div
                key="sort-btn"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
              {/* Sort dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => { setSortDropdownOpen(prev => !prev); setFilterDropdownOpen(false); }}
                  className={`${btnCls} w-8 ${commentSortMode !== 'script' ? btnOn : ''}`}
                  title="Sort comments"
                >
                  <ListFilter size={16} />
                </button>
                {sortDropdownOpen && createPortal(
                  <div
                    ref={sortMenuRef}
                    className="fixed bg-admin-bg-raised border border-admin-border rounded-admin-md shadow-xl py-1 min-w-[170px] z-[9999]"
                    style={{
                      top: (sortDropdownRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                      right: window.innerWidth - (sortDropdownRef.current?.getBoundingClientRect().right ?? 0),
                    }}
                  >
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-admin-text-faint/50">Sort by...</p>
                    {([
                      { key: 'script' as const, label: 'Script Order' },
                      { key: 'oldest' as const, label: 'Oldest' },
                      { key: 'newest' as const, label: 'Newest' },
                      { key: 'unresolved' as const, label: 'Unresolved' },
                    ]).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setCommentSortMode(opt.key); setSortDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-admin-sm text-white hover:bg-admin-bg-hover transition-colors flex items-center justify-between"
                      >
                        {opt.label}
                        {commentSortMode === opt.key && <Check size={14} className="text-admin-info" />}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
                  </motion.div>
                  </>
                )}
              </AnimatePresence>
              {/* Comments toggle */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setMobileCommentSheetOpen(true);
                  } else {
                    presentationToggleCommentsRef.current?.();
                  }
                }}
                className={`${btnCls} gap-1.5 px-2 w-auto`}
                title="Comments"
              >
                <MessageSquare size={16} />
                <span className="hidden md:inline text-[10px] font-semibold uppercase tracking-widest">
                  Comments{commentsMap.size > 0 ? ` (${Array.from(commentsMap.values()).reduce((sum, arr) => sum + arr.length, 0)})` : ''}
                </span>
              </button>
            </motion.div>
          )}
          </AnimatePresence>
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

        <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div key="table-content" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="flex-1 min-w-0 overflow-y-auto admin-scrollbar">
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
            </motion.div>
        ) : (
          <motion.div key="story-content" initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="flex-1 flex min-h-0">
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
            onCommentsOpenChange={setCommentsOpen}
            commentHideCompleted={commentHideCompleted}
            commentSortMode={commentSortMode}
            commentSceneFilter={commentSceneFilter}
            currentSceneId={presentationActiveSceneId}
            onSlideChange={(sceneId, beatId) => { setPresentationActiveSceneId(sceneId); setPresentationActiveBeatId(beatId); }}
          />
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom sheets — rendered at component level, triggered by toolbar */}
      {mobileSceneSheetOpen && (
        <div className="md:hidden">
          <SceneBottomSheet
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
            activeSceneId={(viewMode === 'table' ? activeSceneId : presentationActiveSceneId) ?? ''}
            onSelectScene={(id) => {
              if (viewMode === 'table') handleSceneClick(id); else presentationNavRef.current?.jumpToScene(id);
              setMobileSceneSheetOpen(false);
            }}
            activeBeatId={viewMode === 'story' ? (presentationActiveBeatId ?? undefined) : undefined}
            onSelectBeat={(id) => {
              if (viewMode === 'table') handleBeatClick(id); else presentationNavRef.current?.jumpToBeat(id);
              setMobileSceneSheetOpen(false);
            }}
          />
        </div>
      )}
      {mobileCommentSheetOpen && (
        <div className="md:hidden">
          <CommentBottomSheet
            shareId={shareId}
            currentBeatId={presentationActiveBeatId ?? null}
            viewerEmail={viewerEmail}
            viewerName={viewerName}
            refreshKey={0}
            slides={presentationSlides}
            onNavigateToBeat={(id) => presentationNavRef.current?.jumpToBeat(id)}
            onCommentAdded={loadComments}
          />
        </div>
      )}

    </div>
  );
}
