'use client';

import { getCalApi } from '@calcom/embed-react';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDirectionalFill } from '@/hooks/useDirectionalFill';

interface CalBookingButtonProps {
  className?: string;
  buttonText?: string;
  namespace?: string;
  calLink?: string;
  isPrimary?: boolean;
  variant?: 'default' | 'white' | 'inverted';
  size?: 'default' | 'lg';
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
  isPrimary: _isPrimary = false,
  variant = 'default',
  size = 'default',
  config = {
    layout: 'month_view',
    theme: 'dark',
    hideEventTypeDetails: true,
    useSlotsViewOnSmallScreen: true,
  },
}: CalBookingButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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

  const restColor = variant === 'inverted' ? '#000000' : variant === 'white' ? '#ffffff' : '#a14dfd';
  const hoverTextColor = variant === 'inverted' ? '#ffffff' : '#000000';

  // Use the reusable directional fill hook
  useDirectionalFill(buttonRef, fillRef, {
    onFillStart: () => {
      const button = buttonRef.current;
      if (!button) return;
      const textSpan = button.querySelector('span') as HTMLElement;
      gsap.killTweensOf([textSpan]);
      setIsHovered(true);
      if (textSpan) gsap.to(textSpan, { color: hoverTextColor, duration: 0.3, ease: 'power2.out' });
    },
    onFillEnd: () => {
      const button = buttonRef.current;
      if (!button) return;
      const textSpan = button.querySelector('span') as HTMLElement;
      setIsHovered(false);
      if (textSpan) gsap.to(textSpan, { color: restColor, duration: 0.3, ease: 'power2.out' });
    }
  });

  const padding = size === 'lg' ? 'px-4 py-3 text-base' : 'px-4 py-2';

  const baseClasses = variant === 'inverted'
    ? `relative inline-block ${padding} font-medium text-black bg-white border border-white/20 rounded-lg overflow-hidden`
    : variant === 'white'
      ? `relative inline-block ${padding} font-medium text-white bg-black border border-white/40 rounded-lg overflow-hidden`
      : `relative inline-block ${padding} font-medium text-purple-400 bg-black border border-purple-400 rounded-lg overflow-hidden`;

  const fillClasses = variant === 'inverted'
    ? 'absolute inset-0 bg-black pointer-events-none'
    : variant === 'white'
      ? 'absolute inset-0 bg-white pointer-events-none'
      : 'absolute inset-0 bg-purple-500 pointer-events-none';

  const iconVariants = {
    hidden: { opacity: 0, x: -8, width: 0, marginRight: -8 },
    visible: { opacity: 1, x: 0, width: 'auto', marginRight: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const showRevealIcon = variant === 'inverted' || variant === 'white';

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
      className={`${baseClasses} ${className}`}
    >
      <div
        ref={fillRef}
        className={fillClasses}
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span className="relative flex items-center gap-2" style={{ zIndex: 10 }}>
        {showRevealIcon ? (
          <motion.span
            variants={iconVariants}
            initial="hidden"
            animate={isHovered ? 'visible' : 'hidden'}
            className="flex items-center"
          >
            <Calendar size={18} strokeWidth={2} />
          </motion.span>
        ) : (
          <Calendar size={18} />
        )}
        {buttonText}
      </span>
    </button>
  );
}
