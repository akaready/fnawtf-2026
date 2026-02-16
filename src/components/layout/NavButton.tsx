'use client';

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { Home, Play, ClipboardList, DollarSign, Info } from 'lucide-react';

interface NavButtonProps {
  href: string;
  children: React.ReactNode;
  isPrimary?: boolean;
  onClick?: () => void;
  iconName?: 'home' | 'play' | 'clipboard-list' | 'dollar-sign' | 'info';
}

const iconVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    width: 0,
  },
  visible: {
    opacity: 1,
    x: 0,
    width: 'auto',
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
};

export function NavButton({ href, children, isPrimary = false, onClick, iconName }: NavButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const Icon = iconName ? iconComponentMap[iconName] : null;

  useEffect(() => {
    if (!buttonRef.current || !fillRef.current) return;

    const button = buttonRef.current;
    const fill = fillRef.current;
    const textSpan = button.querySelector('span');

    const handleMouseEnter = (e: MouseEvent) => {
      setIsHovered(true);

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

      // Animate text color to black on hover
      if (textSpan) {
        gsap.to(textSpan, { color: '#000000', duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);

      gsap.to(fill, { scaleX: 0, duration: 0.3, ease: 'power2.out' });

      // Animate text color back to initial state
      if (textSpan) {
        const targetColor = isPrimary ? '#a14dfd' : '#ffffff';
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

  if (isPrimary) {
    return (
      <motion.a
        ref={buttonRef}
        href={href}
        onClick={onClick}
        layout
        transition={{ layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
        className="relative inline-block px-6 py-2 font-medium text-purple-400 bg-black border border-gray-600 rounded-lg overflow-hidden"
        data-btn-hover
      >
        <div
          ref={fillRef}
          className="absolute inset-0 bg-white pointer-events-none"
          style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
        />
        <span className="relative flex items-center gap-2" style={{ zIndex: 10 }}>
          {Icon && (
            <motion.span
              variants={iconVariants}
              initial="hidden"
              animate={isHovered ? "visible" : "hidden"}
              className="flex items-center"
            >
              {React.createElement(Icon, { size: 18, strokeWidth: 2 })}
            </motion.span>
          )}
          {children}
        </span>
      </motion.a>
    );
  }

  return (
    <motion.a
      ref={buttonRef}
      href={href}
      onClick={onClick}
      layout
      transition={{ layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      className="relative inline-block px-4 py-2 font-medium text-white bg-black border border-gray-600 rounded-lg overflow-hidden"
      data-btn-hover
    >
      <div
        ref={fillRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ zIndex: 0, transform: 'scaleX(0)', transformOrigin: '0 50%' }}
      />
      <span className="relative flex items-center gap-2" style={{ zIndex: 10 }}>
        {Icon && (
          <motion.span
            variants={iconVariants}
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            className="flex items-center"
          >
            {React.createElement(Icon, { size: 18, strokeWidth: 2 })}
          </motion.span>
        )}
        {children}
      </span>
    </motion.a>
  );
}
