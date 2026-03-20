'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, PanelLeftOpen, ImageIcon, Send } from 'lucide-react';

const VERSION_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
function versionColor(major: number): string { return VERSION_COLORS[major % VERSION_COLORS.length]; }
import { CommentSidebar } from './CommentSidebar';
import { SceneNav } from '@/app/admin/scripts/_components/SceneNav';
import { CommentBottomSheet } from './CommentBottomSheet';
import { SceneBottomSheet } from './SceneBottomSheet';
import { addComment } from './actions';
import { ScriptPresentationTimeline } from '@/app/admin/scripts/_components/ScriptPresentationTimeline';
import { ScriptColumnToggle } from '@/app/admin/scripts/_components/ScriptColumnToggle';
import type { PresentationSlide } from '@/app/admin/scripts/_components/presentationUtils';
import type { ScriptColumnConfig } from '@/types/scripts';

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
    <div className="relative">
      {topLayer.src && (
        <img
          key={topLayer.key}
          src={topLayer.src}
          alt={alt}
          className="w-full rounded-lg select-none max-h-[35vh] md:max-h-[55vh]"
          draggable={false}
          style={{ objectFit: 'contain' }}
        />
      )}
      {bgLayer?.src && (
        <img
          key={bgLayer.key}
          src={bgLayer.src}
          alt=""
          className="absolute inset-0 w-full rounded-lg pointer-events-none select-none max-h-[35vh] md:max-h-[55vh]"
          draggable={false}
          style={{ maxHeight: '55vh', objectFit: 'contain', opacity: 0, transition: `opacity ${duration}s cubic-bezier(0.32, 0.72, 0, 1)` }}
        />
      )}
    </div>
  );
}

/* ─── Types ─── */

interface Props {
  slides: PresentationSlide[];
  columnConfig: ScriptColumnConfig;
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
  }>;
  shareId: string;
  viewerEmail: string;
  viewerName: string | null;
}

/* ─── Component ─── */

