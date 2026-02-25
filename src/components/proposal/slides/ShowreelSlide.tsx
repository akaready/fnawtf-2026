'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { getBunnyVideoMp4Url, getBunnyVideoThumbnail } from '@/lib/bunny/client';

type ProposalVideo = {
  id: string;
  proposal_id: string;
  sort_order: number;
  section_id?: string;
  project_video: {
    id: string;
    bunny_video_id: string;
    title: string;
    video_type: string;
    aspect_ratio: string;
    project?: {
      id: string;
      title: string;
      subtitle: string | null;
      category: string | null;
      style_tags: string[] | null;
    } | null;
  } | null;
};

interface Props {
  videos: ProposalVideo[];
  slideRef?: React.RefObject<HTMLElement>;
}

function toCssRatio(r: string) { return r.replace(':', '/'); }

export function ShowreelSlide({ videos, slideRef }: Props) {
  const innerRef    = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const valid = videos.filter((v) => v.project_video);
  const hero  = valid[0];
  const rest  = valid.slice(1);

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const eyebrow = el.querySelector('[data-eyebrow]') as HTMLElement;
      const items   = el.querySelectorAll('[data-video-item]');

      gsap.set(eyebrow, { opacity: 0, y: 12 });
      gsap.set(items,   { opacity: 0, y: 24, scale: 0.97 });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          gsap.timeline()
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
            .to(items,   { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, '-=0.2');
        }
      }, { threshold: 0.3 });

      observer.observe(el.closest('[data-slide]') ?? el);
      return () => observer.disconnect();
    }, innerRef);

    return () => ctx.revert();
  }, []);

  if (valid.length === 0) return null;

  return (
    <section
      ref={slideRef as React.RefObject<HTMLElement>}
      data-slide
      className="[scroll-snap-align:start] flex-shrink-0 w-screen h-screen flex flex-col justify-center bg-black overflow-hidden"
    >
      <div ref={innerRef} className="max-w-6xl mx-auto px-8 py-10 w-full h-full flex flex-col">

        <p data-eyebrow className="text-sm font-mono tracking-[0.4em] uppercase text-white/50 mb-6 flex-shrink-0">
          Sample Work
        </p>

        {/* Hero video — always full width */}
        {hero && (
          <div data-video-item className="flex-shrink-0 mb-5 group cursor-pointer" onClick={() => toggle(hero.id)}>
            <div className="overflow-hidden rounded-lg">
              <ReelPlayer
                videoSrc={getBunnyVideoMp4Url(hero.project_video!.bunny_video_id, '720p')}
                placeholderSrc={getBunnyVideoThumbnail(hero.project_video!.bunny_video_id)}
                aspectRatio={toCssRatio(hero.project_video!.aspect_ratio)}
                defaultMuted={false}
                hoverPreview={true}
              />
            </div>
            <VideoMeta video={hero} />
          </div>
        )}

        {/* Secondary videos */}
        {rest.length > 0 && (
          <div className="flex gap-4 min-h-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {rest.map((v) => {
              const isExpanded = expandedId === v.id;
              return (
                <div
                  key={v.id}
                  data-video-item
                  className="group cursor-pointer flex-shrink-0 transition-all duration-300"
                  style={{ width: isExpanded ? '100%' : 'clamp(180px, 22vw, 280px)' }}
                  onClick={() => toggle(v.id)}
                >
                  <div className="overflow-hidden rounded-lg">
                    <ReelPlayer
                      videoSrc={getBunnyVideoMp4Url(v.project_video!.bunny_video_id, '720p')}
                      placeholderSrc={getBunnyVideoThumbnail(v.project_video!.bunny_video_id)}
                      aspectRatio={toCssRatio(v.project_video!.aspect_ratio)}
                      defaultMuted={false}
                      hoverPreview={true}
                    />
                  </div>
                  <VideoMeta video={v} />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}

function VideoMeta({ video }: { video: ProposalVideo }) {
  const pv      = video.project_video!;
  const project = pv.project;

  // Use project subtitle as blurb, project style_tags as tag pills
  const blurb = project?.subtitle ?? pv.title;
  const tags  = project?.style_tags ?? [];

  return (
    <div className="mt-2 px-0.5">
      <p className="text-sm text-white/30 group-hover:text-white/65 transition-colors duration-200 truncate leading-relaxed">
        {blurb}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono tracking-wide text-white/30 bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
