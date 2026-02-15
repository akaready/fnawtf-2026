'use client';

import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * Service card data interface
 */
export interface ServiceCard {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
}

/**
 * Props for the ServicesCards component
 */
interface ServicesCardsProps {
  cards: ServiceCard[];
}

/**
 * ServicesCards component displaying three service offerings.
 * Uses grid layout with hover animations.
 */
export function ServicesCards({ cards }: ServicesCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            How can we help?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Choose your path to success
          </p>
        </div>

        {/* Cards Grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          data-reveal-group
          data-stagger={150}
        >
          {cards.map((card, index) => (
            <a
              key={card.title}
              href={card.href}
              className="group relative flex flex-col p-8 rounded-xl bg-muted/30 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10"
              data-reveal-group-nested
            >
              {/* Card Number */}
              <span className="absolute top-4 left-4 font-mono text-sm text-muted-foreground">
                0{index + 1}
              </span>

              {/* Card Content */}
              <div className="flex-1 mt-4">
                <h3 className="font-display text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                  {card.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-6 flex items-center text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-display text-sm font-medium">Learn more</span>
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </div>

              {/* Hover Border Effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-accent/0 group-hover:border-accent/30 transition-colors duration-300 pointer-events-none" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
