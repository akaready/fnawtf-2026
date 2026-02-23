'use client';

import Image from 'next/image';
import type { ProjectBTSImage } from '@/types/project';

interface ProjectBTSGridProps {
  images: ProjectBTSImage[];
}

export function ProjectBTSGrid({ images }: ProjectBTSGridProps) {
  if (images.length === 0) return null;

  return (
    <section className="py-10 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-[4/3] w-full rounded-xl overflow-hidden">
              <Image
                src={image.image_url}
                alt={image.caption ?? 'Behind the scenes'}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
