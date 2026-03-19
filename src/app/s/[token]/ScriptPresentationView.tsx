'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  onClose,
  scriptTitle,
  clientName,
  clientLogoUrl,
  versionLabel,
  scenes,
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
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

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
        className={`flex-shrink-0 h-full border-r border-border bg-[#0a0a0a] overflow-hidden ${sidebarTransition} ${leftOpen ? 'w-[220px]' : 'w-0'}`}
      >
        <div className="w-[220px] h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <span className="text-sm font-medium text-[#888] uppercase tracking-wider">Scenes</span>
            <button
              onClick={() => setLeftOpen(false)}
              className="p-1 rounded text-[#555] hover:text-white hover:bg-[#222] transition-colors"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
          {/* Scene list */}
          <div className="flex-1 overflow-y-auto admin-scrollbar py-2">
            {scenes.map((scene) => {
              const isActive = scene.id === activeSceneId;
              return (
                <button
                  key={scene.id}
                  onClick={() => jumpToScene(scene.id)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    isActive ? 'bg-[#1a1a1a] border-l-2 border-l-white' : 'hover:bg-[#111] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono text-sm font-bold flex-shrink-0 ${isActive ? 'text-white' : 'text-[#666]'}`}>
                      {scene.sceneNumber}
                    </span>
                    <span className={`text-sm uppercase tracking-wide truncate ${isActive ? 'text-[#ccc]' : 'text-[#555]'}`}>
                      {scene.location_name || 'Untitled'}
                    </span>
                  </div>
                  <div className="ml-6 mt-0.5">
                    <span className="text-sm text-[#444]">
                      {[scene.int_ext, scene.time_of_day].filter(Boolean).join(' / ')}
                    </span>
                  </div>
                  {scene.scene_description && (
                    <p className="ml-6 mt-1 text-sm text-[#333] leading-snug line-clamp-2">
                      {scene.scene_description}
                    </p>
                  )}
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
          className={`absolute left-2 top-2 z-30 p-2 rounded text-[#555] hover:text-white hover:bg-[#222] transition-all duration-500 ${
            chromeVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* ════ CENTER COLUMN ════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 p-2 rounded text-[#666] hover:text-white hover:bg-[#222] transition-all duration-500 ${
            chromeVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <X size={20} />
        </button>

        {/* Nav arrows — overlaid on image area */}
        {idx > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-[#111] text-[#666] hover:bg-[#222] hover:text-white transition-all duration-500 ${
              chromeVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {idx < slides.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-[#111] text-[#666] hover:bg-[#222] hover:text-white transition-all duration-500 ${
              chromeVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Scrollable center content */}
        <div className="flex-1 flex flex-col items-center px-12 pt-4 min-h-0 overflow-y-auto admin-scrollbar">
          {/* Logo bar */}
          <div className="flex items-center justify-center gap-3 pt-6 pb-4 flex-shrink-0">
            <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-8" />
            {clientLogoUrl && (
              <>
                <span className="text-[#555] text-xl">&times;</span>
                <img src={clientLogoUrl} alt="" className="h-8 object-contain" />
              </>
            )}
          </div>

          {/* Title */}
          <div className="text-center pb-4 flex-shrink-0">
            {clientName && (
              <p className="text-[#555] text-sm uppercase tracking-widest mb-0.5">{clientName}</p>
            )}
            <h1 className="text-[#ccc] text-sm font-medium">
              {scriptTitle}
              {versionLabel && <span className="text-[#444] ml-2">v{versionLabel}</span>}
            </h1>
          </div>

          {/* Scene heading */}
          <div className="w-full max-w-5xl flex-shrink-0 mb-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[#555] font-mono text-sm flex-shrink-0">
                {current.sceneNumber}{current.beatLetter}
              </span>
              <span className="text-sm font-medium text-[#888] uppercase tracking-wider truncate">
                {sceneHeading}
              </span>
              {activeScene?.scene_description && (
                <span className="text-sm text-[#444] truncate">
                  [{activeScene.scene_description}]
                </span>
              )}
            </div>
          </div>

          {/* Storyboard image */}
          <div className="w-full max-w-5xl flex-shrink-0">
            <CrossfadeImage
              src={current.storyboardImageUrl}
              alt={`Scene ${current.sceneNumber} \u2014 Beat ${current.beatLetter}`}
              duration={dissolveDuration}
            />
            {!current.storyboardImageUrl && (
              <div className="w-full rounded-lg bg-[#0a0a0a] flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                <span className="text-[#333] text-sm font-mono">
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

          {/* ── Audio (full width, larger text) ── */}
          {showAudio && (
            <div className="w-full max-w-5xl flex-shrink-0 border-l-2 border-l-[var(--admin-accent)] bg-[#0d0d0d] px-5 py-4 mb-px">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#444] mb-2">Audio</p>
              <div className="text-base text-[#999] leading-relaxed">
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
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#444] mb-1.5">Visual</p>
                    <div className="text-sm text-[#999] leading-relaxed">
                      {current.visualContent || <span className="text-[#333]">&mdash;</span>}
                    </div>
                  </div>
                )}
                {showNotes && (
                  <div className="border-l-2 border-l-[var(--admin-warning)] bg-[#0d0d0d] px-4 py-3">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#444] mb-1.5">Notes</p>
                    <div className="text-sm text-[#999] leading-relaxed">
                      {current.notesContent || <span className="text-[#333]">&mdash;</span>}
                    </div>
                  </div>
                )}
                {showReference && (
                  <div className="border-l-2 border-l-[var(--admin-danger)] bg-[#0d0d0d] px-4 py-3">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#444] mb-1.5">Reference</p>
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
      </div>

      {/* ════ RIGHT SIDEBAR — Comments (placeholder) ════ */}
      <div
        className={`flex-shrink-0 h-full border-l border-border bg-[#0a0a0a] overflow-hidden ${sidebarTransition} ${rightOpen ? 'w-[260px]' : 'w-0'}`}
      >
        <div className="w-[260px] h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <span className="text-sm font-medium text-[#888] uppercase tracking-wider">Comments</span>
            <button
              onClick={() => setRightOpen(false)}
              className="p-1 rounded text-[#555] hover:text-white hover:bg-[#222] transition-colors"
            >
              <PanelRightClose size={14} />
            </button>
          </div>
          {/* Placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#333]">Comments coming soon</p>
          </div>
        </div>
      </div>

      {/* Right sidebar toggle (when collapsed) */}
      {!rightOpen && (
        <button
          onClick={() => setRightOpen(true)}
          className={`absolute right-2 top-2 z-30 p-2 rounded text-[#555] hover:text-white hover:bg-[#222] transition-all duration-500 ${
            chromeVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <PanelRightOpen size={16} />
        </button>
      )}
    </div>
  );
}