export function ScriptPresentationView({
  slides,
  onClose: _onClose,
  scriptTitle,
  clientName,
  clientLogoUrl,
  versionLabel,
  scenes,
  shareId,
  viewerEmail,
  viewerName,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [colConfig, setColConfig] = useState<ScriptColumnConfig>({
    audio: true,
    visual: true,
    notes: true,
    reference: true,
    storyboard: true,
  });
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [commentText, setCommentText] = useState('');

  const current = slides[idx];

  const handleCommentSubmit = useCallback(() => {
    if (!commentText.trim() || !current?.beatId) return;
    if (!shareId) return; // Preview mode — no submissions
    const content = commentText.trim();
    setCommentText('');
    addComment(shareId, current.beatId, viewerEmail, viewerName, content)
      .then(() => setCommentRefreshKey(k => k + 1))
      .catch(() => {}); // Silently fail on error
  }, [commentText, shareId, current?.beatId, viewerEmail, viewerName]);
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
      img.src = url;
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

  /* ── Scene lookup: which scene is current? ── */
  const activeSceneId = current.sceneId;

  /* ── Jump to scene's first beat ── */
  const jumpToScene = useCallback((sceneId: string) => {
    const slideIdx = slides.findIndex(s => s.sceneId === sceneId);
    if (slideIdx >= 0) setIdx(slideIdx);
  }, [slides]);

  /* ── Build content panels ── */
  const showVisual = colConfig.visual;
  const showNotes = colConfig.notes;
  const showReference = colConfig.reference;

  /* ── Scene heading text ── */
  const activeScene = scenes.find(s => s.id === activeSceneId);
  const sceneHeading = activeScene
    ? `${activeScene.int_ext}. ${activeScene.location_name || 'UNTITLED LOCATION'} ${activeScene.time_of_day ? `\u2014 ${activeScene.time_of_day}` : ''}`.trim()
    : current.sceneName;

  /* ── Sidebar transition class ── */
  const sidebarTransition = 'transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* ════ LEFT SIDEBAR — Scene Nav ════ */}
      <div className="hidden md:block relative flex-shrink-0 h-full">
        {/* Re-open button — always rendered, hidden behind sidebar via z-index */}
        <button
          onClick={() => setLeftOpen(true)}
          className={`absolute left-2 top-2 z-[5] h-8 flex items-center gap-1.5 px-2.5 rounded bg-[#1a1a1a] text-white/70 hover:bg-[#252525] hover:text-white transition-opacity duration-300 ${leftOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          title="Show scenes"
        >
          <PanelLeftOpen size={14} />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Scenes</span>
        </button>

        <div
          className={`h-full grid z-10 relative ${sidebarTransition} ${leftOpen ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'}`}
        >
          <div className="overflow-hidden min-w-0 border-r border-admin-border bg-admin-bg-sidebar h-full">
            <SceneNav
              scenes={scenes}
              activeSceneId={activeSceneId}
              onSelectScene={jumpToScene}
              showHeader
              onCollapse={() => setLeftOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* ════ CENTER COLUMN ════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile: scene nav top-left, comments top-right */}
        <div className="md:hidden absolute top-3 left-3 z-30">
          <SceneBottomSheet
            scenes={scenes}
            activeSceneId={activeSceneId}
            onJumpToScene={jumpToScene}
          />
        </div>
        <div className="md:hidden absolute top-3 right-3 z-30">
          <CommentBottomSheet
            shareId={shareId}
            beatId={current?.beatId ?? null}
            viewerEmail={viewerEmail}
            refreshKey={commentRefreshKey}
          />
        </div>
        {/* Scrollable center content */}
        <div className="flex-1 flex flex-col items-center px-4 md:px-6 pt-4 min-h-0 overflow-y-auto admin-scrollbar">
          {/* Logo bar — client first, FNA second */}
          <div className="flex items-center justify-center gap-3 pt-4 pb-2 md:pt-8 md:pb-4 flex-shrink-0">
            {clientLogoUrl && (
              <>
                <img src={clientLogoUrl} alt="" className="h-5 md:h-7 object-contain admin-logo" />
                <span className="text-[#555] text-lg">&times;</span>
              </>
            )}
            <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-5 md:h-7" />
          </div>

          {/* Title */}
          <div className="text-center pb-3 md:pb-6 flex-shrink-0">
            {clientName && (
              <p className="text-[#555] text-[10px] md:text-xs uppercase tracking-widest mb-0.5">{clientName}</p>
            )}
            <p className="text-[#ccc] text-sm md:text-base font-medium">
              {scriptTitle} Script
              {versionLabel && (() => {
                const major = parseInt(versionLabel) || 0;
                const color = versionColor(major);
                return (
                  <span
                    className="inline-block ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full"
                    style={{ borderColor: color + '40', backgroundColor: color + '15', color, border: '1px solid' }}
                  >
                    v{versionLabel}
                  </span>
                );
              })()}
            </p>
          </div>

          {/* Storyboard image with nav arrows overlaid */}
          <div className="group/image relative w-full max-w-5xl flex-shrink-0">
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
            <div className="w-full rounded-lg overflow-hidden bg-[#0a0a0a] max-h-[35vh] md:max-h-[55vh]" style={{ aspectRatio: '16/9' }}>
              {current.storyboardImageUrl ? (
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
            />
          </div>

          {/* Column toggle dots — audio + storyboard always on */}
          <div className="flex justify-center mt-1 mb-2 md:mb-3 flex-shrink-0">
            <ScriptColumnToggle
              config={colConfig}
              onChange={(c) => setColConfig({ ...c, audio: true, storyboard: true })}
              compact
            />
          </div>

          {/* Scene heading — matches table view scene header exactly */}
          <div className="w-full max-w-5xl flex-shrink-0 flex items-center gap-0 bg-[#141414] border-b border-border rounded-t h-[44px] overflow-hidden mb-px">
            <span className="text-admin-border font-bebas text-[44px] leading-none flex-shrink-0 translate-y-[2px] text-right pr-2 w-[90px]">
              {current.sceneNumber}{slides.filter(s => s.sceneId === current.sceneId).length > 1 ? current.beatLetter : ''}
            </span>
            <span className="text-xs font-medium text-admin-text-faint uppercase tracking-wider flex-1 min-w-0 truncate">
              {sceneHeading}
              {activeScene?.scene_description && (
                <><span className="text-admin-text-ghost mx-1.5">&bull;</span><span className="text-admin-text-muted font-normal">{activeScene.scene_description}</span></>
              )}
            </span>
          </div>

          {/* ── Audio (full width, content text larger) ── */}
          <div className="w-full max-w-5xl flex-shrink-0 border-l-2 border-l-[var(--admin-accent)] bg-[#0d0d0d] px-5 py-4 mb-px">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-2">Audio</p>
            <div className="text-base md:text-lg text-[#ccc] leading-relaxed">
              {current.audioContent || <span className="text-[#333]">&mdash;</span>}
            </div>
          </div>

          {/* ── Two columns: Visual + Notes ── */}
          {(showVisual || showNotes) && (
            <div className="w-full max-w-5xl flex-shrink-0 mb-px">
              <div className={`grid gap-px grid-cols-1 ${[showVisual, showNotes].filter(Boolean).length === 2 ? 'md:grid-cols-2' : ''}`}>
                {showVisual && (
                  <div className="border-l-2 border-l-[var(--admin-info)] bg-[#0d0d0d] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Visual</p>
                    <div className="text-sm text-[#999] leading-relaxed">
                      {current.visualContent || <span className="text-[#333]">&mdash;</span>}
                    </div>
                  </div>
                )}
                {showNotes && (
                  <div className="border-l-2 border-l-[var(--admin-warning)] bg-[#0d0d0d] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Notes</p>
                    <div className="text-sm text-[#999] leading-relaxed">
                      {current.notesContent || <span className="text-[#333]">&mdash;</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Reference (full width) ── */}
          {showReference && (
            <div className="w-full max-w-5xl flex-shrink-0 border-l-2 border-l-[var(--admin-danger)] bg-[#0d0d0d] px-4 py-3 mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Reference</p>
              <div className="text-sm text-[#999] leading-relaxed">
                {current.referenceImageUrls.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {current.referenceImageUrls.map((url, i) => (
                      <img key={i} src={url} alt="" className="h-12 md:h-16 rounded object-cover" />
                    ))}
                  </div>
                ) : (
                  <span className="text-[#333]">&mdash;</span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Floating comment input — fixed above content */}
        {current && (
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center px-4 md:px-6 pointer-events-none">
            <div className="w-full max-w-xl md:max-w-2xl pointer-events-auto">
              <div className="bg-[#1e1e1e] border border-white/[0.14] rounded-xl shadow-[0_-8px_40px_rgba(0,0,0,0.7),0_-2px_15px_rgba(0,0,0,0.5)] flex items-center gap-3 p-3 md:p-4">
                <textarea
                  ref={el => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                    }
                  }}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  placeholder="Share your feedback on this story beat..."
                  rows={1}
                  style={{ overflow: 'hidden' }}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none border-none outline-none leading-relaxed"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || !shareId}
                  className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                    commentText.trim() && shareId
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-white/10 text-white/20'
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
        beatId={current?.beatId ?? null}
        viewerEmail={viewerEmail}
        viewerName={viewerName}
        open={rightOpen}
        onToggle={() => setRightOpen(prev => !prev)}
        refreshKey={commentRefreshKey + idx}
      />
    </div>
  );
}
