'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Logo = { id: string; name: string; logoUrl: string };

interface ClientLogosProps {
  clients: Logo[];
  shuffle?: boolean;
}

/**
 * ClientLogosCycle - Animated logo wall with cycling effect
 * Shows 12 logos at a time, randomly cycling through full pool
 * Pauses when out of viewport or browser tab is hidden
 * Respects user motion preferences
 */
export function ClientLogosCycle({ clients, shuffle = false }: ClientLogosProps) {
  const VISIBLE_COUNT = 12;
  const SWAP_INTERVAL = 2400;
  const ANIMATION_DURATION = 0.9;
  const HOVER_ANIMATION_DURATION = 0.6;
  const PER_SLOT_COOLDOWN = 1800;

  // Visible logos + pool
  const [state, setState] = useState(() => {
    const visible = clients.slice(0, VISIBLE_COUNT);
    const pool = shuffle ? shuffleArray(clients.slice(VISIBLE_COUNT)) : clients.slice(VISIBLE_COUNT);
    return { visible, pool };
  });

  // Outgoing logos per slot (for exit animation)
  const [outgoing, setOutgoing] = useState<Record<number, Logo>>({});

  // Track which slots were hover-triggered (for faster animation)
  const [hoverTriggered, setHoverTriggered] = useState<Record<number, boolean>>({});

  // Refs
  const patternRef = useRef(generatePattern(VISIBLE_COUNT));
  const patternIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slotCooldownsRef = useRef<Map<number, number>>(new Map());

  // Hooks
  const { ref: containerRef, isVisible } = useIntersectionObserver({ once: false });
  const prefersReducedMotion = useReducedMotion();
  const [isTabHidden, setIsTabHidden] = useState(false);

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

  // Tab visibility
  useEffect(() => {
    const handler = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Check if a specific slot is ready to swap
  const isSlotReady = useCallback((slotIndex: number) => {
    const now = Date.now();
    const lastSwap = slotCooldownsRef.current.get(slotIndex) || 0;
    return now - lastSwap >= PER_SLOT_COOLDOWN;
  }, [PER_SLOT_COOLDOWN]);

  // Swap a slot - sets outgoing + updates visible
  const swapSlot = useCallback((slotIndex: number, fromHover = false) => {
    // Per-slot cooldown: skip if this slot is still cooling down or mid-animation
    if (!isSlotReady(slotIndex)) return;

    slotCooldownsRef.current.set(slotIndex, Date.now());

    if (fromHover) {
      setHoverTriggered((prev) => ({ ...prev, [slotIndex]: true }));
    }

    setState((current) => {
      if (current.pool.length === 0) return current;

      const [nextLogo, ...remainingPool] = current.pool;
      const replacedLogo = current.visible[slotIndex];

      setOutgoing((prev) => ({ ...prev, [slotIndex]: replacedLogo }));

      const updatedVisible = [...current.visible];
      updatedVisible[slotIndex] = nextLogo;

      return {
        visible: updatedVisible,
        pool: [...remainingPool, replacedLogo],
      };
    });
  }, [isSlotReady]);

  // Clear outgoing after animation completes
  const clearOutgoing = useCallback((slotIndex: number) => {
    setOutgoing((prev) => {
      const next = { ...prev };
      delete next[slotIndex];
      return next;
    });
    setHoverTriggered((prev) => {
      const next = { ...prev };
      delete next[slotIndex];
      return next;
    });
  }, []);

  // Auto-cycle
  useEffect(() => {
    if (prefersReducedMotion || !isVisible || isTabHidden) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const pattern = patternRef.current;
      const slotIndex = pattern[patternIndexRef.current % VISIBLE_COUNT];
      patternIndexRef.current++;

      if (patternIndexRef.current % VISIBLE_COUNT === 0) {
        patternRef.current = generatePattern(VISIBLE_COUNT);
        patternIndexRef.current = 0;
      }

      swapSlot(slotIndex);
    }, SWAP_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [prefersReducedMotion, isVisible, isTabHidden, swapSlot]);

  const ease = [0.87, 0, 0.13, 1] as const;

  const autoTransition = { duration: ANIMATION_DURATION, ease };
  const hoverTransition = { duration: HOVER_ANIMATION_DURATION, ease };

  // Reduced motion fallback
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
        {state.visible.map((client, index) => {
          const isHover = hoverTriggered[index];
          const transition = isHover ? hoverTransition : autoTransition;

          return (
            <motion.div
              key={`slot-${index}`}
              className="relative h-24 md:h-32 bg-muted/50 rounded-lg overflow-hidden cursor-pointer"
              onMouseEnter={() => swapSlot(index, true)}
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Outgoing logo - slides down and out */}
              {outgoing[index] && (
                <motion.div
                  key={`out-${outgoing[index].id}`}
                  className="absolute inset-0 flex items-center justify-center p-8"
                  initial={{ y: '0%' }}
                  animate={{ y: '100%' }}
                  transition={transition}
                  onAnimationComplete={() => clearOutgoing(index)}
                >
                  <img
                    src={outgoing[index].logoUrl}
                    alt={outgoing[index].name}
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              )}

              {/* Current logo - slides in from top (or static on first mount) */}
              <motion.div
                key={`in-${client.id}`}
                className="absolute inset-0 flex items-center justify-center p-8"
                initial={outgoing[index] ? { y: '-100%' } : false}
                animate={{ y: '0%' }}
                transition={transition}
              >
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
