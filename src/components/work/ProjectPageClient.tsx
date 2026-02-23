'use client';

import { ProjectHero } from './ProjectHero';
import { ProjectVideoSection } from './ProjectVideoSection';
import { ProjectQuote } from './ProjectQuote';
import { ProjectDeliveryAndDescription } from './ProjectDeliveryAndDescription';
import { ProjectMetaGrid } from './ProjectMetaGrid';
import { ProjectBTSGrid } from './ProjectBTSGrid';
import { ProjectCredits } from './ProjectCredits';
import type { ProjectVideo, ProjectCredit, ProjectBTSImage } from '@/types/project';

interface ProjectData {
  title: string;
  subtitle: string;
  description: string;
  client_name: string;
  client_quote?: string | null;
  thumbnail_url?: string | null;
  assets_delivered?: string[] | null;
  style_tags?: string[] | null;
  premium_addons?: string[] | null;
  camera_techniques?: string[] | null;
  production_days?: number | null;
  crew_count?: number | null;
  talent_count?: number | null;
  location_count?: number | null;
}

interface QuoteAttribution {
  quote: string;
  person_name: string | null;
  person_title: string | null;
  display_title: string | null;
}

interface ProjectPageClientProps {
  project: ProjectData;
  videos: ProjectVideo[];
  credits: ProjectCredit[];
  btsImages: ProjectBTSImage[];
  quoteAttribution?: QuoteAttribution | null;
}

export function ProjectPageClient({
  project,
  videos,
  credits,
  btsImages,
  quoteAttribution,
}: ProjectPageClientProps) {
  return (
    <main className="min-h-screen bg-background">
      <ProjectHero
        clientName={project.client_name}
        title={project.title}
        subtitle={project.subtitle}
      />

      <ProjectVideoSection videos={videos} projectThumbnailUrl={project.thumbnail_url} />

      {(quoteAttribution?.quote || project.client_quote) && (
        <ProjectQuote
          quote={quoteAttribution?.quote ?? project.client_quote!}
          personName={quoteAttribution?.person_name ?? project.client_name}
          personTitle={quoteAttribution?.display_title ?? quoteAttribution?.person_title}
        />
      )}

      <ProjectDeliveryAndDescription
        assetsDelivered={project.assets_delivered ?? []}
        description={project.description}
      />

      <ProjectMetaGrid
        styleTags={project.style_tags ?? []}
        premiumAddons={project.premium_addons ?? []}
        cameraTechniques={project.camera_techniques ?? []}
        productionDays={project.production_days ?? null}
        crewCount={project.crew_count ?? null}
        talentCount={project.talent_count ?? null}
        locationCount={project.location_count ?? null}
      />

      <ProjectBTSGrid images={btsImages} />

      <ProjectCredits credits={credits} />
    </main>
  );
}
