# Page Transitions Rewrite - Native React Implementation

**Created**: 2026-02-16 03:40 PST  
**Status**: Planning Phase

## Problem Analysis

### Current Implementation Issues

1. **Broken Navigation Pattern**
   - Using regular `<a href>` tags instead of Next.js `<Link>` components
   - Causes full page reloads instead of client-side navigation
   - Breaks Next.js App Router's prefetching and caching
   
2. **Manual Click Interception**
   - [`PageTransition.tsx`](../src/components/animations/PageTransition.tsx) manually intercepts click events
   - Creates GSAP animations via DOM manipulation
   - Doesn't integrate with Next.js routing lifecycle
   
3. **React Anti-patterns**
   - Direct DOM manipulation (`document.createElement`, `appendChild`)
   - Doesn't work with Server Components
   - No proper cleanup between route changes
   - Bypasses React's reconciliation
   
4. **Based on Barba.js Pattern**
   - Resource file shows original implementation used Barba.js
   - Not compatible with Next.js App Router architecture
   - Designed for traditional multi-page apps, not SPAs

### Files Requiring Changes

- ❌ **Remove**: [`src/components/animations/PageTransition.tsx`](../src/components/animations/PageTransition.tsx)
- ✏️ **Update**: [`src/components/layout/NavButton.tsx`](../src/components/layout/NavButton.tsx) - Switch to Next.js Link
- ✏️ **Update**: [`src/components/layout/Navigation.tsx`](../src/components/layout/Navigation.tsx) - Update logo link
- ✏️ **Update**: [`src/app/layout.tsx`](../src/app/layout.tsx) - Remove PageTransition wrapper
- ➕ **Create**: New transition implementation files

## Proposed Solution: Hybrid Approach

Use **View Transitions API** (browser-native) with **Framer Motion** fallback.

### Why This Approach?

1. **View Transitions API** (Primary)
   - Native browser feature (Chrome 111+, Edge 111+)
   - Zero JavaScript for transition logic
   - Smooth, hardware-accelerated
   - Perfect for Next.js App Router
   - Progressive enhancement

2. **Framer Motion** (Fallback)
   - Already installed (`framer-motion@10.16.0`)
   - Works in all browsers
   - Provides similar visual experience
   - Graceful degradation

## Implementation Plan

### Phase 1: Navigation Infrastructure

**Goal**: Fix the foundation by switching to Next.js navigation patterns

#### 1.1 Update NavButton Component

**File**: [`src/components/layout/NavButton.tsx`](../src/components/layout/NavButton.tsx)

**Changes**:
- Replace `<a href>` with Next.js `<Link>`
- Keep GSAP hover animations (those work fine)
- Add `data-page-name` attribute for transition label
- Ensure `onClick` handlers work with Link

**Example**:
```tsx
import Link from 'next/link';

export function NavButton({ href, children, isPrimary }: NavButtonProps) {
  // Keep existing GSAP hover logic
  
  return (
    <Link
      href={href}
      ref={buttonRef}
      data-page-name={children} // For transition label
      className="..."
    >
      {/* Existing button content */}
    </Link>
  );
}
```

#### 1.2 Update Navigation Logo

**File**: [`src/components/layout/Navigation.tsx`](../src/components/layout/Navigation.tsx:24)

**Changes**:
```tsx
import Link from 'next/link';

// Replace line 24
<Link href="/" className="font-display font-bold text-xl text-accent">
  FNA
</Link>
```

#### 1.3 Update Mobile Menu Links

**File**: [`src/components/layout/MobileMenu.tsx`](../src/components/layout/MobileMenu.tsx)

**Action**: Review and update any `<a>` tags to use Next.js `<Link>`

### Phase 2: View Transitions API Implementation

**Goal**: Implement browser-native transitions for modern browsers

#### 2.1 Create ViewTransitions Component

**File**: `src/components/animations/ViewTransitions.tsx` (new)

**Purpose**: Enable View Transitions API in Next.js

```tsx
'use client';

import { useEffect } from 'react';

export function ViewTransitions() {
  useEffect(() => {
    // Feature detection
    if (!document.startViewTransition) {
      console.log('View Transitions API not supported');
      return;
    }

    // Intercept Next.js navigation
    const handleNavigation = () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          // Next.js will handle the actual navigation
        });
      }
    };

    // Listen to Next.js router events via browser navigation
    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  return null;
}
```

