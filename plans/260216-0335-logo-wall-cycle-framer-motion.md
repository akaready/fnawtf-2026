# Logo Wall Cycling Animation - React + Framer Motion Implementation

**Date**: 2026-02-16 03:35 PST  
**Task**: Implement cycling logo wall animation using React and Framer Motion  
**Reference**: [`resources/logo-wall-cycle.md`](../resources/logo-wall-cycle.md)  
**Current State**: Static grid in [`ClientLogosCycle.tsx`](../src/components/homepage/ClientLogosCycle.tsx)

---

## Overview

Convert the GSAP-based logo cycling animation into a React component using Framer Motion. The animation will display 8 logos in a 2x4 grid, randomly cycling through a larger pool of client logos with smooth fade/slide transitions.

---

## Animation Mechanics Analysis

### Original GSAP Implementation

**Key Behaviors**:
1. **Visible Slots**: Shows first 8 items (2 rows × 4 columns)
2. **Logo Pool**: All client logos beyond the visible 8
3. **Cycling Pattern**: 
   - Generates random shuffle pattern `[0,1,2,3,4,5,6,7]`
   - Each cycle picks next slot from shuffled pattern
   - Swaps out current logo, swaps in logo from pool
4. **Animation**:
   - Outgoing: slides up (`yPercent: -50`) and fades out (`autoAlpha: 0`)
   - Incoming: starts below (`yPercent: 50`), slides to center, fades in
   - Duration: 0.9s with `expo.inOut` easing
5. **Timing**: 1.5s delay between swaps (loop delay)
6. **Viewport Control**: Pauses when out of viewport (ScrollTrigger)
7. **Tab Visibility**: Pauses when page tab is hidden

### React + Framer Motion Translation

| GSAP Feature | React/Framer Motion Equivalent |
|--------------|-------------------------------|
| Timeline with repeat | `setInterval` with cleanup |
| ScrollTrigger viewport detection | `useIntersectionObserver` hook (already exists) |
| `visibilitychange` listener | `useEffect` with document listener |
| DOM cloning/insertion | React state + key-based rendering |
| `yPercent` animation | Framer Motion `y` with