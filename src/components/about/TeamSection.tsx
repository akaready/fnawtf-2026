'use client';

import { Reveal, RevealGroup } from '@/components/animations/Reveal';

interface Founder {
  name: string;
  role: string;
  bio: string[];
  photoLabel: string;
}

const founders: Founder[] = [
  {
    name: "Ol' Richie",
    role: 'Co-Founder • Creative Director',
    bio: [
      "Christened \"Ol' Richie\" via sprinkles on a birthday cake. It stuck. Multiple SXSW film festival alum. Spent three years as VP of Marketing at a crowdfunded hardware start-up.",
      'Hails from Texas. Austin, mostly. Boots, brisket, and breakfast tacos.',
    ],
    photoLabel: "Photo — Ol' Richie",
  },
  {
    name: 'Ready',
    role: 'Co-Founder • Creative Director',
    bio: [
      "New York City blood. Los Angeles graduate. San Francisco style. Gets his moment of zen when he hears, \"action!\"",
      "Two decades painting with light, dancing with lens, and sculpting with story. Find him in the back-country when he's not behind camera.",
    ],
    photoLabel: 'Photo — Ready',
  },
];

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="w-48 h-48 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center mx-auto">
      <span className="text-muted-foreground/40 text-xs font-mono tracking-widest uppercase text-center px-4">
        {label}
      </span>
    </div>
  );
}

function FounderCard({ founder }: { founder: Founder }) {
  return (
    <div className="flex flex-col items-center text-center">
      <ImagePlaceholder label={founder.photoLabel} />

      <div className="mt-6">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-0.5">
          {founder.name}
        </h3>

        <span className="block text-accent text-2xl leading-none mb-3 select-none">
          ￣
        </span>

        <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-4">
          {founder.role}
        </p>

        <p className="text-base text-foreground/80 leading-relaxed text-left">
          {founder.bio.join(' ')}
        </p>
      </div>
    </div>
  );
}

function BTSGrid() {
  const shots = ['BTS — On Set', 'BTS — Behind Camera', 'BTS — The Work'];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 md:mt-28">
      {shots.map((label, i) => (
        <Reveal key={label} delay={i * 0.1} distance="1.5em">
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-muted border border-border">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground/40 text-sm font-mono tracking-widest uppercase">
                {label}
              </span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function TeamSection() {
  return (
    <section className="px-6 md:px-16 lg:px-24 py-16 md:py-24">
      <div className="max-w-5xl mx-auto">
        {/* Founder cards */}
        <RevealGroup stagger={150} distance="2em" className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {founders.map((founder) => (
            <FounderCard key={founder.name} founder={founder} />
          ))}
        </RevealGroup>

        {/* BTS gallery */}
        <BTSGrid />
      </div>
    </section>
  );
}