#### 2.2 Add View Transitions CSS

**File**: [`src/app/globals.css`](../src/app/globals.css)

**Add** at the end:
```css
/* View Transitions API Styles */
@media (prefers-reduced-motion: no-preference) {
  /* Page transition with wipe effect */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.4s;
  }

  ::view-transition-old(root) {
    animation-name: slide-up-out;
  }

  ::view-transition-new(root) {
    animation-name: slide-down-in;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-15vh);
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(15vh);
    }
    to {
      transform: translateY(0);
    }
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

#### 2.3 Create Transition Label Overlay

**File**: `src/components/animations/TransitionLabel.tsx` (new)

**Purpose**: Show page name during transition (matching original design)

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/work': 'Work',
  '/services': 'Services',
  '/pricing': 'Pricing',
  '/about': 'About',
  '/contact': 'Contact',
};

export function TransitionLabel() {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    // Show label during navigation
    setLabel(PAGE_NAMES[pathname] || 'Loading');
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 800); // Match transition duration

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="text-background font-display text-4xl font-bold opacity-50">
            {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Phase 3: Framer Motion Fallback

**Goal**: Provide transitions for browsers without View Transitions API support

#### 3.1 Create Template Files

**Why templates?** Next.js App Router uses `template.tsx` files for page-level animations. Unlike `layout.tsx`, templates re-render on navigation, making them perfect for transitions.

**File**: `src/app/template.tsx` (new)

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if View Transitions API is supported
  const supportsViewTransitions = typeof document !== 'undefined' && 
    'startViewTransition' in document;

  // Skip Framer Motion if View Transitions API is supported
  if (supportsViewTransitions) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ y: '15vh', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '-15vh', opacity: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1], // Custom easing
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

#### 3.2 Create useViewTransitions Hook

**File**: `src/hooks/useViewTransitions.ts` (new)

**Purpose**: Detect support and manage transition state

```tsx
'use client';

import { useEffect, useState } from 'react';

export function useViewTransitions() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof document !== 'undefined' && 
      'startViewTransition' in document
    );
  }, []);

  return {
    isSupported,
    startTransition: (callback: () => void) => {
      if (isSupported && document.startViewTransition) {
        document.startViewTransition(callback);
      } else {
        callback();
      }
    },
  };
}
```

### Phase 4: Integration & Cleanup

**Goal**: Wire everything together and remove old code

#### 4.1 Update Root Layout

**File**: [`src/app/layout.tsx`](../src/app/layout.tsx)

**Changes**:
```tsx
import { ViewTransitions } from '@/components/animations/ViewTransitions';
import { TransitionLabel } from '@/components/animations/TransitionLabel';
// Remove: import { PageTransition } from '@/components/animations/PageTransition';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className="bg-background text-foreground">
        <ViewTransitions />
        <TransitionLabel />
        <ScrollProgressBar />
        <Navigation />

        <ParallaxProvider>
          <ScrollRevealProvider>{children}</ScrollRevealProvider>
        </ParallaxProvider>

        <Footer />
      </body>
    </html>
  );
}
```

#### 4.2 Delete Old PageTransition

**File**: `src/components/animations/PageTransition.tsx`

**Action**: Delete this file (replaced by new implementation)

#### 4.3 Update Motion Configuration

**File**: `src/components/homepage/ClientLogosCycle.tsx` and others using Framer Motion

**Action**: Ensure compatibility with new template-based transitions

### Phase 5: Polish & Optimization

#### 5.1 Add Loading States

**File**: [`src/app/loading.tsx`](../src/app/loading.tsx)

**Enhance** to work with transitions:
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-accent font-display text-2xl animate-pulse">
        Loading...
      </div>
    </div>
  );
}
```

#### 5.2 Add Meta Tags for View Transitions

**File**: [`src/app/layout.tsx`](../src/app/layout.tsx)

**Update metadata**:
```tsx
export const metadata: Metadata = {
  title: 'FNA.WTF',
  description: 'Friends n Allies - Video Production & Digital Storytelling',
  other: {
    'view-transition': 'same-origin', // Enable View Transitions API
  },
};
```

