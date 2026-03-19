'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CommentSidebar } from './CommentSidebar';
import { CommentInput } from './CommentInput';
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
          className="w-full rounded-lg select-none"
          draggable={false}
          style={{ maxHeight: '55vh', objectFit: 'contain' }}
        />
      )}
      {bgLayer?.src && (
        <img
          key={bgLayer.key}
          src={bgLayer.src}
          alt=""
          className="absolute inset-0 w-full rounded-lg pointer-events-none select-none"
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
  scriptTitle: _scriptTitle,
  clientName: _clientName,
  clientLogoUrl: _clientLogoUrl,
  versionLabel: _versionLabel,
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
    storyboard: false,
  });
  const [chromeVisible, setChromeVisible] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const chromeTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrollCooldown = useRef(false);

  const current = slides[idx];
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

  /* ── Mouse wheel nav (debounced) ── */
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollCooldown.current) return;
      scrollCooldown.current = true;
      if (e.deltaY > 0 || e.deltaX > 0) goNext();
      else if (e.deltaY < 0 || e.deltaX < 0) goPrev();
      setTimeout(() => { scrollCooldown.current = false; }, 300);
    };
    document.addEventListener('wheel', handler, { passive: false });
    return () => document.removeEventListener('wheel', handler);
  }, [goNext, goPrev]);

  /* ── Auto-hide chrome ── */
  const resetChromeTimer = useCallback(() => {
    setChromeVisible(true);
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => setChromeVisible(false), 3000);
  }, []);

  useEffect(() => {
    const handler = () => resetChromeTimer();
    document.addEventListener('mousemove', handler);
    resetChromeTimer();
    return () => {
      document.removeEventListener('mousemove', handler);
      if (chromeTimer.current) clearTimeout(chromeTimer.current);
    };
  }, [resetChromeTimer]);

  /* ── Scene lookup: which scene is current? ── */
  const activeSceneId = current.sceneId;

  /* ── Jump to scene's first beat ── */
  const jumpToScene = useCallback((sceneId: string) => {
    const slideIdx = slides.findIndex(s => s.sceneId === sceneId);
    if (slideIdx >= 0) setIdx(slideIdx);
  }, [slides]);

  /* ── Build content panels ── */
  const showAudio = colConfig.audio;
  const showVisual = colConfig.visual;
  const showNotes = colConfig.notes;
  const showReference = colConfig.reference;

  /* ── Scene heading text ── */
  const activeScene = scenes.find(s => s.id === activeSceneId);
  const sceneHeading = activeScene
    ? `${activeScene.int_ext}. ${activeScene.location_name || 'UNTITLED LOCATION'} ${activeScene.time_of_day ? `\u2014 ${activeScene.time_of_day}` : ''}`.trim()
    : current.sceneName;

  /* ── Sidebar transition class ── */
  const sidebarTransition = 'transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* ════ LEFT SIDEBAR — Scene Nav ════ */}
      <div
        className={`flex-shrink-0 h-full border-r border-admin-border bg-admin-bg-sidebar overflow-hidden ${sidebarTransition} ${leftOpen ? 'w-56' : 'w-0'}`}
      >
        <div className="w-56 h-full flex flex-col">
          {/* Header */}
          <div className="h-[3rem] flex items-center justify-between px-4 border-b border-admin-border flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-admin-text-faint">Scenes</span>
            <button
              onClick={() => setLeftOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto admin-scrollbar">
          {scenes.map((scene) => {
            const isActive = scene.id === activeSceneId;
            return (
              <button
                key={scene.id}
                onClick={() => jumpToScene(scene.id)}
                className={`w-full text-left flex items-center gap-1 px-2 py-3 border-b border-admin-border-subtle transition-colors ${
                  isActive
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-secondary'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-sm font-bold">{scene.sceneNumber}</span>
                  </div>
                  <div className="text-xs truncate uppercase tracking-wide mt-0.5 opacity-70">
                    {scene.int_ext}. {scene.location_name || '\u2014'}
                  </div>
                  {scene.time_of_day && (
                    <div className="text-xs text-admin-text-ghost">{scene.time_of_day}</div>
                  )}
                  {scene.scene_description && (
                    <div className="text-xs text-admin-text-ghost mt-0.5">[{scene.scene_description}]</div>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Left sidebar toggle (when collapsed) */}
      {!leftOpen && (
        <button
          onClick={() => setLeftOpen(true)}
          className={`absolute left-2 top-2 z-30 p-2 rounded text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-all duration-500 ${
            chromeVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* ════ CENTER COLUMN ════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Scrollable center content */}
        <div className="flex-1 flex flex-col items-center px-6 pt-4 min-h-0 overflow-y-auto admin-scrollbar">
          {/* Scene heading */}
          <div className="w-full max-w-5xl flex-shrink-0 mb-3">
            <div className="flex items-baseline gap-2.5 px-1">
              <span className="text-[#666] font-mono text-sm font-bold flex-shrink-0">
                {current.sceneNumber}{current.beatLetter}
              </span>
              <span className="text-sm font-medium text-[#999] uppercase tracking-wider truncate">
                {sceneHeading}
              </span>
              {activeScene?.scene_description && (
                <span className="text-sm text-[#555] truncate">
                  [{activeScene.scene_description}]
                </span>
              )}
            </div>
          </div>

          {/* Storyboard image with nav arrows overlaid */}
          <div className="relative w-full max-w-5xl flex-shrink-0">
            {/* Prev arrow */}
            {idx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white/50 hover:bg-black/60 hover:text-white transition-all duration-300 ${
                  chromeVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {/* Next arrow */}
            {idx < slides.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white/50 hover:bg-black/60 hover:text-white transition-all duration-300 ${
                  chromeVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            )}
            <CrossfadeImage
              src={current.storyboardImageUrl}
              alt={`Scene ${current.sceneNumber} \u2014 Beat ${current.beatLetter}`}
              duration={dissolveDuration}
            />
            {!current.storyboardImageUrl && (
              <div className="w-full rounded-lg bg-[#0a0a0a] flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                <span className="text-[#333] text-xs font-mono">
                  Scene {current.sceneNumber} \u2014 Beat {current.beatLetter}
                </span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="w-full max-w-5xl flex-shrink-0 mt-4">
            <ScriptPresentationTimeline
              slides={slides}
              currentIndex={idx}
              onSeek={handleSeek}
            />
          </div>

          {/* Column toggle dots */}
          <div className="flex justify-center mt-1 mb-3 flex-shrink-0">
            <ScriptColumnToggle
              config={colConfig}
              onChange={setColConfig}
              compact
              exclude={['storyboard']}
            />
          </div>

          {/* ── Audio (full width, content text larger) ── */}
          {showAudio && (
            <div className="w-full max-w-5xl flex-shrink-0 border-l-2 border-l-[var(--admin-accent)] bg-[#0d0d0d] px-5 py-4 mb-px">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-2">Audio</p>
              <div className="text-base text-[#ccc] leading-relaxed">
                {current.audioContent || <span className="text-[#333]">&mdash;</span>}
              </div>
            </div>
          )}

          {/* ── Three columns: Visual, Notes, Reference ── */}
          {(showVisual || showNotes || showReference) && (
            <div className="w-full max-w-5xl flex-shrink-0 mb-6">
              <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${[showVisual, showNotes, showReference].filter(Boolean).length}, minmax(0, 1fr))` }}>
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
                {showReference && (
                  <div className="border-l-2 border-l-[var(--admin-danger)] bg-[#0d0d0d] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] mb-1.5">Reference</p>
                    <div className="text-sm text-[#999] leading-relaxed">
                      {current.referenceImageUrls.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {current.referenceImageUrls.map((url, i) => (
                            <img key={i} src={url} alt="" className="h-16 rounded object-cover" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#333]">&mdash;</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Comment input — sticky bottom of center column */}
        {current && (
          <div className="flex-shrink-0">
            <CommentInput
              shareId={shareId}
              beatId={current.beatId}
              viewerEmail={viewerEmail}
              viewerName={viewerName}
              onCommentAdded={() => setCommentRefreshKey(k => k + 1)}
            />
          </div>
        )}
      </div>

      {/* ════ RIGHT SIDEBAR — Comments ════ */}
      <CommentSidebar
        shareId={shareId}
        beatId={current?.beatId ?? null}
        viewerEmail={viewerEmail}
        open={rightOpen}
        onToggle={() => setRightOpen(prev => !prev)}
        refreshKey={commentRefreshKey}
      />
    </div>
  );
}
