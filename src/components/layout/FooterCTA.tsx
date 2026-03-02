'use client';

import { NavButton } from './NavButton';

export function FooterCTA() {
  return (
    <section
      className="py-16 px-6 border-t border-border"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="max-w-7xl mx-auto text-center space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            Like what you see?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tell us about your project and let&apos;s build something great together.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <NavButton href="/start" isPrimary iconName="rocket">
            Get Started
          </NavButton>
          <NavButton href="/services" iconName="clipboard-list">
            Explore Services
          </NavButton>
        </div>
      </div>
    </section>
  );
}
