'use client';

interface SlideHeaderProps {
  eyebrow: string;
  titleWords: string[];
  description?: string;
  className?: string;
  titleStyle?: React.CSSProperties;
}

/**
 * Shared header used by every content slide in the proposal deck.
 * Renders consistent eyebrow / title / purple accent line / description.
 *
 * GSAP targets (queried by parent slide's useEffect):
 *   [data-eyebrow]     — opacity + y
 *   [data-word]        — y: '115%' → '0%' clip-reveal
 *   [data-accent-line] — scaleX: 0 → 1, origin 'left center'
 *   [data-desc]        — opacity + y
 */
export function SlideHeader({ eyebrow, titleWords, description, className, titleStyle }: SlideHeaderProps) {
  return (
    <div className={className}>
      <p
        data-eyebrow
        className="text-sm font-mono tracking-[0.4em] uppercase text-white/50 mb-3"
      >
        {eyebrow}
      </p>

      <h2
        className="font-display font-bold text-white leading-[1.05] mb-3"
        style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)', ...titleStyle }}
      >
        {titleWords.map((word, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden pb-[0.15em]"
            style={{ verticalAlign: 'top' }}
          >
            <span data-word className="inline-block">
              {word}{i < titleWords.length - 1 ? '\u00a0' : ''}
            </span>
          </span>
        ))}
      </h2>

      <div
        data-accent-line
        className="h-0.5 w-10 bg-[var(--accent)] mb-5 rounded-full"
        style={{ transformOrigin: 'left center' }}
      />

      {description && (
        <p data-desc className="text-white/50 text-base leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
