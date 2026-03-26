'use client';

import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { VideoPasswordGate } from './VideoPasswordGate';
import { getBunnyVideoMp4Url, getBunnyVideoThumbnail } from '@/lib/bunny/client';
import type { ProjectVideo, ProjectVideoSection } from '@/types/project';

interface Props {
  videos: ProjectVideo[];
  sections?: ProjectVideoSection[];
}

function toCssRatio(r: string) {
  return r.replace(':', '/');
}

function VideoPlayer({ video }: { video: ProjectVideo }) {
  const aspectRatio = toCssRatio(video.aspect_ratio ?? '16:9');
  const placeholder = getBunnyVideoThumbnail(video.bunny_video_id);

  if (video.password_protected) {
    return (
      <VideoPasswordGate
        videoSrc={getBunnyVideoMp4Url(video.bunny_video_id)}
        placeholderSrc={placeholder}
        password={video.viewer_password ?? ''}
        aspectRatio={aspectRatio}
      />
    );
  }
  return (
    <ReelPlayer
      videoSrc={getBunnyVideoMp4Url(video.bunny_video_id)}
      placeholderSrc={placeholder}
      defaultMuted={false}
      aspectRatio={aspectRatio}
    />
  );
}

function VideoCard({ video, showTitle }: { video: ProjectVideo; showTitle: boolean }) {
  return (
    <div>
      {showTitle && <p className="text-white/50 text-sm mb-2">{video.title}</p>}
      <VideoPlayer video={video} />
    </div>
  );
}

/* ── Layout engine ─────────────────────────────────────────────────────── */

/** Parse aspect ratio string to a numeric value (width/height) */
function ratioValue(r: string): number {
  const [w, h] = r.split(':').map(Number);
  return (w && h) ? w / h : 16 / 9;
}

/**
 * Break videos into rows, max ~4 "landscape-equivalent" slots per row.
 * Each video's width weight is proportional to its aspect ratio.
 * A 16:9 video = 1 slot. A 9:16 = ~0.31 slots. A 1:1 = ~0.56 slots.
 * This means a row can fit e.g. 3× landscape, or 2× landscape + 2× portrait.
 * Never leave a single video orphaned on the last row (split evenly instead).
 */
function buildRows(videos: ProjectVideo[], maxWeight: number = 3): ProjectVideo[][] {
  if (videos.length === 0) return [];
  if (videos.length === 1) return [[videos[0]]];

  const baseRatio = 16 / 9;
  const rows: ProjectVideo[][] = [];
  let currentRow: ProjectVideo[] = [];
  let currentWeight = 0;

  for (const v of videos) {
    const weight = ratioValue(v.aspect_ratio ?? '16:9') / baseRatio;
    if (currentRow.length > 0 && currentWeight + weight > maxWeight + 0.1) {
      rows.push(currentRow);
      currentRow = [v];
      currentWeight = weight;
    } else {
      currentRow.push(v);
      currentWeight += weight;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // Anti-orphan: if last row has 1 item and there's a previous row, rebalance
  if (rows.length >= 2 && rows[rows.length - 1].length === 1) {
    const last = rows.pop()!;
    const prev = rows.pop()!;
    const combined = [...prev, ...last];
    // Split combined evenly
    const mid = Math.ceil(combined.length / 2);
    rows.push(combined.slice(0, mid));
    rows.push(combined.slice(mid));
  }

  return rows;
}

function VideoGridRows({ videos, showTitles }: { videos: ProjectVideo[]; showTitles: boolean }) {
  const rows = buildRows(videos);

  return (
    <div className="space-y-4">
      {rows.map((rowVideos, rowIdx) => {
        // Single video → full width (portrait gets max-width constraint)
        if (rowVideos.length === 1) {
          const v = rowVideos[0];
          const isPortrait = (v.aspect_ratio ?? '16:9') === '9:16';
          return isPortrait ? (
            <div key={rowIdx} className="flex justify-center">
              <div className="w-full max-w-[280px]">
                <VideoCard video={v} showTitle={showTitles} />
              </div>
            </div>
          ) : (
            <div key={rowIdx}>
              <VideoCard video={v} showTitle={showTitles} />
            </div>
          );
        }

        // Mixed or uniform row — use flex with aspect-ratio-proportional widths
        // Each video gets width proportional to its aspect ratio so they all share the same height
        const ratios = rowVideos.map((v) => ratioValue(v.aspect_ratio ?? '16:9'));
        const totalRatio = ratios.reduce((a, b) => a + b, 0);

        return (
          <div key={rowIdx} className="flex gap-4">
            {rowVideos.map((video, i) => (
              <div key={video.id} style={{ flex: `${ratios[i] / totalRatio}` }}>
                <VideoCard video={video} showTitle={showTitles} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ── Section header ────────────────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-5 mt-24 mb-6">
      <div className="flex-1 border-t border-white/10" />
      <span className="text-sm tracking-[0.2em] uppercase font-mono text-white/50">{label}</span>
      <div className="flex-1 border-t border-white/10" />
    </div>
  );
}

/* ── VideoGroup ────────────────────────────────────────────────────────── */

function VideoGroup({ label, videos }: { label: string; videos: ProjectVideo[] }) {
  if (videos.length === 0) return null;
  const showTitles = videos.length > 1;

  return (
    <div>
      <SectionHeader label={label} />
      <VideoGridRows videos={videos} showTitles={showTitles} />
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────────────── */

export function ProjectAdditionalVideos({ videos, sections }: Props) {
  const nonFlagship = videos.filter((v) => v.video_type !== 'flagship' && !v.hidden);
  if (nonFlagship.length === 0) return null;

  const sortedSections = [...(sections ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const hasSections = sortedSections.length > 0;

  if (hasSections) {
    const ungrouped = nonFlagship.filter((v) => !v.section_id);
    return (
      <section className="pt-10 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {ungrouped.length > 0 && (
            <VideoGroup label="Additional" videos={ungrouped} />
          )}
          {sortedSections.map((sec) => {
            const sectionVideos = nonFlagship.filter((v) => v.section_id === sec.id);
            if (sectionVideos.length === 0) return null;
            return <VideoGroup key={sec.id} label={sec.name} videos={sectionVideos} />;
          })}
        </div>
      </section>
    );
  }

  // Fallback: group by video type
  const cutdowns = nonFlagship.filter((v) => v.video_type === 'cutdown');
  const bts = nonFlagship.filter((v) => v.video_type === 'bts');

  return (
    <section className="py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <VideoGroup label="Cutdowns" videos={cutdowns} />
        <VideoGroup label="Behind the Scenes" videos={bts} />
      </div>
    </section>
  );
}
