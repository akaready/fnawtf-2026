'use client';

import { Hammer, Rocket, TrendingUp, LucideIcon } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { RevealGroup, RevealItem } from '@/components/animations/Reveal';

interface ServiceCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface ServicesCardsProps {
  cards?: ServiceCard[];
}

const defaultCards: ServiceCard[] = [
  {
    title: 'Build',
    description: 'Foundation services to establish your brand identity and visual language.',
    href: '/services#build',
    icon: Hammer,
  },
  {
    title: 'Launch',
    description: 'Launch services to bring your product or campaign to market with impact.',
    href: '/services#launch',
    icon: Rocket,
  },
  {
    title: 'Scale',
    description: 'Growth services to expand your reach and amplify your message.',
    href: '/services#scale',
    icon: TrendingUp,
  },
];

function ServiceCardItem({ card }: { card: ServiceCard }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  const Icon = card.icon;

  useEffect(() => {
    if (!cardRef.current || !fillRef.current) return;

    const cardElement = cardRef.current;
    const fill = fillRef.current;
    const iconEl = cardElement.querySelector('[data-icon]') as HTMLElement;
    const titleEl = cardElement.querySelector('[data-title]') as HTMLElement;
    const descEl = cardElement.querySelector('[data-desc]') as HTMLElement;
    const ctaEl = cardElement.querySelector('[data-cta]') as HTMLElement;

    const handleMouseEnter = (e: MouseEvent) => {
      if (!fill) return;

      const rect = cardElement.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const direction = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf([fill, iconEl, titleEl, descEl, ctaEl]);

      if (direction === 'left') {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '0 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        );
      } else {
        gsap.fromTo(
          fill,
          { scaleX: 0, transformOrigin: '100% 50%' },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' }
        );
      }

      // Animate text colors
      if (iconEl) {
        gsap.to(iconEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
      if (titleEl) {
        gsap.to(titleEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
      if (descEl) {
        gsap.to(descEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
      if (ctaEl) {
        gsap.to(ctaEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

      // Revert text colors
      if (iconEl) {
        gsap.to(iconEl, { color: '#c4a8ff', duration: 0.3, ease: 'power2.out' });
      }
      if (titleEl) {
        gsap.to(titleEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      }
      if (descEl) {
        gsap.to(descEl, { color: '#a3a3a3', duration: 0.3, ease: 'power2.out' });
      }
      if (ctaEl) {
        gsap.to(ctaEl, { color: '#a14dfd', duration: 0.3, ease: 'power2.out' });
      }
    };

    cardElement.addEventListener('mouseenter', handleMouseEnter);
    cardElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cardElement.removeEventListener('mouseenter', handleMouseEnter);
      cardElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <RevealItem>
      <a
        ref={cardRef}
        href={card.href}
        className="relative p-8 border border-border rounded-lg hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer overflow-hidden"
      >
        <div
          ref={fillRef}
          className="absolute inset-0 bg-purple-950 pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />
        <div className="relative" style={{ zIndex: 10 }}>
          <Icon
            className="w-12 h-12 mb-6 text-purple-300"
            strokeWidth={1.5}
            data-icon
          />
          <h3
            className="font-display text-2xl font-bold text-white mb-4"
            data-title
          >
            {card.title}
          </h3>
          <p
            className="font-body text-muted-foreground leading-relaxed mb-6"
            data-desc
          >
            {card.description}
          </p>
          <div className="text-accent text-sm font-semibold" data-cta>
            Explore {card.title} →
          </div>
        </div>
      </a>
    </RevealItem>
  );
}

/**
 * ServicesCards - Three service tier cards with scroll reveal
 */
export function ServicesCards({ cards = defaultCards }: ServicesCardsProps) {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How We Work
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our three-phase approach ensures your vision comes to life with clarity, impact, and sustainable growth.
          </p>
        </div>

        <RevealGroup
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          stagger={150}
          distance="2em"
        >
          {cards.map((card) => (
            <ServiceCardItem key={card.title} card={card} />
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
