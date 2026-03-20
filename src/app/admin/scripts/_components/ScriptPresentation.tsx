'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ScriptColumnToggle } from './ScriptColumnToggle';
import { ScriptPresentationTimeline } from './ScriptPresentationTimeline';
import type { PresentationSlide } from './presentationUtils';
import type { ScriptColumnConfig } from '@/types/scripts';

interface Props {
  slides: PresentationSlide[];
  initialIndex?: number;
  columnConfig: ScriptColumnConfig;
  onClose: () => void;
  scriptTitle: string;
  clientName?: string;
  clientLogoUrl?: string | null;
  versionLabel?: string;
}


/** Two-layer crossfade: new image appears instantly at full opacity on top,
 *  old image fades out underneath. No black gap possible. */
function CrossfadeImage({ src, alt, duration }: { src: string | null; alt: string; duration: number }) {
  const [layers, setLayers] = useState<{ src: string | null; key: number }[]>([{ src, key: 0 }]);
  const counterRef = useRef(0);

  useEffect(() => {
    counterRef.current++;
    const newKey = counterRef.current;
    setLayers(prev => [
      // Keep previous as background (will fade out)
      ...prev.slice(-1),
      // New image on top
      { src, key: newKey },
    ]);
    // Clean up old layer after transition completes
    const timer = setTimeout(() => {
      setLayers(prev => prev.length > 1 ? prev.slice(-1) : prev);
    }, duration * 1000 + 50);
    return () => clearTimeout(timer);
  }, [src, duration]);

  const topLayer = layers[layers.length - 1];
  const bgLayer = layers.length > 1 ? layers[layers.length - 2] : null;

  return (
    <div className="relative">
      {/* Current image — in flow, sets the size */}
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
      {/* Previous image — fading out behind */}
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

export function ScriptPresentation({ slides, initialIndex = 0, onClose, scriptTitle, clientName, clientLogoUrl, versionLabel }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const [colConfig, setColConfig] = useState<ScriptColumnConfig>({
    audio: true,
    visual: true,
    notes: false,
    reference: false,
    storyboard: false,
    comments: false,
  });
  const [chromeVisible, setChromeVisible] = useState(true);
  const [contentCollapsed, setContentCollapsed] = useState(false);
  const chromeTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrollCooldown = useRef(false);

  const current = slides[idx];
  const prev = idx > 0 ? slides[idx - 1] : null;
  const isSceneChange = prev !== null && prev.sceneId !== current.sceneId;

  // Preload adjacent images
  useEffect(() => {
    const urls: string[] = [];
    if (idx > 0 && slides[idx - 1].storyboardImageUrl) urls.push(slides[idx - 1].storyboardImageUrl!);
    if (idx < slides.length - 1 && slides[idx + 1].storyboardImageUrl) urls.push(slides[idx + 1].storyboardImageUrl!);
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [idx, slides]);

  const goNext = useCallback(() => {
    setIdx(i => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIdx(i => Math.max(i - 1, 0));
  }, []);

  const handleSeek = useCallback((i: number) => {
    setIdx(Math.max(0, Math.min(i, slides.length - 1)));
  }, [slides.length]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  // Mouse scroll nav (debounced)
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

  // Auto-hide chrome (arrows + close only)
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

  // Determine visible content columns — show column if toggled, regardless of content
  const showAudio = colConfig.audio;
  const showVisual = colConfig.visual;
  const showNotes = colConfig.notes;
  const showReference = colConfig.reference;
  // Build content panels in order, then chunk into rows of max 2
  const contentPanels: { key: string; label: string; borderColor: string; content: React.ReactNode }[] = [];
  if (showAudio) contentPanels.push({ key: 'audio', label: 'Audio', borderColor: 'border-l-[var(--admin-accent)]', content: current.audioContent || <span className="text-[#333]">—</span> });
  if (showVisual) contentPanels.push({ key: 'visual', label: 'Visual', borderColor: 'border-l-[var(--admin-info)]', content: current.visualContent || <span className="text-[#333]">—</span> });
  if (showNotes) contentPanels.push({ key: 'notes', label: 'Notes', borderColor: 'border-l-[var(--admin-warning)]', content: current.notesContent || <span className="text-[#333]">—</span> });
  if (showReference) contentPanels.push({
    key: 'reference', label: 'Reference', borderColor: 'border-l-[var(--admin-danger)]',
    content: current.referenceImageUrls.length > 0
      ? <div className="flex gap-2 flex-wrap">{current.referenceImageUrls.map((url, i) => <img key={i} src={url} alt="" className="h-16 rounded object-cover" />)}</div>
      : <span className="text-[#333]">—</span>,
  });

  // Chunk into rows of max 2
  const contentRows: typeof contentPanels[] = [];
  for (let i = 0; i < contentPanels.length; i += 2) {
    contentRows.push(contentPanels.slice(i, i + 2));
  }

  // True crossfade duration
  const dissolveDuration = isSceneChange ? 0.5 : 0.35;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 z-20 p-2 rounded text-[#666] hover:text-white hover:bg-[#222] transition-all duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <X size={20} />
      </button>

      {/* Left arrow */}
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

      {/* Right arrow */}
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

      {/* Main content area — fixed layout, image never moves */}
      <div className="flex-1 flex flex-col items-center px-16 pt-4 min-h-0">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 pt-8 pb-5 flex-shrink-0">
          <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-8" />
          {clientLogoUrl && (
            <>
              <span className="text-[#555] text-xl">&times;</span>
              <img src={clientLogoUrl} alt="" className="h-8 object-contain admin-logo" />
            </>
          )}
        </div>
        {/* Title */}
        <div className="text-center pb-6 flex-shrink-0">
          {clientName && (
            <p className="text-[#555] text-admin-sm uppercase tracking-widest mb-0.5">{clientName}</p>
          )}
          <h1 className="text-[#ccc] text-sm font-medium">
            {scriptTitle}
            {versionLabel && <span className="text-[#444] ml-2">v{versionLabel}</span>}
          </h1>
        </div>
        {/* Image — natural size, capped by img max-height */}
        <div className="w-full max-w-5xl flex-shrink-0">
          <CrossfadeImage
            src={current.storyboardImageUrl}
            alt={`Scene ${current.sceneNumber} — Beat ${current.beatLetter}`}
            duration={dissolveDuration}
          />
          {!current.storyboardImageUrl && (
            <div className="w-full rounded-lg bg-[#0a0a0a] flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <span className="text-[#333] text-admin-sm font-mono">
                Scene {current.sceneNumber} — Beat {current.beatLetter}
              </span>
            </div>
          )}
        </div>
        {/* Timeline — right under image */}
        <div className="w-full max-w-5xl flex-shrink-0 mt-6">
          <ScriptPresentationTimeline
            slides={slides}
            currentIndex={idx}
            onSeek={handleSeek}
          />
        </div>

        {/* Below-timeline zone: dots, scene header, content */}
        <div
          className="w-full max-w-5xl overflow-y-auto flex-1 min-h-0"

        >
          {/* Column toggle dots — not animated, always stable */}
          <div className="flex justify-center mt-2 mb-3">
            <ScriptColumnToggle
              config={colConfig}
              onChange={setColConfig}
              compact
              exclude={['storyboard']}
            />
          </div>

          {/* Scene header row — stable container, text crossfades inside */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 bg-[#111] border-b border-[#222] cursor-pointer select-none"
            onClick={() => setContentCollapsed(c => !c)}
          >
            <span className="text-[#555] font-mono text-xs flex-shrink-0 transition-opacity duration-300">
              {current.sceneNumber}{current.beatLetter}
            </span>
            <span className="text-xs font-medium text-[#888] uppercase tracking-wider flex-1 min-w-0 truncate transition-opacity duration-300">
              {current.sceneName}
            </span>
            <span className="text-[#444] flex-shrink-0 ml-1">
              {contentCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </span>
          </div>

          {/* All beat content — simple fade on key change */}
          {!contentCollapsed && contentPanels.length > 0 && (
            <div key={current.beatId}>
              {contentRows.map((row, ri) => (
                <div key={ri} className={`grid ${row.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-px ${ri > 0 ? 'mt-px' : ''}`}>
                  {row.map(panel => (
                    <div key={panel.key} className={`border-l-2 ${panel.borderColor} bg-[#0d0d0d] px-4 py-3`}>
                      <p className="text-admin-sm font-semibold uppercase tracking-widest text-[#444] mb-1.5">{panel.label}</p>
                      <div className="text-sm text-[#999] leading-relaxed">{panel.content}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
