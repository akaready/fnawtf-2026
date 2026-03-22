# Thumbnail Selector Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current ThumbnailScrubCard with a full-width video preview + timeline slider that separates hover-preview from frame-selection.

**Architecture:** A new `ThumbnailPicker` component replaces both the small thumbnail preview and the ThumbnailScrubCard. It renders a full-width 16:9 video area with hover-to-preview behavior (matching production proposal pages), plus a horizontal timeline slider below for scrubbing and selecting thumbnail frames. The existing save flow (canvas capture, Supabase upload, project row update) is preserved unchanged.

**Tech Stack:** React 19, Tailwind CSS, HTML5 Video API, Canvas API, admin design tokens

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/admin/_components/ThumbnailPicker.tsx` | **Create** | New component: video preview + timeline slider + frame capture |
| `src/app/admin/_components/VideosTab.tsx` | **Modify** (lines 278-355) | Replace thumbnail section with `<ThumbnailPicker>` |
| `src/app/admin/_components/ThumbnailScrubCard.tsx` | **Delete** | No longer used after migration |

---

### Task 1: Create ThumbnailPicker component

**Files:**
- Create: `src/app/admin/_components/ThumbnailPicker.tsx`

This is the core new component. It combines:
- A full-width 16:9 video preview (hover plays from `thumbnailTime`, mouse-leave snaps back)
- A timeline slider bar below with a purple saved-position marker and white draggable picker
- Timecode display
- Frame capture on click/drag-release (reuses existing hi-res capture pattern from ThumbnailScrubCard)

- [ ] **Step 1: Create ThumbnailPicker with video preview and hover behavior**

```tsx
// src/app/admin/_components/ThumbnailPicker.tsx
'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

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
  const [sliderPos, setSliderPos] = useState<number | null>(null); // null = not dragging
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentTime, setCurrentTime] = useState(thumbnailTime ?? 0);

  // Keep savedTimeRef in sync with prop
  useEffect(() => {
    savedTimeRef.current = thumbnailTime ?? 0;
  }, [thumbnailTime]);

  const savedPct = duration > 0 ? (savedTimeRef.current / duration) : 0;

  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    durationRef.current = video.duration;
    setDuration(video.duration);
    // Seek to saved thumbnail time
    video.currentTime = savedTimeRef.current;
  }, []);

  // --- Video hover preview (matches proposal page behavior) ---
  const handleVideoEnter = useCallback(() => {
    if (isDragging) return;
    setIsHovering(true);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = savedTimeRef.current;
    const promise = video.play();
    if (promise) {
      playPromiseRef.current = promise;
      promise.then(() => { playPromiseRef.current = null; }).catch(() => { playPromiseRef.current = null; });
    }
  }, [isDragging]);

  const handleVideoLeave = useCallback(() => {
    if (isDragging) return;
    setIsHovering(false);
    const video = videoRef.current;
    if (!video) return;
    const doPause = () => {
      video.pause();
      video.currentTime = savedTimeRef.current;
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
    const video = videoRef.current;
    if (!video || !durationRef.current) return;
    // Pause if playing
    const doPause = () => { video.pause(); };
    if (playPromiseRef.current) {
      playPromiseRef.current.then(doPause).catch(() => {});
      playPromiseRef.current = null;
    } else {
      doPause();
    }
    const time = pct * durationRef.current;
    video.currentTime = time;
    setCurrentTime(time);
    setSliderPos(pct);
  }, []);

  const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsHovering(false);
    const pct = getPctFromEvent(e);
    seekTo(pct);

    const handleMouseMove = (e: MouseEvent) => {
      const pct = getPctFromEvent(e);
      seekTo(pct);
    };

    const handleMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
      // Capture frame at this position
      const pct = getPctFromEvent(e);
      seekTo(pct);
      captureFrame();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getPctFromEvent, seekTo]);

  // --- Frame capture (reuses existing pattern) ---
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || isSaving) return;

    const timeMs = Math.round(video.currentTime * 1000);
    const timeSec = video.currentTime;
    const bunnyId = video.dataset.bunnyId!;

    // Low-res preview from 360p
    let lowResPreview = '';
    try {
      const c = document.createElement('canvas');
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.drawImage(video, 0, 0); lowResPreview = c.toDataURL('image/jpeg', 0.85); }
    } catch { /* ignore */ }

    // Hi-res capture from 720p
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

      {/* Timeline slider */}
      <div
        ref={trackRef}
        className="relative h-7 flex items-center cursor-pointer mt-2 group"
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

        {/* Draggable picker line (white) — visible when dragging or hovering track */}
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
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `npx tsc --noEmit 2>&1 | grep ThumbnailPicker`
Expected: No errors for ThumbnailPicker.tsx

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/_components/ThumbnailPicker.tsx
git commit -m "feat: add ThumbnailPicker component with video preview + timeline slider"
```

---

### Task 2: Integrate ThumbnailPicker into VideosTab

**Files:**
- Modify: `src/app/admin/_components/VideosTab.tsx` (lines 278-355)

Replace the current thumbnail section (small preview image + ThumbnailScrubCard) with the new `ThumbnailPicker`. Pass `thumbnailTime` from the project data so the picker knows the saved position.

- [ ] **Step 1: Add thumbnailTime prop to VideosTab**

In `VideosTab.tsx`, update the Props interface and component signature:

```tsx
// In Props interface, add:
currentThumbnailTime?: number | null;

