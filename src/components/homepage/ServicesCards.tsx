'use client';

import { Hammer, Rocket, TrendingUp, LucideIcon } from 'lucide-react';
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

/**
 * ServicesCards - Three service tier cards with scroll reveal
 */
export function ServicesCards({ cards = defaultCards }: ServicesCardsProps) {
  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-50%) rotate(45deg);
          }
          5% {
            transform: translateX(30%) rotate(45deg);
          }
          100% {
            transform: translateX(350%) rotate(45deg);
          }
        }

        .service-card {
          position: relative;
          overflow: hidden;
        }

        .service-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 60%;
          height: 200%;
          background: linear-gradient(
            90deg,
            rgba(59, 7, 100, 0),
            rgba(88, 28, 135, 0.3),
            rgba(107, 33, 168, 0.4),
            rgba(88, 28, 135, 0.3),
            rgba(59, 7, 100, 0)
          );
          opacity: 0;
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.05s ease-out;
        }

        .service-card:hover::after {
          opacity: 1;
          animation: shimmer 4s linear;
        }
      `}</style>

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
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <RevealItem key={card.title}>
                  <a
                    href={card.href}
                    className="service-card group p-8 border border-border rounded-lg hover:bg-purple-950 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 ease-out cursor-pointer"
                  >
                    <Icon className="w-12 h-12 mb-6 text-foreground group-hover:text-purple-300 transition-colors duration-300 ease-out" strokeWidth={1.5} />
                    <h3 className="font-display text-2xl font-bold text-foreground mb-4 group-hover:text-white transition-colors duration-300 ease-out">
                      {card.title}
                    </h3>
                    <p className="font-body text-muted-foreground group-hover:text-purple-200 leading-relaxed mb-6 transition-colors duration-300 ease-out">
                      {card.description}
                    </p>
                    <div className="text-accent group-hover:text-purple-300 text-sm font-semibold transition-colors duration-300 ease-out">
                      Explore {card.title} →
                    </div>
                  </a>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
