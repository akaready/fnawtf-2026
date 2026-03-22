# Thumbnail Selector Redesign

## Context

The current thumbnail selector in the project panel's Videos tab uses a small ThumbnailScrubCard where hovering scrubs the video and clicking captures a frame. The UX is unintuitive — there's no visible playbar, no indication of where the current thumbnail sits in the timeline, and hovering the video does double duty (scrub + preview). The redesign separates these concerns: hovering previews how the thumbnail looks in production, while a dedicated timeline slider below the video handles frame selection.

## Design

### Layout (within VideosTab, replacing current thumbnail section)

1. **Label row** — "Thumbnail" label + helper text
2. **Video selector tabs** — same as current (only if multiple videos)
3. **Video preview** — full-width 16:9 video area (replaces both the tiny w-32 preview AND the scrub card)
4. **Timeline slider** — full-width horizontal bar below the video with:
   - 4px track background
   - Purple marker (2px line + triangle) showing current saved `thumbnail_time` position
   - White draggable picker line (2px) for selecting a new frame
   - Timecode readout (current / total) on the right
5. **Status row** — thumbnail time indicator + save status messages (reuses existing saving/saved/error states)

### Behaviors

| Interaction | What happens |
|---|---|
| **Hover over video** | Video starts playing from saved `thumbnail_time` (same as proposal page hover preview — shows what clients will see) |
| **Mouse leaves video** | Video pauses and snaps back to the saved thumbnail frame |
| **Drag slider** | Video frame updates in real-time as the picker moves left/right along the timeline. Video does NOT play — just seeks to the dragged position |
| **Click on slider track** | Jumps picker to that position, seeks video to that frame |
| **Release drag / click track** | Sets the new thumbnail: captures hi-res frame, uploads to Supabase, updates `thumbnail_url` + `thumbnail_time`. Purple marker moves to new position |

### Component changes

- **ThumbnailScrubCard** — replaced entirely by new inline UI in VideosTab (or extracted to a new `ThumbnailPicker` component)
- **VideosTab** — the small `w-32` preview image and the ThumbnailScrubCard are replaced by the full-width video + slider
- **Save flow** — identical to current: capture low-res from 360p, then hi-res from 720p, upload JPEG to `/api/admin/bunny/set-thumbnail`, update project row

### Key files to modify

- `src/app/admin/_components/ThumbnailScrubCard.tsx` — **delete or replace** with new `ThumbnailPicker.tsx`
- `src/app/admin/_components/VideosTab.tsx` — replace lines 278-355 (thumbnail section) with new picker layout
- No database changes needed — still uses `thumbnail_url` + `thumbnail_time`

### What stays the same

- Video selector tabs for multi-video projects
- Frame capture logic (canvas from 360p, hi-res from 720p)
- Upload to Supabase storage via `/api/admin/bunny/set-thumbnail`
- Save status indicators (saving/saved/error)
- `handleThumbSelect` callback in VideosTab

## Verification

1. Open any project panel > Videos tab
2. Hover over video preview — should play from saved thumbnail time
3. Move mouse off video — should snap back to thumbnail frame
4. Drag slider left/right — video should seek in real-time
5. Release or click — thumbnail should save (check Supabase storage + project row)
6. Purple marker should update to new position
7. Reload panel — thumbnail time and preview should persist
8. Check proposal page for the same project — thumbnail and hover start time should match
