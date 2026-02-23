'use client';

import { Video } from 'lucide-react';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { VideoPasswordGate } from './VideoPasswordGate';
import { getBunnyVideoMp4Url, getBunnyVideoThumbnail } from '@/lib/bunny/client';
import type { ProjectVideo } from '@/types/project';

interface ProjectVideoSectionProps {
  videos: ProjectVideo[];
  projectThumbnailUrl?: string | null;
}

/** Convert DB ratio ('9:16') to CSS aspect-ratio value ('9/16') */
function toCssRatio(r: string) {
  return r.replace(':', '/');
}

/** Determine grid column count for a set of cutdowns based on their aspect ratio */
function cutdownCols(count: number, ratio: string): number {
  if (count === 0) return 1;
  const isPortrait = ratio === '9:16';
  const isSquare = ratio === '1:1';

  if (isPortrait) {
    if (count === 1) return 1; // handled separately as centered narrow col
    if (count <= 4) return count;
    return 4; // 5+ → 4-col rows
  }

  if (isSquare) {
    if (count <= 3) return count;
    return 4;
  }

  // Landscape (16:9, 4:3, 21:9)
  if (count === 1) return 1;
  if (count === 3 || count >= 5) return 3;
  return 2; // 2 or 4 → 2×2
}

export function ProjectVideoSection({ videos, projectThumbnailUrl }: ProjectVideoSectionProps) {
  const flagship = videos.find((v) => v.video_type === 'flagship');
  const cutdowns = videos.filter((v) => v.video_type === 'cutdown');
  const isEmpty = !flagship && cutdowns.length === 0;

  const cutdownRatio = cutdowns[0]?.aspect_ratio ?? '16:9';
  const cols = cutdownCols(cutdowns.length, cutdownRatio);
  const isPortraitSingle = cutdownRatio === '9:16' && cutdowns.length === 1;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {isEmpty ? (
          <EmptyPlaceholder />
        ) : (
          <>
            {flagship && <VideoPlayer video={flagship} thumbnailOverride={projectThumbnailUrl} />}

            {cutdowns.length > 0 && (
              isPortraitSingle ? (
                // Single portrait: center at a natural portrait width
                <div className={`flex justify-center${flagship ? ' mt-4' : ''}`}>
                  <div className="w-full max-w-[280px]">
                    <VideoPlayer video={cutdowns[0]} thumbnailOverride={projectThumbnailUrl} />
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-4${flagship ? ' mt-4' : ''}`}
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {cutdowns.map((video) => (
                    <div key={video.id}>
                      {cutdowns.length > 1 && (
                        <p className="text-xs tracking-[0.4em] uppercase font-mono text-white/30 mb-2">
                          {video.title || videoTypeLabel(video.video_type)}
                        </p>
                      )}
                      <VideoPlayer video={video} thumbnailOverride={projectThumbnailUrl} />
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </section>
  );
}

function EmptyPlaceholder() {
  return (
    <div
      className="w-full rounded-lg border border-white/10 bg-white/[0.03] flex flex-col items-center justify-center gap-3 text-white/20"
      style={{ aspectRatio: '16/9' }}
    >
      <Video className="w-10 h-10" strokeWidth={1} />
      <p className="text-xs tracking-[0.3em] uppercase font-mono">Video coming soon</p>
    </div>
  );
}

function VideoPlayer({ video, thumbnailOverride }: { video: ProjectVideo; thumbnailOverride?: string | null }) {
  const aspectRatio = toCssRatio(video.aspect_ratio ?? '16:9');
  const placeholder = thumbnailOverride || getBunnyVideoThumbnail(video.bunny_video_id);

  // Pitch and password_protected videos are always gated (with or without a password set)
  const needsGate = video.video_type === 'pitch' || video.password_protected;
  if (needsGate) {
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

function videoTypeLabel(type: ProjectVideo['video_type']): string {
  const labels: Record<ProjectVideo['video_type'], string> = {
    flagship: 'Hero Film',
    cutdown: 'Cut-Down',
    bts: 'Behind the Scenes',
    pitch: 'Pitch Video',
  };
  return labels[type] ?? type;
}
