'use client';

import { getCalApi } from '@calcom/embed-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Calendar } from 'lucide-react';

interface CalBookingButtonProps {
  className?: string;
  buttonText?: string;
  namespace?: string;
  calLink?: string;
  isPrimary?: boolean;
  config?: {
    layout?: 'month_view' | 'week_view' | 'column_view';
    theme?: 'light' | 'dark';
    hideEventTypeDetails?: boolean;
    useSlotsViewOnSmallScreen?: boolean;
  };
}

export function CalBookingButton({
  className = '',
  buttonText = 'Schedule a Call',
  namespace = 'introduction',
  calLink = 'fnawtf/introduction',
  isPrimary = false,
  config = {
    layout: 'month_view',
    theme: 'dark',
    hideEventTypeDetails: true,
    useSlotsViewOnSmallScreen: true,
  },
}: CalBookingButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace });
      cal('ui', {
        cssVarsPerTheme: {
          light: { 'cal-brand': '#9752f4' },
          dark: { 'cal-brand': '#9752f4' },
        },
        theme: config.theme,
        hideEventTypeDetails: config.hideEventTypeDetails,
        layout: config.layout,
      });
    })();
  }, [namespace, config]);

  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;

    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    const handleMouseEnter = (e: MouseEvent) => {
      if (!fill) return;

      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const direction = x < rect.width / 2 ? 'left' : 'right';

      gsap.killTweensOf([fill, textSpan]);

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

      if (textSpan) {
        gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

      if (textSpan) {
        const targetColor = isPrimary ? '#a14dfd' : '#a14dfd';
        gsap.to(textSpan, { color: targetColor, duration: 0.3, ease: 'power2.out' });
      }
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPrimary]);

  return (
    <button
      ref={buttonRef}
      data-cal-namespace={namespace}
      data-cal-link={calLink}
      data-cal-config={JSON.stringify({
        layout: config.layout,
        useSlotsViewOnSmallScreen: config.useSlotsViewOnSmallScreen,
        theme: config.theme,
      })}
      className={`relative inline-block px-6 py-2 font-medium text-purple-400 bg-black border border-purple-400 rounded-lg overflow-hidden ${className}`}
    >
      <div
        ref={fillRef}
        className="absolute inset-0 bg-purple-500 pointer-events-none"
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span className="relative flex items-center gap-2" style={{ zIndex: 10 }}>
        <Calendar size={18} />
        {buttonText}
      </span>
    </button>
  );
}
