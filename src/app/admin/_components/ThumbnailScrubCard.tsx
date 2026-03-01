'use client';

import { useRef, useCallback, useState } from 'react';
import { Check } from 'lucide-react';
// Use local proxy to avoid Bunny CDN hotlink protection on localhost
// and to keep same-origin for canvas frame capture (no CORS tainting)
function getProxiedMp4Url(bunnyVideoId: string, quality: '360p' | '720p' = '360p') {
  return `/cdn/videos/${bunnyVideoId}/play_${quality}.mp4`;
}

interface ThumbnailScrubCardProps {
  video: { id: string; bunny_video_id: string; title: string; video_type: string };
  isSelected: boolean;
  isSaving: boolean;
  onSelect: (bunnyVideoId: string, thumbnailTimeMs: number, frameDataUrl: string) => void;
}

/**
 * Premiere-style hover scrub card.
 * Move mouse left→right to scrub through the video timeline.
 * Click to select the current frame as the project thumbnail.
 * Captures frame to canvas dataURL on click for instant preview.
 */
export function ThumbnailScrubCard({ video, isSelected, isSaving, onSelect }: ThumbnailScrubCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(0);
  const [scrubPosition, setScrubPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMetadata = useCallback(() => {
    if (videoRef.current) {
      durationRef.current = videoRef.current.duration;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !durationRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * durationRef.current;
    setScrubPosition(pct);
  }, []);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video || isSaving) return;

    const timeMs = Math.round(video.currentTime * 1000);
    const timeSec = video.currentTime;
    const bunnyId = video.dataset.bunnyId!;

    // Show instant low-res preview from the 360p scrub video
    let lowResPreview = '';
    try {
      const c = document.createElement('canvas');
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.drawImage(video, 0, 0); lowResPreview = c.toDataURL('image/jpeg', 0.85); }
    } catch { /* ignore */ }

    // Load a hidden 1080p video, seek to the same time, capture hi-res frame
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
        // Fallback to low-res if hi-res capture fails
        onSelect(bunnyId, timeMs, lowResPreview);
      }
      hiRes.remove();
    };

    hiRes.addEventListener('seeked', captureHiRes, { once: true });
    hiRes.addEventListener('loadedmetadata', () => { hiRes.currentTime = timeSec; }, { once: true });
    hiRes.addEventListener('error', () => {
      // Fallback to low-res
      onSelect(bunnyId, timeMs, lowResPreview);
      hiRes.remove();
    }, { once: true });

    hiRes.load();
  }, [onSelect, isSaving]);

  const videoSrc = getProxiedMp4Url(video.bunny_video_id, '360p');

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-crosshair border-2 transition-colors ${
        isSelected ? 'border-accent' : 'border-transparent hover:border-admin-border-focus'
      }`}
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-black"
        src={videoSrc}
        data-bunny-id={video.bunny_video_id}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={handleMetadata}
      />

      {/* Scrub position indicator */}
      {isHovering && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-accent transition-none"
          style={{ width: `${scrubPosition * 100}%` }}
        />
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      )}

      {/* Saving spinner */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Video title + type */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
        <p className="text-white text-xs font-medium truncate">{video.title}</p>
        <p className="text-admin-text-secondary text-[10px] uppercase tracking-wider">{video.video_type}</p>
      </div>
    </div>
  );
}
