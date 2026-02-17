'use client';

import { FeaturedProject } from '@/types/project';
import { FeaturedWorkCard } from '@/components/homepage/FeaturedWorkCard';
import { RevealGroup, RevealItem } from '@/components/animations/Reveal';

interface WorkGridProps {
  projects: FeaturedProject[];
}

export function WorkGrid({ projects }: WorkGridProps) {
  if (projects.length === 0) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg text-muted-foreground">
          No projects match your filters.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <RevealGroup
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      stagger={150}
    >
      {projects.map((project) => {
        const colSpanClass = project.fullWidth ? 'lg:col-span-2' : '';
        return (
          <RevealItem key={project.id}>
            <FeaturedWorkCard
              project={project}
              className={colSpanClass}
            />
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
