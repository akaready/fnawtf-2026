import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, CustomEase);

// Set default ease
gsap.defaults({ ease: 'power2.out', duration: 0.6 });

// Handle prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0);
  gsap.globalTimeline.timeScale(1);

  // Override all durations to 0.01
  gsap.defaults({ duration: 0.01 });
}

// Export configured GSAP instance
export default gsap;

/**
 * Check if user prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create a safe animation that respects user preferences
 */
export function safeAnimate(
  target: gsap.TweenTarget,
  vars: gsap.TweenVars
): gsap.core.Tween {
  if (shouldReduceMotion()) {
    return gsap.to(target, { ...vars, duration: 0.01 });
  }
  return gsap.to(target, vars);
}

/**
 * Create a timeline that respects user preferences
 */
export function createTimeline(vars?: gsap.TimelineVars): gsap.core.Timeline {
  const timeline = gsap.timeline(vars);
  if (shouldReduceMotion()) {
    timeline.globalTimeline.timeScale(0.001);
  }
  return timeline;
}
