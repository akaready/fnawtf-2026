'use client';

import { useRef, useCallback } from 'react';
import gsap from 'gsap';
import {
  Hammer, Rocket, TrendingUp, Lightbulb, Video, Sparkles,
  Zap, Users, BarChart, Coins, Megaphone, Check, LucideIcon,
} from 'lucide-react';
import { RevealItem } from '@/components/animations/Reveal';
import { PricingTier, IconName } from '@/types/pricing';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { AnimatedPrice } from './AnimatedPrice';

const iconMap: Record<IconName, LucideIcon> = {
  'hammer': Hammer,
  'rocket': Rocket,
  'trending-up': TrendingUp,
  'lightbulb': Lightbulb,
  'video': Video,
  'sparkles': Sparkles,
  'zap': Zap,
  'users': Users,
  'bar-chart': BarChart,
  'coins': Coins,
  'megaphone': Megaphone,
};

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  // Track when card is visible to trigger animation
  const { ref: visibilityRef, isVisible } = useIntersectionObserver({
    threshold: 0.3,
    once: true,
  });

  // Combine refs - need cardRef for hover effects and visibilityRef for visibility
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      // Update cardRef (mutable ref for hover effects)
      cardRef.current = node;
      // Update visibilityRef (read-only ref from useIntersectionObserver)
      (visibilityRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [visibilityRef]
  );

  const Icon = iconMap[tier.icon];

  // Use reusable directional fill hook
  useDirectionalFill(cardRef, fillRef, {
    onFillStart: () => {
      const cardElement = cardRef.current;
      if (!cardElement) return;

      const contentEl = cardElement.querySelector('[data-content]') as HTMLElement;
      const iconEl = cardElement.querySelector('[data-icon]') as HTMLElement;
      const titleEl = cardElement.querySelector('[data-title]') as HTMLElement;
      const priceEl = cardElement.querySelector('[data-price]') as HTMLElement;
      const taglineEl = cardElement.querySelector('[data-tagline]') as HTMLElement;

      // Scale card (border + background grows), counter-scale content so text stays still
      gsap.to(cardElement, { scaleY: 1.05, duration: 0.3, ease: 'power2.out' });
      if (contentEl) gsap.to(contentEl, { scaleY: 1 / 1.05, duration: 0.3, ease: 'power2.out' });

      // Animate text colors and icon
      if (iconEl) gsap.to(iconEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out', scale: 1.15 });
      if (titleEl) gsap.to(titleEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      if (priceEl) gsap.to(priceEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      if (taglineEl) gsap.to(taglineEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      const cardElement = cardRef.current;
      if (!cardElement) return;

      const contentEl = cardElement.querySelector('[data-content]') as HTMLElement;
      const iconEl = cardElement.querySelector('[data-icon]') as HTMLElement;
      const titleEl = cardElement.querySelector('[data-title]') as HTMLElement;
      const priceEl = cardElement.querySelector('[data-price]') as HTMLElement;
      const taglineEl = cardElement.querySelector('[data-tagline]') as HTMLElement;

      // Revert card + content scale
      gsap.to(cardElement, { scaleY: 1, duration: 0.3, ease: 'power2.out' });
      if (contentEl) gsap.to(contentEl, { scaleY: 1, duration: 0.3, ease: 'power2.out' });

      // Revert text colors and icon
      if (iconEl) gsap.to(iconEl, { color: '#c4a8ff', duration: 0.3, ease: 'power2.out', scale: 1 });
      if (titleEl) gsap.to(titleEl, { color: '#ffffff', duration: 0.3, ease: 'power2.out' });
      if (priceEl) gsap.to(priceEl, { color: '#a14dfd', duration: 0.3, ease: 'power2.out' });
      if (taglineEl) gsap.to(taglineEl, { color: '#a1a1aa', duration: 0.3, ease: 'power2.out' });
    }
  });

  return (
    <RevealItem>
      <div
        ref={setRefs}
        className="relative p-8 border border-border rounded-lg cursor-pointer overflow-hidden hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] bg-background"
        onClick={() => {
          if (tier.id === 'scale') {
            window.location.href = 'mailto:hello@fna.wtf';
          } else {
            // Set the tab parameter and scroll to calculator
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tier.id);
            window.history.pushState({}, '', url);

            // Dispatch custom event to notify calculator
            window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: tier.id } }));

            document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        <div
          ref={fillRef}
          className="absolute inset-0 bg-purple-950 pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />

        <div className="relative" style={{ zIndex: 10 }} data-content>
          <Icon
            className="w-12 h-12 mb-4 text-purple-300"
            strokeWidth={1.5}
            data-icon
          />

          <h3 className="font-display text-2xl font-bold text-white mb-2" data-title>
            {tier.name}
          </h3>

          <AnimatedPrice
            priceNumber={tier.priceNumber}
            priceString={tier.price}
            trigger={isVisible}
            className="text-4xl md:text-5xl font-bold text-accent mb-4"
          />

          <p className="font-body text-muted-foreground leading-relaxed mb-6" data-tagline>
            {tier.tagline}
          </p>

          <div className="h-px bg-border mb-6" />

          <ul className="space-y-3">
            {tier.summary.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </RevealItem>
  );
}
