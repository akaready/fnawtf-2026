'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, PanelLeftOpen, ImageIcon, Send } from 'lucide-react';
import { StoryboardLayoutRenderer } from '@/app/admin/scripts/_components/StoryboardLayoutRenderer';
import type { StoryboardSlotFrame } from '@/types/scripts';




import { CommentSidebar } from './CommentSidebar';
import { SceneNav } from '@/app/admin/scripts/_components/SceneNav';
import { SceneSidebarShell } from '@/app/admin/scripts/_components/SceneSidebarShell';
import { CommentBottomSheet } from './CommentBottomSheet';
import { SceneBottomSheet } from './SceneBottomSheet';
import { addComment, getCommentAuthors } from './actions';
import type { CommentAuthor } from './actions';
import { ScriptPresentationTimeline } from '@/app/admin/scripts/_components/ScriptPresentationTimeline';
import { markdownToHtml } from '@/lib/scripts/parseContent';
import type { PresentationSlide } from '@/app/admin/scripts/_components/presentationUtils';
import type { ScriptCharacterRow, ScriptTagRow, ScriptLocationRow, ScriptProductRow } from '@/types/scripts';

/* ─── Optimized image URL via Next.js image loader ─── */

const MOBILE_BP = 768;
function optimizedImageUrl(src: string, width: number, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
function responsiveImageUrl(src: string): string {
  if (typeof window === 'undefined') return src;
  return optimizedImageUrl(src, window.innerWidth < MOBILE_BP ? 640 : 1200);
}

/* ─── CrossfadeImage (copied from ScriptPresentation.tsx) ─── */

function CrossfadeImage({ src, alt, duration }: { src: string | null; alt: string; duration: number }) {
  const [layers, setLayers] = useState<{ src: string | null; key: number }[]>([{ src, key: 0 }]);
  const counterRef = useRef(0);

  useEffect(() => {
    counterRef.current++;
    const newKey = counterRef.current;
    setLayers(prev => [
      ...prev.slice(-1),
      { src, key: newKey },
    ]);
    const timer = setTimeout(() => {
      setLayers(prev => prev.length > 1 ? prev.slice(-1) : prev);
    }, duration * 1000 + 50);
    return () => clearTimeout(timer);
  }, [src, duration]);

  const topLayer = layers[layers.length - 1];
  const bgLayer = layers.length > 1 ? layers[layers.length - 2] : null;

  return (
    <div className="relative rounded-lg overflow-hidden">
      {topLayer.src && (
        <img
          key={topLayer.key}
          src={responsiveImageUrl(topLayer.src)}
          alt={alt}
          className="w-full h-full select-none"
          draggable={false}
          style={{ objectFit: 'contain' }}
        />
      )}
      {bgLayer?.src && (
        <img
          key={bgLayer.key}
          src={responsiveImageUrl(bgLayer.src)}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          draggable={false}
          style={{ maxHeight: '55vh', objectFit: 'contain', opacity: 0, transition: `opacity ${duration}s cubic-bezier(0.32, 0.72, 0, 1)` }}
        />
      )}
    </div>
  );
}

/* ─── PresentationCell — renders markdown with mention support ─── */

function PresentationCell({
  content, characters, tags, locations, products, mounted, className,
}: {
  content: string;
  characters: ScriptCharacterRow[];
  tags: ScriptTagRow[];
  locations: ScriptLocationRow[];
  products: ScriptProductRow[];
  mounted: boolean;
  className: string;
}) {
  const html = mounted ? markdownToHtml(content || '', characters, tags, locations, products) : '';
  if (!mounted || !content) return <div className={className} style={{ color: '#333' }}>&mdash;</div>;
  // markdownToHtml output is already DOMPurify-sanitized
  return <div className={`${className} [&_strong]:font-bold`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ─── Types ─── */

interface Props {
  slides: PresentationSlide[];
  onClose: () => void;
  scriptTitle: string;
  clientName?: string;
  clientLogoUrl?: string | null;
  versionLabel?: string;
  scenes: Array<{
    id: string;
    sceneNumber: number;
    location_name: string;
    int_ext: string;
    time_of_day: string;
    scene_description: string | null;
    beats?: { id: string; sort_order: number }[];
  }>;
  shareId: string;
  viewerEmail: string;
  viewerName: string | null;
  characters?: ScriptCharacterRow[];
  tags?: ScriptTagRow[];
  locations?: ScriptLocationRow[];
  products?: ScriptProductRow[];
}

/* ─── Component ─── */

export function ScriptPresentationView({
  slides,
  onClose: _onClose,
  scriptTitle,
  clientName,
  clientLogoUrl: _clientLogoUrl,
  versionLabel,
  scenes,
  shareId,
  viewerEmail,
  viewerName,
  characters = [],
  tags = [],
  locations = [],
  products = [],
}: Props) {
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [commentAuthors, setCommentAuthors] = useState<Record<string, CommentAuthor[]>>({});
  const [scrollToEmail, setScrollToEmail] = useState<string | null>(null);

  useEffect(() => {
    getCommentAuthors(shareId).then(setCommentAuthors);
  }, [shareId]);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  // Track what the user wants open — resize hides/shows based on these
  const userWantsLeft = useRef(false);
  const userWantsRight = useRef(false);

  const toggleLeft = useCallback(() => {
    setLeftOpen(prev => {
      userWantsLeft.current = !prev;
      return !prev;
    });
  }, []);

  const toggleRight = useCallback(() => {
    setRightOpen(prev => {
      userWantsRight.current = !prev;
      return !prev;
    });
  }, []);

  // Auto-collapse sidebars based on window width, respecting user intent
  // One sidebar fits above 1100px, both fit above 1700px
  const ONE_SIDEBAR_BP = 1100;
  const TWO_SIDEBAR_BP = 1700;

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;

      if (w >= TWO_SIDEBAR_BP) {
        // Enough room for both — show whatever user wants (default both on initial load)
        setLeftOpen(userWantsLeft.current);
        setRightOpen(userWantsRight.current);
      } else if (w >= ONE_SIDEBAR_BP) {
        // Room for one sidebar — keep whichever the user has open
        // If both wanted, hide scenes first (keep comments)
        if (userWantsLeft.current && userWantsRight.current) {
          setLeftOpen(false);
          setRightOpen(true);
        } else {
          setLeftOpen(userWantsLeft.current);
          setRightOpen(userWantsRight.current);
        }
      } else {
        // Too narrow for any sidebar
        setLeftOpen(false);
        setRightOpen(false);
      }
    };

    // On mount, default both wanted
    userWantsLeft.current = true;
    userWantsRight.current = true;
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [commentText, setCommentText] = useState('');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const current = slides[idx];

  const handleCommentSubmit = useCallback(() => {
    if (!commentText.trim() || !current?.beatId) return;
    if (!shareId) return;
    const content = commentText.trim();
    setCommentText('');
    if (commentTextareaRef.current) commentTextareaRef.current.style.height = 'auto';
    addComment(shareId, current.beatId, viewerEmail, viewerName, content)
      .then(() => {
        setCommentRefreshKey(k => k + 1);
        getCommentAuthors(shareId).then(setCommentAuthors);
      })
      .catch(() => {});
  }, [commentText, shareId, current?.beatId, viewerEmail, viewerName]);

  const handleCommentAdded = useCallback(() => {
    setCommentRefreshKey(k => k + 1);
    getCommentAuthors(shareId).then(setCommentAuthors);
  }, [shareId]);

  const handleClickCommentAvatar = useCallback((beatId: string, email: string) => {
    // Jump to the beat
    const slideIdx = slides.findIndex(s => s.beatId === beatId);
    if (slideIdx >= 0) setIdx(slideIdx);
    // Open comment sidebar (desktop) or bottom sheet will handle via its own state
    if (window.innerWidth >= 768) {
      setRightOpen(true);
      userWantsRight.current = true;
    }
    setScrollToEmail(email);
  }, [slides]);
  const prev = idx > 0 ? slides[idx - 1] : null;
  const isSceneChange = prev !== null && prev.sceneId !== current.sceneId;
  const dissolveDuration = isSceneChange ? 0.5 : 0.35;

  /* ── Preload adjacent images ── */
  useEffect(() => {
    const urls: string[] = [];
    if (idx > 0 && slides[idx - 1].storyboardImageUrl) urls.push(slides[idx - 1].storyboardImageUrl!);
    if (idx < slides.length - 1 && slides[idx + 1].storyboardImageUrl) urls.push(slides[idx + 1].storyboardImageUrl!);
    urls.forEach(url => {
      const img = new Image();
      img.src = responsiveImageUrl(url);
    });
  }, [idx, slides]);

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    setIdx(i => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIdx(i => Math.max(i - 1, 0));
  }, []);

  const handleSeek = useCallback((i: number) => {
    setIdx(Math.max(0, Math.min(i, slides.length - 1)));
  }, [slides.length]);

  /* ── Keyboard nav ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  /* ── Swipe nav on mobile images ── */
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [goNext, goPrev]);

  /* ── Scene lookup: which scene is current? ── */
  const activeSceneId = current.sceneId;

  /* ── Jump to scene's first beat ── */
  const jumpToScene = useCallback((sceneId: string) => {
    const slideIdx = slides.findIndex(s => s.sceneId === sceneId);
    if (slideIdx >= 0) setIdx(slideIdx);
  }, [slides]);

  /* ── Jump to specific beat ── */
  const jumpToBeat = useCallback((beatId: string) => {
    const slideIdx = slides.findIndex(s => s.beatId === beatId);
    if (slideIdx >= 0) setIdx(slideIdx);
  }, [slides]);

  /* ── Active beat ID ── */
  const activeBeatId = current?.beatId ?? null;

  /* ── Build content panels ── */
  const showVisual = !!current.visualContent.trim();
  const showNotes = !!current.notesContent.trim();
  const showReference = current.referenceImageUrls.length > 0;

  /* ── Scene heading text ── */
  const activeScene = scenes.find(s => s.id === activeSceneId);
  const sceneHeading = activeScene
    ? `${activeScene.int_ext}. ${activeScene.location_name || 'UNTITLED LOCATION'} ${activeScene.time_of_day ? `\u2014 ${activeScene.time_of_day}` : ''}`.trim()
    : current.sceneName;

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* ════ LEFT SIDEBAR — Scene Nav ════ */}
      <div className="hidden md:block relative flex-shrink-0 h-full">
        {/* Re-open button — always rendered, hidden behind sidebar via z-index */}
        <button
          onClick={() => toggleLeft()}
          className={`absolute left-4 top-4 z-[5] h-8 flex items-center gap-1.5 px-3 rounded bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-opacity duration-300 ${leftOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          title="Show scenes"
        >
          <PanelLeftOpen size={16} />
          <span className="text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Scenes</span>
        </button>

        <SceneSidebarShell open={leftOpen} className="z-10 relative">
            <SceneNav
              scenes={scenes}
              activeSceneId={activeSceneId}
              onSelectScene={jumpToScene}
              activeBeatId={activeBeatId}
              onSelectBeat={jumpToBeat}
              showHeader
              onCollapse={() => toggleLeft()}
            />
        </SceneSidebarShell>
      </div>

      {/* ════ CENTER COLUMN ════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile: scene nav top-left, comments top-right */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <SceneBottomSheet
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={jumpToScene}
            activeBeatId={activeBeatId}
            onSelectBeat={jumpToBeat}
          />
        </div>
        <div className="md:hidden absolute top-4 right-4 z-30">
          <CommentBottomSheet
            shareId={shareId}
            currentBeatId={current?.beatId ?? null}
            viewerEmail={viewerEmail}
            viewerName={viewerName}
            refreshKey={commentRefreshKey}
            slides={slides}
            onNavigateToBeat={jumpToBeat}
            onCommentAdded={handleCommentAdded}
          />
        </div>
        {/* Scrollable center content */}
        <div className="flex-1 flex flex-col items-center px-4 md:px-6 pt-4 min-h-0 overflow-y-scroll admin-scrollbar">

          {/* Compact title — pushes image down, keeps scene/comment buttons from overlapping */}
          {(clientName || scriptTitle) && (
            <div className="w-full max-w-5xl flex-shrink-0 text-center pb-3">
              {clientName && (
                <p className="text-[#555] text-[10px] uppercase tracking-widest mb-0.5">{clientName}</p>
              )}
              {scriptTitle && (
                <p className="text-[#ccc] text-sm font-medium">
                  {scriptTitle}
                  {versionLabel && (() => {
                    const colors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6'];
                    const color = colors[(parseInt(versionLabel) || 0) % colors.length];
                    return (
                      <span className="inline-block ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full"
                        style={{ color, backgroundColor: color + '15', border: `1px solid ${color}40` }}>
                        {versionLabel}
                      </span>
                    );
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Storyboard image with nav arrows overlaid */}
          <div className="group/image relative w-full max-w-5xl flex-shrink-0 rounded-lg overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {/* Nav arrows — bottom center of image, visible on hover */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/image:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                disabled={idx === 0}
                className="p-3 rounded-full bg-black/50 text-white/60 hover:bg-black/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                disabled={idx >= slides.length - 1}
                className="p-3 rounded-full bg-black/50 text-white/60 hover:bg-black/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="w-full bg-[#0a0a0a]" style={{ aspectRatio: '16/9' }}>
              {current.storyboardFrames && current.storyboardFrames.length > 1 && current.storyboard_layout && current.storyboard_layout !== 'single' ? (
                <StoryboardLayoutRenderer
                  layout={current.storyboard_layout}
                  frames={current.storyboardFrames as StoryboardSlotFrame[]}
                  size="full"
                  gap={3}
                />
              ) : current.storyboardImageUrl ? (
                <CrossfadeImage
                  src={current.storyboardImageUrl}
                  alt={`Scene ${current.sceneNumber} \u2014 Beat ${current.beatLetter}`}
                  duration={dissolveDuration}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={32} className="text-[#222]" />
                  <span className="text-[#2a2a2a] text-xs font-mono">
                    {current.sceneNumber}{current.beatLetter}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="w-full max-w-5xl flex-shrink-0 mt-3 mb-2 md:mt-6 md:mb-4">
            <ScriptPresentationTimeline
              slides={slides}
              currentIndex={idx}
              onSeek={handleSeek}
              commentAuthors={commentAuthors}
              onClickCommentAvatar={handleClickCommentAvatar}
            />
          </div>

          {/* ── Bordered content block: scene heading + all beat cells ── */}
          <div className="w-full max-w-5xl flex-shrink-0 border border-border rounded-lg overflow-hidden mb-6">
            {/* Scene heading */}
            <div className="flex items-center gap-0 bg-[#141414] border-b border-border min-h-[44px]">
              <span className="text-admin-border font-bebas text-[44px] leading-none flex-shrink-0 translate-y-[2px] pl-1 pr-3">
                {current.sceneNumber}{slides.filter(s => s.sceneId === current.sceneId).length > 1 ? current.beatLetter : ''}
              </span>
              {/* Desktop: inline with bullet. Stacks at xl or below */}
              <div className="hidden lg:flex items-center flex-1 min-w-0">
                <span className="text-sm font-medium text-admin-text-faint uppercase tracking-wider">
                  {sceneHeading}
                  {activeScene?.scene_description && (
                    <><span className="text-admin-text-ghost mx-1.5">&bull;</span><span className="text-admin-text-muted font-normal uppercase">{activeScene.scene_description}</span></>
                  )}
                </span>
              </div>
              <div className="flex lg:hidden flex-col justify-center flex-1 min-w-0 py-1">
                <span className="text-sm font-medium text-admin-text-faint uppercase tracking-wider">
                  {sceneHeading}
                </span>
                {activeScene?.scene_description && (
                  <span className="text-sm text-admin-text-muted font-normal uppercase tracking-wider">
                    {activeScene.scene_description}
                  </span>
                )}
              </div>
            </div>

            {/* Audio (2/3) + Visual (1/3) */}
            <div className={`grid gap-px border-b border-[#1a1a1a] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] grid-cols-1 ${showVisual ? 'lg:grid-cols-4' : ''}`}>
              <div className={`border-l-2 border-l-[var(--admin-accent)] bg-[#0d0d0d] px-5 py-4 ${showVisual ? 'lg:col-span-3' : ''}`}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-2">Audio</p>
                <PresentationCell
                  content={current.audioContent}
                  characters={characters} tags={tags} locations={locations} products={products}
                  mounted={mounted}
                  className="text-base md:text-lg text-[#ccc] leading-relaxed"
                />
              </div>
              <AnimatePresence>
                {showVisual && (
                  <motion.div
                    key="visual"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-l-2 border-l-[var(--admin-info)] bg-[#0d0d0d] px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Visual</p>
                    <PresentationCell
                      content={current.visualContent}
                      characters={characters} tags={tags} locations={locations} products={products}
                      mounted={mounted}
                      className="text-sm text-[#999] leading-relaxed"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notes */}
            <AnimatePresence>
              {showNotes && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="border-l-2 border-l-[var(--admin-warning)] bg-[#0d0d0d] px-4 py-3 border-b border-[#1a1a1a]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Notes</p>
                  <PresentationCell
                    content={current.notesContent}
                    characters={characters} tags={tags} locations={locations} products={products}
                    mounted={mounted}
                    className="text-sm text-[#999] leading-relaxed"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reference */}
            <AnimatePresence>
              {showReference && (
                <motion.div
                  key="reference"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="border-l-2 border-l-[var(--admin-danger)] bg-[#0d0d0d] px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Reference</p>
                  <div className="text-sm text-[#999] leading-relaxed">
                    {current.referenceImageUrls.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {current.referenceImageUrls.map((url, i) => (
                          <img key={i} src={optimizedImageUrl(url, 256)} alt="" className="h-12 md:h-16 rounded object-cover" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#333]">&mdash;</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spacer so floating comment input doesn't block content when scrolled */}
          <div className="flex-shrink-0 h-24" />

        </div>

        {/* Floating comment input — fixed above content */}
        {current && (
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center px-4 md:px-6 pointer-events-none">
            <div className="w-full max-w-xl md:max-w-2xl pointer-events-auto">
              <div className="bg-[#111111] border border-white/[0.14] rounded-xl shadow-[0_-8px_40px_rgba(0,0,0,0.7),0_-2px_15px_rgba(0,0,0,0.5)] flex items-center gap-3 pl-4 pr-2 py-2">
                <textarea
                  ref={commentTextareaRef}
                  value={commentText}
                  onChange={e => {
                    setCommentText(e.target.value);
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  placeholder="Share feedback..."
                  rows={1}
                  style={{ overflow: 'hidden' }}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none border-none outline-none leading-relaxed"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || !shareId}
                  className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                    commentText.trim() && shareId
                      ? 'bg-white text-black border-white hover:bg-white/90'
                      : 'bg-transparent text-white/20 border-white/20'
                  } disabled:cursor-not-allowed`}
                  title={!shareId ? 'Comments available on the shared link' : 'Click or press Enter to send'}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════ RIGHT SIDEBAR — Comments ════ */}
      <CommentSidebar
        shareId={shareId}
        currentBeatId={current?.beatId ?? null}
        viewerEmail={viewerEmail}
        viewerName={viewerName}
        open={rightOpen}
        onToggle={toggleRight}
        refreshKey={commentRefreshKey}
        clientLogoUrl={_clientLogoUrl}
        slides={slides}
        onNavigateToBeat={jumpToBeat}
        onCommentAdded={handleCommentAdded}
        scrollToEmail={scrollToEmail}
        onScrollToEmailHandled={() => setScrollToEmail(null)}
      />
    </div>
  );
}