// In function signature:
export function VideosTab({ projectId, initialVideos, currentThumbnailUrl, currentThumbnailTime }: Props) {
```

- [ ] **Step 2: Add thumbnailTime state tracking**

After the existing `selectedThumbVideoId` state (line 67), add:

```tsx
const [currentThumbTime, setCurrentThumbTime] = useState<number | null>(currentThumbnailTime ?? null);
```

Update `handleThumbSelect` to also update local time state (after line 104):

```tsx
setCurrentThumbTime(thumbnailTimeSec);
```

- [ ] **Step 3: Replace thumbnail section (lines 278-355) with ThumbnailPicker**

Replace the entire thumbnail section `<section className="space-y-3 pb-4 ...">` with:

```tsx
<section className="space-y-3 pb-4 border-b border-admin-border-subtle">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs uppercase tracking-widest text-admin-text-faint font-medium mb-0.5">Thumbnail</p>
      <p className="text-xs text-admin-text-muted">Hover to preview, drag slider to pick frame</p>
    </div>
    <div>
      {thumbStatus === 'saving' && (
        <p className="text-xs text-accent flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Uploading...
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

  {/* Thumbnail picker */}
  {thumbVideo && (
    <ThumbnailPicker
      video={{ id: thumbVideo.id, bunny_video_id: thumbVideo.bunny_video_id, title: thumbVideo.title, video_type: thumbVideo.video_type }}
      thumbnailTime={currentThumbTime}
      isSaving={savingThumb === thumbVideo.bunny_video_id}
      onSelect={handleThumbSelect}
    />
  )}
</section>
```

- [ ] **Step 4: Update import — replace ThumbnailScrubCard with ThumbnailPicker**

```tsx
// Remove:
import { ThumbnailScrubCard } from './ThumbnailScrubCard';
// Add:
import { ThumbnailPicker } from './ThumbnailPicker';
```

Also remove unused imports that were only needed for the old thumbnail preview: `ImageIcon` (if no longer used elsewhere in the file).

- [ ] **Step 5: Pass thumbnailTime from ProjectPanel to VideosTab**

In `src/app/admin/_components/ProjectPanel.tsx` (line 309), update the VideosTab usage:

```tsx
<VideosTab
  projectId={projectId}
  initialVideos={videos}
  currentThumbnailUrl={String(project?.thumbnail_url ?? '')}
  currentThumbnailTime={project?.thumbnail_time ?? null}
/>
```

- [ ] **Step 6: Type check**

Run: `npx tsc --noEmit`
Expected: No new errors (pre-existing script errors OK)

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/_components/VideosTab.tsx src/app/admin/_components/ProjectPanel.tsx
git commit -m "feat: integrate ThumbnailPicker into VideosTab, replacing ThumbnailScrubCard"
```

---

### Task 3: Clean up old ThumbnailScrubCard

**Files:**
- Delete: `src/app/admin/_components/ThumbnailScrubCard.tsx`

- [ ] **Step 1: Verify ThumbnailScrubCard has no remaining imports**

Run: `grep -r "ThumbnailScrubCard" src/`
Expected: No results (all references removed in Task 2)

- [ ] **Step 2: Delete the file**

```bash
rm src/app/admin/_components/ThumbnailScrubCard.tsx
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/_components/ThumbnailScrubCard.tsx
git commit -m "chore: remove unused ThumbnailScrubCard component"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Open a project panel with videos in the admin**
- Navigate to `/admin/projects`, click any project with videos
- Go to the Videos tab

- [ ] **Step 2: Test hover preview**
- Hover over the video preview area
- Video should start playing from the saved thumbnail time
- Move mouse off — video should snap back to the thumbnail frame

- [ ] **Step 3: Test timeline slider**
- Click and drag on the timeline bar below the video
- Video should seek in real-time as you drag
- The purple marker should show the current saved position
- The white picker line should follow your drag

- [ ] **Step 4: Test frame selection**
- Release the drag at a new position
- Should see "Uploading..." status
- Then "Saved!" confirmation
- Purple marker should move to the new position

- [ ] **Step 5: Verify persistence**
- Reload the project panel
- Thumbnail time and preview should persist at the new position
- Check the proposal page for the same project — thumbnail should match

- [ ] **Step 6: Final commit and push**

```bash
git push
```
