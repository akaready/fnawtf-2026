'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowUp, ArrowDown, Upload, Link as LinkIcon, Lock, Unlock, Scan, ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { addProjectVideo, updateProjectVideo, deleteProjectVideo, updateProject } from '../actions';
import { ThumbnailScrubCard } from './ThumbnailScrubCard';

type VideoType = 'flagship' | 'cutdown' | 'bts' | 'pitch';
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '21:9'];

interface VideoRow {
  id: string;
  bunny_video_id: string;
  title: string;
  video_type: VideoType;
  sort_order: number;
  password_protected: boolean;
  viewer_password: string | null;
  aspect_ratio: AspectRatio;
}

interface Props {
  projectId: string;
  initialVideos: VideoRow[];
  currentThumbnailUrl?: string;
}

const inputClass =
  'w-full px-3 py-2 bg-admin-bg-base border border-border rounded-lg text-sm text-admin-text-primary placeholder:text-admin-text-ghost focus:outline-none focus:border-admin-border-focus transition-colors';

const VIDEO_TYPES: VideoType[] = ['flagship', 'cutdown', 'bts'];

export function VideosTab({ projectId, initialVideos, currentThumbnailUrl }: Props) {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoRow[]>(initialVideos);
  const [isPending, startTransition] = useTransition();

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [pendingVideo, setPendingVideo] = useState<{ videoId: string; title: string; video_type: VideoType } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Link existing video by ID
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkId, setLinkId] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkType, setLinkType] = useState<VideoType>('flagship');

  // Thumbnail state
  const [thumbVideoId, setThumbVideoId] = useState<string | null>(() => {
    const match = initialVideos.find((v) => currentThumbnailUrl?.includes(v.bunny_video_id));
    return match?.bunny_video_id ?? (initialVideos.length > 0 ? initialVideos[0].bunny_video_id : null);
  });
  const [savingThumb, setSavingThumb] = useState<string | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [thumbStatus, setThumbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [thumbError, setThumbError] = useState<string | null>(null);
  const [selectedThumbVideoId, setSelectedThumbVideoId] = useState<string | null>(() => {
    const match = initialVideos.find((v) => currentThumbnailUrl?.includes(v.bunny_video_id));
    return match?.bunny_video_id ?? null;
  });

  const handleThumbSelect = useCallback(async (bunnyVideoId: string, thumbnailTimeMs: number, frameDataUrl: string) => {
    setSavingThumb(bunnyVideoId);
    setThumbStatus('saving');
    setThumbError(null);
    if (frameDataUrl) { setFramePreview(frameDataUrl); setPreviewBroken(false); }

    try {
      let blob: Blob | null = null;
      if (frameDataUrl) {
        const res = await fetch(frameDataUrl);
        blob = await res.blob();
      }
      if (!blob) {
        setThumbStatus('error');
        setThumbError('Could not capture frame. Try hovering the video first.');
        return;
      }

      const uploadRes = await fetch('/api/admin/bunny/set-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg', 'x-video-id': bunnyVideoId },
        body: blob,
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setThumbStatus('error');
        setThumbError(data.error || 'Failed to upload thumbnail');
        return;
      }

      const { thumbnailUrl } = await uploadRes.json();
      const thumbnailTimeSec = thumbnailTimeMs / 1000;
      await updateProject(projectId, { thumbnail_url: thumbnailUrl, thumbnail_time: thumbnailTimeSec });

      setSelectedThumbVideoId(bunnyVideoId);
      setThumbStatus('saved');
      router.refresh();
      setTimeout(() => setThumbStatus('idle'), 3000);
    } catch (err) {
      console.error('Thumbnail update failed:', err);
      setThumbStatus('error');
      setThumbError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingThumb(null);
    }
  }, [projectId, router]);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      // 1. Get upload URL from server
      const res = await fetch('/api/admin/bunny/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: file.name.replace(/\.[^/.]+$/, '') }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to get upload URL');
      }

      const { videoId, uploadUrl, apiKey } = await res.json() as { videoId: string; uploadUrl: string; apiKey: string };

      // 2. Upload directly to Bunny via XHR (for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.statusText}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('AccessKey', apiKey);
        xhr.send(file);
      });

      // 3. Show form to set title + type before saving
      setPendingVideo({
        videoId,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        video_type: 'flagship',
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const savePendingVideo = () => {
    if (!pendingVideo) return;
    startTransition(async () => {
      const newVideo = {
        project_id: projectId,
        bunny_video_id: pendingVideo.videoId,
        title: pendingVideo.title,
        video_type: pendingVideo.video_type,
        sort_order: videos.length,
        password_protected: false,
        viewer_password: null,
        aspect_ratio: '16:9' as AspectRatio,
      };
      await addProjectVideo(newVideo);
      setVideos((prev) => [...prev, { id: crypto.randomUUID(), ...newVideo }]);
      setPendingVideo(null);
    });
  };

  const saveLinkVideo = () => {
    if (!linkId.trim() || !linkTitle.trim()) return;
    startTransition(async () => {
      const newVideo = {
        project_id: projectId,
        bunny_video_id: linkId.trim(),
        title: linkTitle.trim(),
        video_type: linkType,
        sort_order: videos.length,
        password_protected: false,
        viewer_password: null,
        aspect_ratio: '16:9' as AspectRatio,
      };
      await addProjectVideo(newVideo);
      setVideos((prev) => [...prev, { id: crypto.randomUUID(), ...newVideo }]);
      setShowLinkForm(false);
      setLinkId('');
      setLinkTitle('');
      setLinkType('flagship');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProjectVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setConfirmDeleteId(null);
    });
  };

  const handleTypeChange = (video: VideoRow, newType: VideoType) => {
    startTransition(async () => {
      await updateProjectVideo(video.id, { video_type: newType });
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, video_type: newType } : v)));
    });
  };

  const handlePasswordToggle = (video: VideoRow) => {
    const newProtected = !video.password_protected;
    startTransition(async () => {
      await updateProjectVideo(video.id, {
        password_protected: newProtected,
        viewer_password: newProtected ? video.viewer_password : null,
      });
      setVideos((prev) => prev.map((v) =>
        v.id === video.id ? { ...v, password_protected: newProtected, viewer_password: newProtected ? v.viewer_password : null } : v
      ));
    });
  };

  const handlePasswordChange = (video: VideoRow, password: string) => {
    startTransition(async () => {
      await updateProjectVideo(video.id, { viewer_password: password || null });
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, viewer_password: password || null } : v)));
    });
  };

  const handleAspectRatioChange = (video: VideoRow, ratio: AspectRatio) => {
    startTransition(async () => {
      await updateProjectVideo(video.id, { aspect_ratio: ratio });
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, aspect_ratio: ratio } : v)));
    });
  };

  const handleAutoDetectRatio = async (video: VideoRow) => {
    const res = await fetch(`/api/admin/bunny/video-info?videoId=${video.bunny_video_id}`);
    if (!res.ok) return;
    const { aspectRatio } = await res.json() as { aspectRatio: AspectRatio };
    if (aspectRatio) handleAspectRatioChange(video, aspectRatio);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...videos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const updated = next.map((v, i) => ({ ...v, sort_order: i }));
    setVideos(updated);
    startTransition(async () => {
      for (const v of updated) {
        await updateProjectVideo(v.id, { sort_order: v.sort_order });
      }
    });
  };

  const previewSrc = framePreview || (!previewBroken && currentThumbnailUrl ? currentThumbnailUrl : null);
  const thumbVideo = thumbVideoId ? videos.find((v) => v.bunny_video_id === thumbVideoId) : null;

  return (
    <div className="space-y-4">
      {/* Thumbnail picker */}
      {videos.length > 0 && (
        <section className="space-y-3 pb-4 border-b border-admin-border-subtle">
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
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-admin-text-faint font-medium mb-1.5">Thumbnail</p>
              <p className="text-xs text-admin-text-muted">Hover to scrub, click to set</p>
              <div className="mt-1">
                {thumbStatus === 'saving' && (
                  <p className="text-xs text-accent flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </p>
                )}
                {thumbStatus === 'saved' && (
                  <p className="text-xs text-admin-success flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Saved!
                  </p>
                )}
                {thumbStatus === 'error' && (
                  <p className="text-xs text-admin-danger flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {thumbError || 'Save failed'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Video selector tabs */}
          {videos.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setThumbVideoId(v.bunny_video_id)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    thumbVideoId === v.bunny_video_id
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                  }`}
                >
                  {v.title}
                </button>
              ))}
            </div>
          )}

          {/* Scrub card for selected video */}
          {thumbVideo && (
            <ThumbnailScrubCard
              video={{ id: thumbVideo.id, bunny_video_id: thumbVideo.bunny_video_id, title: thumbVideo.title, video_type: thumbVideo.video_type }}
              isSelected={selectedThumbVideoId === thumbVideo.bunny_video_id}
              isSaving={savingThumb === thumbVideo.bunny_video_id}
              onSelect={handleThumbSelect}
            />
          )}
        </section>
      )}

      {/* Existing videos */}
      {videos.length === 0 ? (
        <p className="text-sm text-admin-text-faint py-2">No videos linked yet.</p>
      ) : (
        <div className="space-y-2">
          {videos.map((video, i) => (
            <div
              key={video.id}
              className="group/vid flex items-center gap-3 p-2.5 border border-admin-border-subtle rounded-lg bg-admin-bg-subtle hover:bg-admin-bg-hover transition-colors"
            >
              <div className="flex flex-col gap-0.5 opacity-0 group-hover/vid:opacity-100 transition-opacity">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-admin-text-ghost hover:text-admin-text-muted disabled:opacity-20 transition-colors">
                  <ArrowUp size={12} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === videos.length - 1} className="text-admin-text-ghost hover:text-admin-text-muted disabled:opacity-20 transition-colors">
                  <ArrowDown size={12} />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-admin-text-primary truncate">{video.title}</p>
                <p className="text-xs text-admin-text-faint font-mono mt-0.5 truncate">{video.bunny_video_id}</p>
              </div>

              <select
                value={video.video_type}
                onChange={(e) => handleTypeChange(video, e.target.value as VideoType)}
                className="px-2 py-1.5 bg-admin-bg-base border border-admin-border-subtle rounded-lg text-xs text-admin-text-muted focus:outline-none focus:border-admin-border-focus transition-colors"
              >
                {VIDEO_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Aspect ratio */}
              <select
                value={video.aspect_ratio}
                onChange={(e) => handleAspectRatioChange(video, e.target.value as AspectRatio)}
                className="px-2 py-1.5 bg-admin-bg-base border border-admin-border-subtle rounded-lg text-xs text-admin-text-muted focus:outline-none focus:border-admin-border-focus transition-colors"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                type="button"
                title="Auto-detect ratio from Bunny"
                onClick={() => handleAutoDetectRatio(video)}
                disabled={isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-ghost hover:text-admin-text-muted transition-colors opacity-0 group-hover/vid:opacity-100"
              >
                <Scan size={13} />
              </button>

              {/* Password protection toggle */}
              <button
                type="button"
                title={video.password_protected ? 'Password protected — click to remove' : 'No password — click to protect'}
                onClick={() => handlePasswordToggle(video)}
                disabled={isPending}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                  video.password_protected
                    ? 'text-admin-warning hover:text-amber-300 bg-admin-warning-bg'
                    : 'text-admin-text-ghost hover:text-admin-text-muted opacity-0 group-hover/vid:opacity-100'
                }`}
              >
                {video.password_protected ? <Lock size={13} /> : <Unlock size={13} />}
              </button>

              {video.password_protected && (
                <input
                  type="text"
                  value={video.viewer_password ?? ''}
                  onChange={(e) => handlePasswordChange(video, e.target.value)}
                  placeholder="password"
                  className="w-28 px-2 py-1.5 bg-admin-bg-base border border-admin-warning-border rounded-lg text-xs text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:border-amber-400/50 font-mono transition-colors"
                />
              )}

              <button
                type="button"
                onClick={() => setConfirmDeleteId(video.id)}
                disabled={isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-muted opacity-0 group-hover/vid:opacity-100 hover:text-admin-danger hover:bg-red-500/8 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending upload form */}
      {pendingVideo && (
        <div className="p-4 border border-border rounded-lg bg-admin-bg-subtle space-y-3">
          <p className="text-xs text-admin-text-muted uppercase tracking-wider">Upload complete — set details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-admin-text-muted mb-1">Title</label>
              <input
                type="text"
                value={pendingVideo.title}
                onChange={(e) => setPendingVideo((p) => p ? { ...p, title: e.target.value } : null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-admin-text-muted mb-1">Type</label>
              <select
                value={pendingVideo.video_type}
                onChange={(e) => setPendingVideo((p) => p ? { ...p, video_type: e.target.value as VideoType } : null)}
                className={inputClass}
              >
                {VIDEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={savePendingVideo}
              disabled={isPending}
              className="btn-primary px-4 py-2.5 text-sm"
            >
              {isPending ? 'Saving…' : 'Save Video'}
            </button>
            <button
              type="button"
              onClick={() => setPendingVideo(null)}
              className="px-4 py-2 text-sm text-admin-text-muted border border-border rounded-lg hover:text-admin-text-primary transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Link existing Bunny video form */}
      {showLinkForm && (
        <div className="p-4 border border-border rounded-lg bg-admin-bg-subtle space-y-3">
          <p className="text-xs text-admin-text-muted uppercase tracking-wider">Link existing Bunny video</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-admin-text-muted mb-1">Bunny Video ID</label>
              <input
                type="text"
                value={linkId}
                onChange={(e) => setLinkId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-admin-text-muted mb-1">Type</label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as VideoType)}
                className={inputClass}
              >
                {VIDEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-admin-text-muted mb-1">Title</label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Video title"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveLinkVideo}
              disabled={isPending || !linkId.trim() || !linkTitle.trim()}
              className="btn-primary px-4 py-2.5 text-sm"
            >
              {isPending ? 'Saving…' : 'Link Video'}
            </button>
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="px-4 py-2 text-sm text-admin-text-muted border border-border rounded-lg hover:text-admin-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-admin-text-muted">
            <span>Uploading…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1 bg-admin-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-admin-danger">{uploadError}</p>
      )}

      {/* Action buttons */}
      {!pendingVideo && !showLinkForm && (
        <div className="flex items-center gap-3 pt-1">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || isPending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] text-admin-text-muted hover:bg-admin-bg-hover-strong hover:text-admin-text-primary transition-colors disabled:opacity-40"
          >
            <Upload size={14} /> Upload Video
          </button>
          <button
            type="button"
            onClick={() => setShowLinkForm(true)}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.06] text-admin-text-muted hover:bg-admin-bg-hover-strong hover:text-admin-text-primary transition-colors disabled:opacity-40"
          >
            <LinkIcon size={14} /> Link by ID
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-admin-bg-raised border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-admin-text-primary mb-2">Delete video?</h3>
            <p className="text-sm text-admin-text-muted mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-admin-text-muted hover:text-admin-text-primary transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-admin-danger-bg-strong hover:bg-red-500/25 text-admin-danger transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
