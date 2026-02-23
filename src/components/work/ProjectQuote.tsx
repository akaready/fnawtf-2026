'use client';

interface ProjectQuoteProps {
  quote: string;
  personName?: string | null;
  personTitle?: string | null;
}

export function ProjectQuote({ quote, personName, personTitle }: ProjectQuoteProps) {
  const attribution = [personName, personTitle].filter(Boolean).join(', ');

  return (
    <section className="py-10 px-6 lg:px-16">
      <div className="max-w-3xl mx-auto text-center">
        <blockquote
          className="font-display font-bold text-white mb-3 leading-snug"
          style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)' }}
        >
          <span
            className="text-accent select-none"
            style={{ fontSize: '1.4em', lineHeight: 0, verticalAlign: '-0.15em', marginRight: '0.1em' }}
            aria-hidden="true"
          >
            &ldquo;
          </span>
          {quote}
          <span
            className="text-accent select-none"
            style={{ fontSize: '1.4em', lineHeight: 0, verticalAlign: '-0.15em', marginLeft: '0.1em' }}
            aria-hidden="true"
          >
            &rdquo;
          </span>
        </blockquote>

        {attribution && (
          <p className="text-lg text-white/45 mt-1">
            — {attribution}
          </p>
        )}
      </div>
    </section>
  );
}
