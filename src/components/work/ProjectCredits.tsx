'use client';

import type { ProjectCredit } from '@/types/project';

interface ProjectCreditsProps {
  credits: ProjectCredit[];
}

export function ProjectCredits({ credits }: ProjectCreditsProps) {
  if (credits.length === 0) return null;

  return (
    <section className="pt-10 pb-20 px-6 lg:px-16 border-b border-border">
      <div className="max-w-lg mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase font-mono text-muted-foreground mb-3">
          creative team
        </p>
        <div className="w-8 border-t border-white/20 mx-auto mb-10" />

        <div className="flex flex-col">
          {credits.map((credit) => (
            <p key={credit.id} className="leading-snug mb-2 text-xl">
              <span className="text-muted-foreground font-light">
                {credit.role.toLowerCase()}{' '}
              </span>
              <span className="text-foreground font-bold font-display">
                {credit.name.toUpperCase()}
              </span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
