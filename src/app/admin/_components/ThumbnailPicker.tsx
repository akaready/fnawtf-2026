'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getProxiedMp4Url(bunnyVideoId: string, quality: '360p' | '720p' = '360p') {
  return `/cdn/videos/${bunnyVideoId}/play_${quality}.mp4`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

interface ThumbnailPickerProps {
  video: { id: string; bunny_video_id: string; title: string; video_type: string };
  thumbnailTime: number | null;
  isSaving: boolean;
  onSelect: (bunnyVideoId: string, thumbnailTimeMs: number, frameDataUrl: string) => void;
}

export function ThumbnailPicker({ video, thumbnailTime, isSaving, onSelect }: ThumbnailPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef(0);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const savedTimeRef = useRef(thumbnailTime ?? 0);

  const [duration, setDuration] = useState(0);
  const [sliderPos, setSliderPos] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(thumbnailTime ?? 0);

  useEffect(() => {
    savedTimeRef.current = thumbnailTime ?? 0;
  }, [thumbnailTime]);

  const savedPct = duration > 0 ? (savedTimeRef.current / duration) : 0;

  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    durationRef.current = video.duration;
    setDuration(video.duration);
    video.currentTime = savedTimeRef.current;
  }, []);

  // --- Video hover preview (matches proposal page behavior) ---
  const handleVideoEnter = useCallback(() => {
    if (isDragging) return;
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = savedTimeRef.current;
    const promise = vid.play();
    if (promise) {
      playPromiseRef.current = promise;
      promise.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
    }
  }, [isDragging]);

  const handleVideoLeave = useCallback(() => {
    if (isDragging) return;
    const vid = videoRef.current;
    if (!vid) return;
    const doPause = () => {
      vid.pause();
      vid.currentTime = savedTimeRef.current;
      setCurrentTime(savedTimeRef.current);
    };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
    } else {
      doPause();
    }
  }, [isDragging]);

  // --- Timeline slider ---
  const getPctFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  const seekTo = useCallback((pct: number) => {
    const vid = videoRef.current;
    if (!vid || !durationRef.current) return;
    const doPause = () => { vid.pause(); };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
      playPromiseRef.current = null;
    } else {
      doPause();
    }
    const time = pct * durationRef.current;
    vid.currentTime = time;
    setCurrentTime(time);
    setSliderPos(pct);
  }, []);

  // Frame capture (reuses existing pattern from ThumbnailScrubCard)
  const captureFrame = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || isSaving) return;

    const timeMs = Math.round(vid.currentTime * 1000);
    const timeSec = vid.currentTime;
    const bunnyId = vid.dataset.bunnyId!;

    let lowResPreview = '';
    try {
      const c = document.createElement('canvas');
      c.width = vid.videoWidth;
      c.height = vid.videoHeight;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.drawImage(vid, 0, 0); lowResPreview = c.toDataURL('image/jpeg', 0.85); }
    } catch { /* ignore */ }

    const hiRes = document.createElement('video');
    hiRes.src = getProxiedMp4Url(bunnyId, '720p');
    hiRes.muted = true;
    hiRes.playsInline = true;
    hiRes.preload = 'auto';

    const captureHiRes = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = hiRes.videoWidth;
        canvas.height = hiRes.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(hiRes, 0, 0);
          const frameDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          onSelect(bunnyId, timeMs, frameDataUrl);
        }
      } catch {
        onSelect(bunnyId, timeMs, lowResPreview);
      }
      hiRes.remove();
    };

    hiRes.addEventListener('seeked', captureHiRes, { once: true });
    hiRes.addEventListener('loadedmetadata', () => { hiRes.currentTime = timeSec; }, { once: true });
    hiRes.addEventListener('error', () => {
      onSelect(bunnyId, timeMs, lowResPreview);
      hiRes.remove();
    }, { once: true });

    hiRes.load();
  }, [onSelect, isSaving]);

  // ~1 frame at 24fps
  const FRAME_STEP = 1 / 24;

  const stepFrame = useCallback((dir: -1 | 1) => {
    const vid = videoRef.current;
    if (!vid || !durationRef.current) return;
    const doPause = () => { vid.pause(); };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
      playPromiseRef.current = null;
    } else {
      doPause();
    }
    const newTime = Math.max(0, Math.min(durationRef.current, vid.currentTime + dir * FRAME_STEP));
    vid.currentTime = newTime;
    setCurrentTime(newTime);
    setSliderPos(newTime / durationRef.current);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepFrame(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepFrame(1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      captureFrame();
    }
  }, [stepFrame, captureFrame]);

  const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const pct = getPctFromEvent(e);
    seekTo(pct);

    const handleMouseMove = (ev: MouseEvent) => {
      const p = getPctFromEvent(ev);
      seekTo(p);
    };

    const handleMouseUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
      const p = getPctFromEvent(ev);
      seekTo(p);
      // Use setTimeout to ensure the video has seeked before capturing
      setTimeout(() => captureFrame(), 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getPctFromEvent, seekTo, captureFrame]);

  const displayPct = sliderPos ?? savedPct;
  const videoSrc = getProxiedMp4Url(video.bunny_video_id, '360p');

  return (
    <div>
      {/* Video preview area */}
      <div
        className="relative rounded-lg overflow-hidden border border-admin-border bg-black cursor-pointer"
        style={{ aspectRatio: '16/9' }}
        onMouseEnter={handleVideoEnter}
        onMouseLeave={handleVideoLeave}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          data-bunny-id={video.bunny_video_id}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={handleMetadata}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />

        {/* Saving overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Timeline slider + frame step buttons */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className="flex items-center gap-2 mt-2" onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none' }}>
        <div
          ref={trackRef}
          className="relative h-7 flex-1 flex items-center cursor-pointer group"
          onMouseDown={handleTrackMouseDown}
        >
          {/* Track background */}
          <div className="absolute left-0 right-0 h-1 bg-admin-bg-hover rounded-full" />

        {/* Saved thumbnail position marker (purple) */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent rounded-full z-10"
            style={{ left: `${savedPct * 100}%` }}
          >
            <div
              className="absolute -top-0.5 left-1/2 -translate-x-1/2"
              style={{
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '5px solid var(--accent)',
              }}
            />
          </div>
        )}

        {/* Draggable picker line (white) */}
        {duration > 0 && (
          <div
            className={`absolute top-0 bottom-0 w-0.5 bg-white rounded-full z-20 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}
            style={{ left: `${displayPct * 100}%` }}
          >
            <div
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
              style={{
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '5px solid white',
              }}
            />
          </div>
        )}

        {/* Timecode */}
        {duration > 0 && (
          <div className="absolute right-0 -top-0.5 text-[10px] text-admin-text-ghost font-mono pointer-events-none">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}
        </div>

        {/* Frame step buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            title="Previous frame (Left arrow)"
            onClick={() => stepFrame(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            title="Next frame (Right arrow)"
            onClick={() => stepFrame(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
