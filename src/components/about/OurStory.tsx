'use client';

import { Reveal } from '@/components/animations/Reveal';

const paragraphs = [
  <>
    Ol&apos; Richie was in a tight spot. His D.P. dropped out just two weeks before the shoot.
    He sent a fateful email through his network, asking for recommendations. That email found its
    way to Ready. Ready recommended himself.
  </>,
  <>
    The pair shared a belief that making things should be fun. That accepting challenges makes
    things even more fun. And that every project should be given the time and attention it truly
    deserves. Also, transparency. Lots of it.
  </>,
  <>
    Over coffee, they schemed. &ldquo;Clients should be our friends&hellip; Our own network is
    full of our greatest allies&hellip;&rdquo; A brand was born. And many years of fruitful
    collaboration later, they are still having a blast together.
  </>,
];

export function OurStory() {
  return (
    <section className="px-6 pt-0 pb-24 md:pb-32">
      <div className="max-w-2xl mx-auto">
        <Reveal distance="1.5em" threshold={0.1}>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-3">
            Our Story
          </h2>
          <span className="block text-accent text-3xl leading-none select-none mb-6">￣</span>
        </Reveal>

        <div className="flex flex-col gap-8">
          {paragraphs.map((para, i) => (
            <Reveal key={i} delay={i * 0.12} distance="1.5em" threshold={0.1}>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                {para}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
