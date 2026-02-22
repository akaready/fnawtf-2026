'use client';

import Image from 'next/image';
import { Reveal, RevealGroup } from '@/components/animations/Reveal';

interface Founder {
  name: string;
  role: string;
  bio: string[];
  photo: string;
}

const founders: Founder[] = [
  {
    name: "Ol' Richie",
    role: 'Co-Founder • Creative Director',
    bio: [
      "Christened \"Ol' Richie\" via sprinkles on a birthday cake. It stuck. Multiple SXSW film festival alum. Spent three years as VP of Marketing at a crowdfunded hardware start-up.",
      'Hails from Texas. Austin, mostly. Boots, brisket, and breakfast tacos.',
    ],
    photo: '/images/about/FNA-richie-v01-RAR.jpg',
  },
  {
    name: 'Ready',
    role: 'Co-Founder • Creative Director',
    bio: [
      "New York City blood. Los Angeles graduate. San Francisco style. Gets a moment of zen when he hears, \"action!\" Two decades painting with light, dancing with lens, and sculpting with story. Find him in the back-country when not behind camera.",
    ],
    photo: '/images/about/FNA-ready-v01-RAR.jpg',
  },
];

const btsShots = [
  { src: '/images/about/bts-01.webp', alt: 'Behind the scenes' },
  { src: '/images/about/bts-03.webp', alt: 'Behind the scenes' },
  { src: '/images/about/bts-02.webp', alt: 'Behind the scenes' },
];

function FounderPhoto({ photo, name }: { photo: string; name: string }) {
  return (
    <div className="w-64 h-64 rounded-full overflow-hidden bg-muted border border-border mx-auto relative">
      <Image
        src={photo}
        alt={name}
        fill
        className="object-cover"
        sizes="256px"
      />
    </div>
  );
}

function FounderCard({ founder }: { founder: Founder }) {
  return (
    <div className="flex flex-col items-center text-center">
      <FounderPhoto photo={founder.photo} name={founder.name} />

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {btsShots.map((shot, i) => (
        <Reveal key={shot.src} delay={i * 0.1} distance="1.5em">
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-muted">
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function TeamSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="px-6 md:px-16 lg:px-24 max-w-5xl mx-auto">
        {/* Founder cards */}
        <RevealGroup stagger={150} distance="2em" className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {founders.map((founder) => (
            <FounderCard key={founder.name} founder={founder} />
          ))}
        </RevealGroup>
      </div>

      {/* BTS gallery — full width */}
      <div className="px-4 mt-20 md:mt-28">
        <BTSGrid />
      </div>
    </section>
  );
}
