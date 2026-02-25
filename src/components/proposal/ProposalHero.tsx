'use client';

import { Reveal } from '@/components/animations/Reveal';
import type { ProposalRow } from '@/types/proposal';

interface Props {
  proposal: ProposalRow;
  animated?: boolean;
}

export function ProposalHero({ proposal, animated = true }: Props) {
  const Wrap = animated ? Reveal : ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return (
    <section
      className="pt-40 pb-20 px-6 lg:px-16 relative overflow-hidden border-b border-border"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, var(--surface-elevated) 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <Wrap distance="1.5em" duration={1.2}>
          <p className="text-sm tracking-[0.4em] uppercase text-white/30 font-mono mb-4">
            Proposal #{proposal.proposal_number}
          </p>
        </Wrap>

        <Wrap distance="2em" duration={1.2} delay={0.05}>
          <h1
            className="font-display font-bold text-white mb-8 leading-[0.88]"
            style={{ fontSize: 'clamp(3rem, 8vw, 9rem)' }}
          >
            {proposal.title}
          </h1>
        </Wrap>

        {proposal.subtitle && (
          <Wrap distance="1em" duration={1.0} delay={0.15}>
            <p className="text-lg text-white/50 max-w-lg mx-auto leading-relaxed">
              {proposal.subtitle}
            </p>
          </Wrap>
        )}
      </div>
    </section>
  );
}
