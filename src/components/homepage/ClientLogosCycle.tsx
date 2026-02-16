'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ClientLogosProps {
  clients: Array<{
    id: string;
    name: string;
    logoUrl: string;
  }>;
  shuffle?: boolean;
}

/**
 * ClientLogosCycle - Animated logo wall with cycling effect
 * Shows 8 logos at a time, randomly cycling through full pool
 * Pauses when out of viewport or browser tab is hidden
 * Respects user motion preferences
 */
export function ClientLogosCycle({ clients, shuffle = false }: ClientLogosProps) {
  const VISIBLE_COUNT = 12; // 4 columns × 3 rows
  const SWAP_INTERVAL = 2400; // 1500ms delay + 900ms animation
  const ANIMATION_DURATION = 0.9;

  // State - combine visible and pool for easier management
  const [state, setState] = useState(() => {
    const visible = clients.slice(0, VISIBLE_COUNT);
    const pool = shuffle ? shuffleArray(clients.slice(VISIBLE_COUNT)) : clients.slice(VISIBLE_COUNT);
    return { visible, pool };
  });

  // Refs
  const patternRef = useRef(generatePattern(VISIBLE_COUNT));
  const patternIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { ref: containerRef, isVisible } = useIntersectionObserver({ once: false });
  const prefersReducedMotion = useReducedMotion();
  const [isTabHidden, setIsTabHidden] = useState(false);

  // Helper functions
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generatePattern(count: number): number[] {
    return shuffleArray(Array.from({ length: count }, (_, i) => i));
  }

  // Tab visibility listener
  useEffect(() => {
    const handler = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Main cycling effect
  useEffect(() => {
    // Don't cycle if: reduced motion, out of viewport, or tab is hidden
    if (prefersReducedMotion || !isVisible || isTabHidden) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start cycling
    intervalRef.current = setInterval(() => {
      setState((current) => {
        if (current.pool.length === 0) return current;

        // Get next slot index from pattern
        const pattern = patternRef.current;
        const slotIndex = pattern[patternIndexRef.current % VISIBLE_COUNT];
        patternIndexRef.current++;

        // Reshuffle pattern when exhausted
        if (patternIndexRef.current % VISIBLE_COUNT === 0) {
          patternRef.current = generatePattern(VISIBLE_COUNT);
          patternIndexRef.current = 0;
        }

        // Get next logo from pool
        const [nextLogo, ...remainingPool] = current.pool;
        const replacedLogo = current.visible[slotIndex];

        // Update visible logos and pool
        const updatedVisible = [...current.visible];
        updatedVisible[slotIndex] = nextLogo;

        return {
          visible: updatedVisible,
          pool: [...remainingPool, replacedLogo],
        };
      });
    }, SWAP_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [prefersReducedMotion, isVisible, isTabHidden]);

  // Animation variants - slot machine effect (both slide down)
  const logoVariants = {
    initial: { y: '-100%' },  // Start above (entering from top)
    animate: { y: '0%' },     // Center position
    exit: { y: '100%' },      // Exit below (sliding down)
  };

  const transition = {
    duration: ANIMATION_DURATION,
    ease: [0.87, 0, 0.13, 1], // expo.inOut
  };

  // Fallback for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="relative" ref={containerRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {state.visible.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-center h-24 md:h-32 bg-muted/50 rounded-lg p-4"
            >
              <img
                src={client.logoUrl}
                alt={client.name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {state.visible.map((client, index) => (
          <div
            key={`slot-${index}`}
            className="relative h-24 md:h-32 bg-muted/50 rounded-lg overflow-hidden"
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={client.id}
                className="absolute inset-0 flex items-center justify-center p-8"
                variants={logoVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
