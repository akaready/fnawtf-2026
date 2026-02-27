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
}

export function ThumbnailGallery({ projectId, videos, currentThumbnailUrl }: ThumbnailGalleryProps) {
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
      <div className="text-center text-muted-foreground py-16">
        <p>No videos attached to this project.</p>
        <p className="text-sm mt-1">Add videos in the Videos tab first.</p>
      </div>
    );
  }

  const selectedTitle = selectedVideoId
    ? videos.find((v) => v.bunny_video_id === selectedVideoId)?.title
    : null;

  const previewSrc = framePreview || (!previewBroken && currentThumbnailUrl ? currentThumbnailUrl : null);

  return (
    <div>
      {/* Current thumbnail preview */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">
          Current Thumbnail
        </p>
        <div className="flex items-start gap-4">
          <div
            className="relative w-80 rounded-lg overflow-hidden border border-[#2a2a2a] bg-black flex-shrink-0"
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
              <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                <ImageIcon className="w-8 h-8" strokeWidth={1} />
                <span className="text-xs">No thumbnail set</span>
              </div>
            )}
          </div>
          <div className="pt-1">
            {selectedTitle && (
              <p className="text-sm text-foreground">
                Source: <span className="font-medium">{selectedTitle}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Hover a video below to scrub, click to set frame as thumbnail.
            </p>

            {saveStatus === 'saving' && (
              <p className="text-xs text-accent mt-2 flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Uploading thumbnail…
              </p>
            )}
            {saveStatus === 'saved' && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Saved!
              </p>
            )}
            {saveStatus === 'error' && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {saveError || 'Save failed'}
              </p>
            )}
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
