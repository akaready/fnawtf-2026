'use client';

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { Home, Play, ClipboardList, DollarSign, Info, ExternalLink } from 'lucide-react';

interface NavButtonProps {
  href: string;
  children: React.ReactNode;
  isPrimary?: boolean;
  inverted?: boolean;
  size?: 'default' | 'lg';
  onClick?: () => void;
  iconName?: 'home' | 'play' | 'clipboard-list' | 'dollar-sign' | 'info' | 'external-link';
  isActive?: boolean;
}

const iconVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    width: 0,
    marginRight: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    width: 'auto',
    marginRight: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

const iconComponentMap: Record<string, React.ComponentType<any>> = {
  'home': Home,
  'play': Play,
  'clipboard-list': ClipboardList,
  'dollar-sign': DollarSign,
  'info': Info,
  'external-link': ExternalLink,
};

export function NavButton({ href, children, isPrimary = false, inverted = false, size = 'default', onClick, iconName, isActive = false }: NavButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(isActive);
  const prevIsActiveRef = useRef(isActive);

  const Icon = iconName ? iconComponentMap[iconName] : null;

  // Inverted: white bg + black text at rest → black fill + white text on hover
  const restColor = inverted ? '#000000' : isPrimary ? '#a14dfd' : '#ffffff';
  const hoverColor = inverted ? '#ffffff' : '#000000';

  // Animate exit when this button loses active state (page changed away)
  useEffect(() => {
    if (prevIsActiveRef.current && !isActive) {
      const fill = fillRef.current;
      const textSpan = buttonRef.current?.querySelector('span');
      gsap.to(fill, { scaleX: 0, duration: 0.35, ease: 'power2.inOut' });
      if (textSpan) gsap.to(textSpan, { color: restColor, duration: 0.35, ease: 'power2.inOut' });
      setIsHovered(false);
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, restColor]);

  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;

    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    // Initialise to active (hovered) state immediately when this is the current page
    if (isActive) {
      gsap.set(fill, { scaleX: 1 });
      if (textSpan) gsap.set(textSpan, { color: hoverColor });
    }

    const handleMouseEnter = (e: MouseEvent) => {
      if (isActive) return; // active item ignores hover entirely
      setIsHovered(true);
      if (!fill) return;

      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const origin = x < rect.width / 2 ? '0 50%' : '100% 50%';

      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: origin }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: hoverColor, duration: 0.3, ease: 'power2.out' });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (isActive) return; // stay in active state
      setIsHovered(false);
      if (!fill) return;

      const rect = button.getBoundingClientRect();
      const x = (e.clientX || e.pageX) - rect.left;
      const origin = x < rect.width / 2 ? '0 50%' : '100% 50%';

      gsap.to(fill, { scaleX: 0, transformOrigin: origin, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: restColor, duration: 0.3, ease: 'power2.out' });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPrimary, inverted, restColor, hoverColor, isActive]);

  const padding = size === 'lg' ? 'px-4 py-3 text-base' : inverted || !isPrimary ? 'px-4 py-2' : 'px-6 py-2';

  const baseClass = inverted
    ? `relative inline-block ${padding} font-medium text-black bg-white border border-white/20 rounded-lg overflow-hidden`
    : isPrimary
      ? `relative inline-block ${padding} font-medium text-purple-400 bg-black border border-gray-600 rounded-lg overflow-hidden`
      : `relative inline-block ${padding} font-medium text-white bg-black border border-gray-600 rounded-lg overflow-hidden`;

  const fillClass = inverted
    ? 'absolute inset-0 bg-black pointer-events-none'
    : 'absolute inset-0 bg-white pointer-events-none';

  return (
    <a
      ref={buttonRef}
      href={href}
      onClick={onClick}
      className={baseClass}
      data-btn-hover
    >
      <div
        ref={fillRef}
        className={fillClass}
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span className="relative flex items-center gap-2" style={{ zIndex: 10, color: restColor }}>
        {Icon && (
          <motion.span
            variants={iconVariants}
            initial="hidden"
            animate={isHovered || isActive ? 'visible' : 'hidden'}
            className="flex items-center"
          >
            {React.createElement(Icon, { size: 18, strokeWidth: 2 })}
          </motion.span>
        )}
        {children}
      </span>
    </a>
  );
}
