'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';

interface UseCountUpAnimationOptions {
  /**
   * Target value to count up to
   */
  targetValue: number;

  /**
   * Animation duration in seconds
   * @default 1.2
   */
  duration?: number;

  /**
   * GSAP easing function
   * @default 'power2.out'
   */
  ease?: string;

  /**
   * Whether to trigger the animation
   * @default false
   */
  trigger?: boolean;

  /**
   * Custom formatter for the value
   * @default (value) => '$' + Math.floor(value).toLocaleString('en-US')
   */
  formatValue?: (value: number) => string;
}

interface UseCountUpAnimationReturn {
  /**
   * Formatted display value
   */
  displayValue: string;

  /**
   * Whether the animation has completed
   */
  isComplete: boolean;
}

/**
 * Custom hook for animating number counting from 0 to a target value
 *
 * Uses GSAP to smoothly animate a number with proper formatting.
 * Respects user's reduced motion preferences.
 *
 * @param options - Configuration options
 * @returns Display value and completion state
 *
 * @example
 * ```tsx
 * const { displayValue, isComplete } = useCountUpAnimation({
 *   targetValue: 5000,
 *   trigger: isVisible,
 *   duration: 1.2
 * });
 *
 * return <div>{displayValue}</div>;
 * ```
 */
export function useCountUpAnimation(
  options: UseCountUpAnimationOptions
): UseCountUpAnimationReturn {
  const {
    targetValue,
    duration = 1.2,
    ease = 'power2.out',
    trigger = false,
    formatValue,
  } = options;

  const valueRef = useRef({ value: 0 });
  const prefersReducedMotion = useReducedMotion();
  const hasAnimatedRef = useRef(false);

  // Create stable formatter function
  const formatter = useCallback(
    (value: number) => {
      if (formatValue) return formatValue(value);
      return '$' + Math.floor(value).toLocaleString('en-US');
    },
    [formatValue]
  );

  const [displayValue, setDisplayValue] = useState(formatter(0));
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!trigger || hasAnimatedRef.current) return;

    hasAnimatedRef.current = true;

    // If user prefers reduced motion, skip to final value instantly
    if (prefersReducedMotion) {
      valueRef.current.value = targetValue;
      setDisplayValue(formatter(targetValue));
      setIsComplete(true);
      return;
    }

    // Animate using GSAP
    valueRef.current.value = 0;
    const tween = gsap.to(valueRef.current, {
      value: targetValue,
      duration,
      ease,
      onUpdate: () => {
        setDisplayValue(formatter(valueRef.current.value));
      },
      onComplete: () => {
        // Ensure we display the exact target value when complete
        setDisplayValue(formatter(targetValue));
        setIsComplete(true);
      },
    });

    return () => {
      tween.kill();
    };
  }, [trigger, targetValue, duration, ease, formatter, prefersReducedMotion]);

  return { displayValue, isComplete };
}
