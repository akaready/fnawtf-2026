'use client';

interface ProjectHeroProps {
  clientName: string;
  title: string;
  subtitle?: string | null;
}

export function ProjectHero({ clientName, title, subtitle }: ProjectHeroProps) {
  return (
    <section
      className="pt-40 pb-20 px-6 lg:px-16 relative overflow-hidden border-b border-border"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Radial vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, var(--surface-elevated) 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <p className="text-sm tracking-[0.4em] uppercase text-white/30 font-mono mb-4">
          Work / {clientName}
        </p>

        <h1
          className="font-display font-bold text-white mb-6 leading-[0.88]"
          style={{ fontSize: 'clamp(3rem, 8vw, 9rem)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