#### 5.3 Prefetch Links

**File**: [`src/components/layout/NavButton.tsx`](../src/components/layout/NavButton.tsx)

**Add prefetching**:
```tsx
<Link
  href={href}
  prefetch={true} // Enable Next.js prefetching
  // ... rest of props
>
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Test in Chrome/Edge (View Transitions API support)
- [ ] Test in Firefox/Safari (Framer Motion fallback)
- [ ] Test with reduced motion preference enabled
- [ ] Test all navigation links (desktop + mobile)
- [ ] Verify smooth transitions between pages
- [ ] Check transition label appears correctly
- [ ] Verify no flashing or layout shifts
- [ ] Test browser back/forward buttons
- [ ] Check mobile menu transitions

### Performance Testing

- [ ] Lighthouse score before/after
- [ ] Check Core Web Vitals (LCP, CLS, FID)
- [ ] Measure transition smoothness (should be 60fps)
- [ ] Verify no memory leaks during navigation
- [ ] Test on slower devices/connections

## Browser Support

### View Transitions API
- ✅ Chrome 111+
- ✅ Edge 111+
- ⏳ Safari (in development)
- ⏳ Firefox (in development)

### Framer Motion Fallback
- ✅ All modern browsers
- ✅ Safari
- ✅ Firefox
- ✅ Older browsers with ES6 support

## Migration Checklist

### Pre-Migration
- [ ] Review all navigation links in the app
- [ ] Backup current PageTransition implementation
- [ ] Create feature branch for this work

### Implementation Order
1. [ ] **Phase 1**: Update navigation components (NavButton, Navigation, MobileMenu)
2. [ ] **Phase 2**: Implement View Transitions API
3. [ ] **Phase 3**: Add Framer Motion fallback
4. [ ] **Phase 4**: Integrate and cleanup
5. [ ] **Phase 5**: Polish and optimize

### Post-Migration
- [ ] Delete old PageTransition.tsx
- [ ] Update documentation
- [ ] Monitor error logs for transition issues
- [ ] Gather user feedback on transition feel

## Performance Benefits

### Before (Current)
- Manual DOM manipulation on every click
- GSAP animations run regardless of need
- No prefetching of next page
- Full page reloads with `<a>` tags
- JavaScript-heavy transition logic

### After (Proposed)
- Browser-native transitions (when supported)
- Zero-JavaScript transitions in modern browsers
- Next.js prefetching enabled
- Client-side navigation
- Progressive enhancement approach
- Smaller JavaScript bundle (removing transition code)

## Estimated Impact

### Code Changes
- Files to create: 4
- Files to modify: 4
- Files to delete: 1
- Net change: ~+200 lines, improved architecture

### User Experience
- Smoother transitions (hardware-accelerated)
- Faster navigation (prefetching + SPA navigation)
- Better accessibility (respects reduced motion)
- Progressive enhancement (works everywhere)

## Future Enhancements

1. **Custom Transitions Per Route**
   - Different animations for different page types
   - Use view-transition-name for specific elements

2. **Shared Element Transitions**
   - Morph images between pages
   - Animate navigation elements

3. **Gesture-Based Navigation**
   - Swipe to go back on mobile
   - Drag to navigate between pages

4. **Analytics Integration**
   - Track transition performance
   - Monitor user navigation patterns

## References

- [View Transitions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Framer Motion - AnimatePresence](https://www.framer.com/motion/animate-presence/)
- [Next.js template.tsx](https://nextjs.org/docs/app/api-reference/file-conventions/template)

## Questions for Review

Before implementation, clarify:

1. **Transition Style**: Do you want to keep the "wipe" effect from the original design?
2. **Page Labels**: Should we keep showing page names during transitions?
3. **Timing**: Is 0.4s duration appropriate, or prefer faster/slower?
4. **Mobile Behavior**: Same transitions on mobile, or simplified?
5. **Loading States**: How should long page loads be handled during transitions?

---

## Next Steps

1. **Review this plan** - Approve approach and answer questions
2. **Create feature branch** - `feature/native-page-transitions`
3. **Begin Phase 1** - Fix navigation infrastructure first
4. **Test incrementally** - Verify each phase before moving to next
5. **Deploy to preview** - Test in real environment before production
