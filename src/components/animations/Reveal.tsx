'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

/**
 * Check if user prefers reduced motion
 */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * RevealGroupProps - Configuration for RevealGroup container
 */
interface RevealGroupProps {
  children: ReactNode;
  stagger?: number;
  distance?: string;
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * RevealItemProps - Configuration for individual reveal items
 */
interface RevealItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

/**
 * RevealProps - Configuration for simple single-element reveals
 */
interface RevealProps {
  children: ReactNode;
  distance?: string;
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
}

/**
 * RevealGroup - Container component that reveals children with stagger effect
 * Uses Framer Motion for SSR-safe scroll reveal animations
 */
export function RevealGroup({
  children,
  stagger = 100,
  distance = '6em',
  duration = 0.8,
  delay = 0,
  threshold = 0.2,
  once = true,
  className,
  style,
}: RevealGroupProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Track if component is mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use Framer Motion's useInView for viewport detection
  const isInView = useInView(ref, {
    once,
    amount: threshold,
    margin: '0px',
  });

  // Only show animations if mounted (SSR safety)
  useEffect(() => {
    if (isMounted) {
      setIsVisible(isInView);
    }
  }, [isInView, isMounted]);

  // Define animation variants
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : stagger / 1000,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : duration,
        ease: [0.22, 1, 0.36, 1], // power2.out equivalent
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={isMounted ? 'hidden' : 'visible'}
      animate={isVisible ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {/* Clone children and wrap each in motion.div for proper animation */}
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="contents"
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * RevealItem - Wrapper component for individual items within RevealGroup
 * Automatically gets animation variants from parent RevealGroup
 * Uses "contents" to avoid breaking CSS Grid/Flexbox layouts
 */
export function RevealItem({
  children,
  className,
  index,
}: RevealItemProps) {
  return (
    <motion.div className={`contents ${className || ''}`} variants={{}} custom={index}>
      {children}
    </motion.div>
  );
}

/**
 * Reveal - Simple single-element reveal component
 * Use when you only need to animate one element on scroll
 */
export function Reveal({
  children,
  distance = '6em',
  duration = 0.8,
  delay = 0,
  threshold = 0.2,
  once = true,
  className,
}: RevealProps) {
  const [isMounted, setIsMounted] = useState(false);
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Track if component is mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use Framer Motion's useInView for viewport detection
  const isInView = useInView(ref, {
    once,
    amount: threshold,
    margin: '0px',
  });

  // Define animation variants
  const variants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : duration,
        delay: delay,
        ease: [0.22, 1, 0.36, 1], // power2.out equivalent
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={isMounted ? 'hidden' : 'visible'}
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
