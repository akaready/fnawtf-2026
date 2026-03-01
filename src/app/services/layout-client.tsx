'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { ServicesTags } from '@/components/services/ServicesTags';
import { ProjectReel, ServicesProjectGrid } from '@/components/services/ProjectReel';
import { PHASES, CROWDFUNDING, FUNDRAISING, ServicesProjectData } from '@/components/services/ServicesData';
import { NavButton } from '@/components/layout/NavButton';
import { CalBookingButton } from '@/components/cal/CalBookingButton';

type ServiceProj = { id: string; title: string; subtitle?: string; slug: string; thumbnail_url?: string; category?: string };


function PhaseSection({ phase, projects, index }: { phase: typeof PHASES[number]; projects: ServiceProj[]; index: number }) {
  const isEven = index % 2 === 0;
  const sectionRef = useRef<HTMLElement>(null);
  const isActive = useInView(sectionRef, { once: false, margin: '0px 0px -70% 0px' });

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-32 border-b border-white/5 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start lg:items-stretch ${isEven ? '' : 'lg:[direction:rtl]'}`}>
          {/* Content — ghost number anchors right edge to this column */}
          <div className={`relative overflow-visible ${isEven ? '' : 'lg:[direction:ltr]'}`}>
            {/* Ghost number: right-aligned to this column, overflows left */}
            <div
              className="absolute -top-16 right-0 font-display font-bold text-white/[0.035] leading-none select-none pointer-events-none z-0"
              style={{ fontSize: 'clamp(8rem, 20vw, 16rem)' }}
            >
              {phase.number}
            </div>
            <div className="flex items-center gap-4 mb-2">
              <motion.div
                className="w-px h-8"
                animate={{ backgroundColor: isActive ? '#a14dfd' : 'rgba(255,255,255,0.2)' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <motion.span
                className="text-xs tracking-[0.3em] uppercase font-mono"
                animate={{ color: isActive ? '#a14dfd' : 'rgba(255,255,255,0.4)' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {phase.number}
              </motion.span>
            </div>

            <motion.h2
              className="font-display font-bold mb-6 leading-[0.9]"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)' }}
              animate={{ color: isActive ? '#a14dfd' : '#ffffff' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {phase.title}
            </motion.h2>

            <p className="text-lg text-white/50 mb-6 font-light leading-relaxed">
              {phase.tagline}
            </p>

            <p className="text-lg text-white/70 leading-relaxed mb-8">
              {phase.description}
            </p>

            <ServicesTags tags={phase.tags} variant="pill" className="mb-8" linkParam="addons" />

            <div className="flex items-center gap-4 flex-wrap">
              <div className="mr-2">
                <p className="text-xs tracking-[0.2em] uppercase text-white/30 mb-1">Starting at</p>
                <p className="text-2xl font-display font-bold text-white">{phase.startingAt}</p>
              </div>
              {phase.startingAt === 'Custom' ? (
                <CalBookingButton
                  buttonText="Let's talk"
                  variant="inverted"
                  size="lg"
                  namespace="introduction"
                  calLink="fnawtf/introduction"
                />
              ) : (
                <NavButton href="/pricing" iconName="dollar-sign" inverted size="lg">
                  See pricing
                </NavButton>
              )}
            </div>
          </div>

          {/* Project grid */}
          <div className={isEven ? '' : 'lg:[direction:ltr]'}>
            {projects.length > 0 ? (
              <ServicesProjectGrid
                projects={projects}
                subGridVariant="square"
              />
            ) : (
              <div className="flex items-center justify-center h-48 border border-white/5 rounded-lg">
                <p className="text-white/20 text-sm font-mono text-center">
                  Projects coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}

export function ServicesLayout({ projects }: { projects: ServicesProjectData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const additionalRef = useRef<HTMLElement>(null);
  const crowdfundingRef = useRef<HTMLDivElement>(null);
  const fundraisingRef = useRef<HTMLDivElement>(null);

  const isAdditionalActive = useInView(additionalRef, { once: false, margin: '0px 0px -70% 0px' });
  const isCrowdfundingActive = useInView(crowdfundingRef, { once: false, margin: '0px 0px -60% 0px' });
  const isFundraisingActive = useInView(fundraisingRef, { once: false, margin: '0px 0px -60% 0px' });

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-black text-white"
    >
      {/* <VerticalSpine /> */}

      {/* ── Hero ─────────────────────────────────── */}
      <section
        className="pt-40 pb-20 px-6 lg:px-16 relative overflow-hidden border-b border-border"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* Radial fade so the dots vignette at the edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, var(--surface-elevated) 100%)',
          }}
        />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <p className="text-sm tracking-[0.4em] uppercase text-white/30 font-mono mb-8">
            Services
          </p>
          <h1
            className="font-display font-bold text-white mb-8 leading-[0.88] whitespace-nowrap"
            style={{ fontSize: 'clamp(3rem, 8vw, 9rem)' }}
          >
            What We Do
          </h1>
          <p className="text-xl text-white/50 max-w-lg mx-auto leading-relaxed">
            Engagements built for where you are and where you&apos;re going.
            Three phases. One direction: yours.
          </p>
        </div>
      </section>

      {/* ── Phases ───────────────────────────────── */}
      {PHASES.map((phase, i) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          projects={projects[phase.id as keyof ServicesProjectData] as ServiceProj[]}
          index={i}
        />
      ))}

      {/* ── Additional Services ───────────────────── */}
      <section ref={additionalRef} className="pt-12 pb-16 lg:pt-20 lg:pb-32 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.p
            className="text-xs tracking-[0.4em] uppercase font-mono mb-6"
            animate={{ color: isAdditionalActive ? '#a14dfd' : 'rgba(255,255,255,0.3)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            Additional Services
          </motion.p>

          <motion.h2
            className="font-display font-bold mb-8 lg:mb-16 leading-[0.9]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            animate={{ color: isAdditionalActive ? '#a14dfd' : '#ffffff' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            Flexible Engagements
          </motion.h2>

          <div className="space-y-10 lg:space-y-16">
            {/* Crowdfunding */}
            <div ref={crowdfundingRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 border-t border-white/10 pt-6 lg:pt-10">
              {/* Col 1: Title + tagline */}
              <div>
                <motion.h3
                  className="font-display font-bold mb-3"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
                  animate={{ color: isCrowdfundingActive ? '#a14dfd' : '#ffffff' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {CROWDFUNDING.title}
                </motion.h3>
                <p className="text-white/50 text-base">{CROWDFUNDING.tagline}</p>
              </div>

              {/* Col 2-3: Content */}
              <div className="lg:col-span-2">
                <p className="text-white/65 leading-relaxed text-base mb-10">{CROWDFUNDING.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                  {CROWDFUNDING.tiers.map((tier) => (
                    <div
                      key={tier.discount}
                      className="border border-green-900/50 bg-green-950/20 rounded px-4 py-4 text-center"
                    >
                      <p className="text-3xl font-display font-bold text-green-400">{tier.discount}% off</p>
                      <p className="text-sm text-green-700 mt-1 leading-snug">{tier.label}</p>
                    </div>
                  ))}
                </div>

                {projects.crowdfunding.length > 0 && (
                  <ProjectReel projects={projects.crowdfunding} fadeColor="#000000" />
                )}

                {/* Certification badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <Image src="/images/crowdfunding/kickstarter.png" alt="Kickstarter Certified Expert" width={280} height={96} className="w-full h-auto" />
                  <Image src="/images/crowdfunding/indiegogo.png" alt="Indiegogo Certified Expert" width={280} height={96} className="w-full h-auto" />
                  <Image src="/images/crowdfunding/launchboom.png" alt="LaunchBoom Certified Expert" width={280} height={96} className="w-full h-auto" />
                </div>
              </div>
            </div>

            {/* Fundraising */}
            <div ref={fundraisingRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 border-t border-white/10 pt-6 lg:pt-10">
              {/* Col 1: Title + tagline */}
              <div>
                <motion.h3
                  className="font-display font-bold mb-3"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
                  animate={{ color: isFundraisingActive ? '#a14dfd' : '#ffffff' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {FUNDRAISING.title}
                </motion.h3>
                <p className="text-white/50 text-base">{FUNDRAISING.tagline}</p>
              </div>

              {/* Col 2-3: Content */}
              <div className="lg:col-span-2">
                <p className="text-white/65 leading-relaxed text-base mb-10">{FUNDRAISING.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-12">
                  {FUNDRAISING.included.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-white/30 mt-2.5 flex-none" />
                      <span className="text-base text-white/60">
                        {item.split(/(~~.*?~~|==.*?==|\*\*.*?\*\*)/).map((part, i) => {
                          if (part.startsWith('~~') && part.endsWith('~~'))
                            return <span key={i}>{part.slice(2, -2)}</span>;
                          if (part.startsWith('==') && part.endsWith('=='))
                            return <span key={i} className="text-white">{part.slice(2, -2)}</span>;
                          if (part.startsWith('**') && part.endsWith('**'))
                            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                          return part;
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-10 mb-12">
                  <div>
                    <p className="text-xs tracking-wider uppercase text-white/30 mb-1">Starting at</p>
                    <p className="text-2xl font-display font-bold text-white">{FUNDRAISING.startingAt}</p>
                  </div>
                  <div className="border border-green-900/50 bg-green-950/20 rounded px-4 py-2">
                    <p className="text-xs tracking-wider uppercase text-green-700 mb-1">Minimum down</p>
                    <p className="text-2xl font-display font-bold text-green-400">{FUNDRAISING.minimumDown}</p>
                  </div>
                </div>

                {projects.fundraising.length > 0 && (
                  <ProjectReel projects={projects.fundraising} fadeColor="#000000" direction="right" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
