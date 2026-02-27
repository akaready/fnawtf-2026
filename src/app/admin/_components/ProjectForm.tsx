'use client';

import { useState } from 'react';
import { MetadataTab } from './MetadataTab';
import { VideosTab } from './VideosTab';
import { CreditsTab } from './CreditsTab';
import { BTSTab } from './BTSTab';
import { ThumbnailGallery } from './ThumbnailGallery';

type Tab = 'metadata' | 'videos' | 'thumbnail' | 'credits' | 'bts';

export type TagSuggestions = {
  style_tags: string[];
  premium_addons: string[];
  camera_techniques: string[];
  assets_delivered: string[];
  project_type: string[];
};

export type TestimonialOption = {
  id: string;
  quote: string;
  person_name: string | null;
  project_id: string | null;
  client_id: string | null;
};

interface Props {
  project: Record<string, unknown> & { id: string } | null;
  videos: Array<Record<string, unknown> & { id: string; bunny_video_id: string; title: string; video_type: 'flagship' | 'cutdown' | 'bts'; sort_order: number }>;
  credits: Array<{ id?: string; role: string; name: string; sort_order: number; role_id?: string | null; contact_id?: string | null }>;
  btsImages: Array<{ id?: string; image_url: string; caption: string | null; sort_order: number }>;
  tagSuggestions?: TagSuggestions;
  testimonials?: TestimonialOption[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'metadata', label: 'Metadata' },
  { id: 'videos', label: 'Videos' },
  { id: 'thumbnail', label: 'Thumbnail' },
  { id: 'credits', label: 'Credits' },
  { id: 'bts', label: 'BTS' },
];

export function ProjectForm({ project, videos, credits, btsImages, tagSuggestions, testimonials }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('metadata');
  const isNew = !project;

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-8 border-b border-border/30">
        {TABS.map((tab) => {
          const disabled = isNew && tab.id !== 'metadata';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative -mb-px ${
                disabled
                  ? 'text-muted-foreground/25 cursor-not-allowed'
                  : activeTab === tab.id
                  ? 'text-foreground border-b-2 border-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {disabled && (
                <span className="ml-1 text-[10px] text-[#303033]">(save first)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'metadata' && (
        <MetadataTab project={project as Parameters<typeof MetadataTab>[0]['project']} tagSuggestions={tagSuggestions} testimonials={testimonials} />
      )}
      {activeTab === 'videos' && project && (
        <VideosTab projectId={project.id} initialVideos={videos as unknown as Parameters<typeof VideosTab>[0]['initialVideos']} />
      )}
      {activeTab === 'thumbnail' && project && (
        <ThumbnailGallery
          projectId={project.id}
          videos={videos}
          currentThumbnailUrl={(project.thumbnail_url as string) ?? ''}
        />
      )}
      {activeTab === 'credits' && project && (
        <CreditsTab projectId={project.id} initialCredits={credits} />
      )}
      {activeTab === 'bts' && project && (
        <BTSTab projectId={project.id} initialImages={btsImages} />
      )}
    </div>
  );
}
