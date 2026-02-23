'use client';

import { useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  logoUrl: string;
  quote: string;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-[#0d0d0d] border border-border rounded-xl p-6 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold text-sm text-foreground leading-tight truncate">
            {testimonial.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{testimonial.title}</p>
        </div>
        {testimonial.logoUrl ? (
          <img
            src={testimonial.logoUrl}
            alt={testimonial.company}
            className="flex-shrink-0 h-6 max-w-[80px] object-contain opacity-60"
          />
        ) : (
          <span className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground bg-white/5 border border-white/10 px-2.5 py-1 rounded-md whitespace-nowrap">
            {testimonial.company}
          </span>
        )}
      </div>
      <hr className="border-border my-4" />
      <p className="text-sm leading-relaxed text-foreground/75">{testimonial.quote}</p>
    </div>
  );
}

function TestimonialColumn({
  items,
  direction,
  duration,
  isPaused,
  onMouseEnter,
  onMouseLeave,
  className,
}: {
  items: Testimonial[];
  direction: 'up' | 'down';
  duration: number;
  isPaused: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
}) {
  const doubled = [...items, ...items];

  return (
    <div
      className={`overflow-hidden h-full ${className ?? ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={direction === 'up' ? 'testimonial-scroll-up' : 'testimonial-scroll-down'}
        style={{
          animationDuration: `${duration}s`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
}

type ColumnId = 'left' | 'middle' | 'right';

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [hoveredColumn, setHoveredColumn] = useState<ColumnId | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Assign each unique person to exactly one column (round-robin by first appearance).
  // All testimonials from the same person land in the same column so the same
  // person is never visible in two columns simultaneously.
  const personToCol = new Map<string, number>();
  let nextCol = 0;
  const cols: Testimonial[][] = [[], [], []];
  for (const t of testimonials) {
    if (!personToCol.has(t.name)) {
      personToCol.set(t.name, nextCol % 3);
      nextCol++;
    }
    cols[personToCol.get(t.name)!].push(t);
  }
  const [col1, col2, col3] = cols;

  const isPaused = (id: ColumnId) => prefersReducedMotion || hoveredColumn === id;

  const maskStyle = {
    maskImage:
      'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
    WebkitMaskImage:
      'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
  } as React.CSSProperties;

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
            In Their Own Words
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nice things our clients have shared.
          </p>
        </div>

        {/* Three-column scrolling grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[720px] overflow-hidden"
          style={maskStyle}
        >
          {/* Left column — hidden on mobile, scrolls down */}
          <TestimonialColumn
            items={col1}
            direction="down"
            duration={72}
            isPaused={isPaused('left')}
            onMouseEnter={() => setHoveredColumn('left')}
            onMouseLeave={() => setHoveredColumn(null)}
            className="hidden md:block"
          />

          {/* Middle column — always visible, scrolls up */}
          <TestimonialColumn
            items={col2}
            direction="up"
            duration={62}
            isPaused={isPaused('middle')}
            onMouseEnter={() => setHoveredColumn('middle')}
            onMouseLeave={() => setHoveredColumn(null)}
          />

          {/* Right column — hidden on mobile, scrolls down */}
          <TestimonialColumn
            items={col3}
            direction="down"
            duration={66}
            isPaused={isPaused('right')}
            onMouseEnter={() => setHoveredColumn('right')}
            onMouseLeave={() => setHoveredColumn(null)}
            className="hidden md:block"
          />
        </div>
      </div>
    </section>
  );
}
