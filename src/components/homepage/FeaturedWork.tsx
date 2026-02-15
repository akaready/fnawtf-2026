'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Featured project data interface
 */
export interface FeaturedProject {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  thumbnailUrl: string;
  hoverVideoSrc?: string;
}

/**
 * Props for the FeaturedWork component
 */
interface FeaturedWorkProps {
  projects?: FeaturedProject[];
}

/**
 * FeaturedWork component displaying a masonry grid of featured projects.
 * Fetches data from Supabase if not provided.
 */
export function FeaturedWork({ projects: initialProjects }: FeaturedWorkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<FeaturedProject[]>(initialProjects || []);
  const [isLoading, setIsLoading] = useState(!initialProjects);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch featured projects from Supabase if not provided
  useEffect(() => {
    if (initialProjects) return;

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects/featured');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch featured projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [initialProjects]);

  const placeholderProjects: FeaturedProject[] = [
    {
      id: 'placeholder-1',
      title: 'Stealth Fintech Launch Film',
      subtitle: 'Brand film + launch page + paid social cutdowns',
      slug: 'stealth-fintech-launch-film',
      thumbnailUrl: '/images/placeholders/work-01.jpg',
      hoverVideoSrc: '/videos/placeholders/work-01.mp4',
    },
    {
      id: 'placeholder-2',
      title: 'Healthcare Product Story',
      subtitle: 'Narrative explainer for enterprise rollout',
      slug: 'healthcare-product-story',
      thumbnailUrl: '/images/placeholders/work-02.jpg',
      hoverVideoSrc: '/videos/placeholders/work-02.mp4',
    },
    {
      id: 'placeholder-3',
      title: 'SaaS Founder Mini-Doc',
      subtitle: 'Founder-led campaign across web + email',
      slug: 'saas-founder-mini-doc',
      thumbnailUrl: '/images/placeholders/work-03.jpg',
      hoverVideoSrc: '/videos/placeholders/work-03.mp4',
    },
    {
      id: 'placeholder-4',
      title: 'Consumer Brand Launch Teaser',
      subtitle: 'Social-first teaser system and paid motion ads',
      slug: 'consumer-brand-launch-teaser',
      thumbnailUrl: '/images/placeholders/work-04.jpg',
      hoverVideoSrc: '/videos/placeholders/work-04.mp4',
    },
    {
      id: 'placeholder-5',
      title: 'AI Product Positioning Reel',
      subtitle: 'Positioning film and homepage story arc',
      slug: 'ai-product-positioning-reel',
      thumbnailUrl: '/images/placeholders/work-05.jpg',
      hoverVideoSrc: '/videos/placeholders/work-05.mp4',
    },
    {
      id: 'placeholder-6',
      title: 'Ecom Brand Relaunch',
      subtitle: 'Performance creative suite for paid channels',
      slug: 'ecom-brand-relaunch',
      thumbnailUrl: '/images/placeholders/work-06.jpg',
      hoverVideoSrc: '/videos/placeholders/work-06.mp4',
    },
  ];

  const projectsToRender = projects.length > 0 ? projects : placeholderProjects;

  return (
    <section className="py-16 md:py-24 bg-background" data-reveal-group>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div data-reveal-group-nested>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Featured Work
            </h2>
            <p className="mt-2 text-muted-foreground">
              Selected projects from our portfolio
            </p>
          </div>
          <a
            href="/work"
            className="inline-flex items-center text-accent hover:text-accent/80 transition-colors font-medium"
            data-reveal-group-nested
          >
            View all projects
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>

        {/* Masonry Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-lg bg-muted-foreground/10 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]"
            data-reveal-group
            data-stagger={100}
          >
            {projectsToRender.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Individual project card component
 */
interface ProjectCardProps {
  project: FeaturedProject;
  index: number;
  prefersReducedMotion: boolean;
}

function ProjectCard({ project, index, prefersReducedMotion }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const heightClass =
    index % 5 === 0
      ? 'h-[30rem]'
      : index % 3 === 0
      ? 'h-[24rem]'
      : 'h-[20rem]';

  return (
    <a
      href={`/work/${project.slug}`}
      className="group relative mb-6 block break-inside-avoid overflow-hidden rounded-2xl border border-border bg-black"
      data-reveal-group-nested
      data-video-on-hover={isHovered ? 'active' : 'not-active'}
      data-video-src={project.hoverVideoSrc || ''}
      style={{
        opacity: prefersReducedMotion ? 1 : 0,
        transform: prefersReducedMotion ? 'none' : 'translateY(2em)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setVideoLoaded(false);
      }}
    >
      {/* Thumbnail / video area */}
      <div className={`relative ${heightClass} overflow-hidden`}>
        {!imageFailed ? (
          <Image
            src={project.thumbnailUrl}
            alt={project.title}
            fill
            onError={() => setImageFailed(true)}
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              isHovered && project.hoverVideoSrc ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/60 via-purple-700/60 to-black flex items-end p-5">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/80">
              Placeholder Preview
            </span>
          </div>
        )}

        {/* Hover Video */}
        {project.hoverVideoSrc && (
          <video
            ref={videoRef}
            src={project.hoverVideoSrc}
            muted
            loop
            playsInline
            preload={isHovered ? 'auto' : 'none'}
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered && videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* White detail panel */}
      <div className="bg-white px-5 py-4 text-black">
        <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
          <h3 className="font-display text-xl font-bold text-black">
            {project.title}
          </h3>
          <p className="mt-1 text-sm text-black/70 line-clamp-2">
            {project.subtitle}
          </p>
        </div>

        <div className="mt-3 flex items-center text-black/60 group-hover:text-black transition-all duration-300">
          <span className="text-sm font-medium">View Project</span>
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
