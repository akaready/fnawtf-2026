'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { ThumbnailScrubCard } from './ThumbnailScrubCard';
import { updateProject } from '../actions';

interface ThumbnailGalleryProps {
  projectId: string;
  videos: Array<{ id: string; bunny_video_id: string; title: string; video_type: string }>;
  currentThumbnailUrl: string;
  /** Compact mode for embedding in side panel tabs */
  compact?: boolean;
}

export function ThumbnailGallery({ projectId, videos, currentThumbnailUrl, compact }: ThumbnailGalleryProps) {
  const router = useRouter();
  const [savingVideoId, setSavingVideoId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(() => {
    const match = videos.find((v) => currentThumbnailUrl?.includes(v.bunny_video_id));
    return match?.bunny_video_id ?? null;
  });
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSelect = useCallback(async (bunnyVideoId: string, thumbnailTimeMs: number, frameDataUrl: string) => {
    setSavingVideoId(bunnyVideoId);
    setSaveStatus('saving');
    setSaveError(null);
    if (frameDataUrl) { setFramePreview(frameDataUrl); setPreviewBroken(false); }

    try {
      // Convert dataURL to JPEG blob
      let blob: Blob | null = null;
      if (frameDataUrl) {
        const res = await fetch(frameDataUrl);
        blob = await res.blob();
      }

      if (!blob) {
        setSaveStatus('error');
        setSaveError('Could not capture frame. Try hovering the video first.');
        return;
      }

      // Upload JPEG to Supabase Storage
      const uploadRes = await fetch('/api/admin/bunny/set-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          'x-video-id': bunnyVideoId,
        },
        body: blob,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setSaveStatus('error');
        setSaveError(data.error || 'Failed to upload thumbnail');
        return;
      }

      // API returns the public Supabase Storage URL
      const { thumbnailUrl } = await uploadRes.json();
      const thumbnailTimeSec = thumbnailTimeMs / 1000;
      await updateProject(projectId, { thumbnail_url: thumbnailUrl, thumbnail_time: thumbnailTimeSec });

      setSelectedVideoId(bunnyVideoId);
      setSaveStatus('saved');
      router.refresh();

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Thumbnail update failed:', err);
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingVideoId(null);
    }
  }, [projectId, router]);

  if (videos.length === 0) {
    return (
      <div className={`text-center text-admin-text-muted ${compact ? 'py-6' : 'py-16'}`}>
        <p>No videos attached to this project.</p>
        <p className="text-sm mt-1">Add videos in the Videos tab first.</p>
      </div>
    );
  }

  const previewSrc = framePreview || (!previewBroken && currentThumbnailUrl ? currentThumbnailUrl : null);

  /* ── Status indicator (shared) ───────────────────────────────────── */
  const statusEl = (
    <>
      {saveStatus === 'saving' && (
        <p className="text-xs text-accent flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Uploading…
        </p>
      )}
      {saveStatus === 'saved' && (
        <p className="text-xs text-admin-success flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Saved!
        </p>
      )}
      {saveStatus === 'error' && (
        <p className="text-xs text-admin-danger flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {saveError || 'Save failed'}
        </p>
      )}
    </>
  );

  /* ── Compact layout for side panel ──────────────────────────────── */
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Small preview + status */}
        <div className="flex items-center gap-3">
          <div
            className="relative w-32 rounded-lg overflow-hidden border border-admin-border bg-admin-bg-base flex-shrink-0"
            style={{ aspectRatio: '16/9' }}
          >
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Current thumbnail"
                className="w-full h-full object-cover"
                onError={() => setPreviewBroken(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-admin-text-ghost gap-1">
                <ImageIcon className="w-5 h-5" strokeWidth={1} />
                <span className="text-[10px]">No thumbnail</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-admin-text-muted">Hover to scrub, click to set</p>
            <div className="mt-1">{statusEl}</div>
          </div>
        </div>

        {/* Scrub cards — compact */}
        <div className="space-y-2">
          {videos.map((video) => (
            <ThumbnailScrubCard
              key={video.id}
              video={video}
              isSelected={selectedVideoId === video.bunny_video_id}
              isSaving={savingVideoId === video.bunny_video_id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Full layout (standalone tab / page) ────────────────────────── */
  const selectedTitle = selectedVideoId
    ? videos.find((v) => v.bunny_video_id === selectedVideoId)?.title
    : null;

  return (
    <div>
      {/* Current thumbnail preview */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-admin-text-muted font-mono mb-2">
          Current Thumbnail
        </p>
        <div className="flex items-start gap-4">
          <div
            className="relative w-80 rounded-lg overflow-hidden border border-admin-border bg-admin-bg-base flex-shrink-0"
            style={{ aspectRatio: '16/9' }}
          >
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Current thumbnail"
                className="w-full h-full object-cover"
                onError={() => setPreviewBroken(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-admin-text-ghost gap-2">
                <ImageIcon className="w-8 h-8" strokeWidth={1} />
                <span className="text-xs">No thumbnail set</span>
              </div>
            )}
          </div>
          <div className="pt-1">
            {selectedTitle && (
              <p className="text-sm text-admin-text-primary">
                Source: <span className="font-medium">{selectedTitle}</span>
              </p>
            )}
            <p className="text-xs text-admin-text-muted mt-1">
              Hover a video below to scrub, click to set frame as thumbnail.
            </p>
            <div className="mt-2">{statusEl}</div>
          </div>
        </div>
      </div>

      {/* Scrub cards grid */}
      <div className="grid grid-cols-1 gap-4">
        {videos.map((video) => (
          <ThumbnailScrubCard
            key={video.id}
            video={video}
            isSelected={selectedVideoId === video.bunny_video_id}
            isSaving={savingVideoId === video.bunny_video_id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
