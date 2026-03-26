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

export function ProjectVideoSection({ videos, projectThumbnailUrl }: ProjectVideoSectionProps) {
  const flagship = videos.find((v) => v.video_type === 'flagship');

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {flagship ? (
          <VideoPlayer video={flagship} thumbnailOverride={projectThumbnailUrl} />
        ) : (
          <EmptyPlaceholder />
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
