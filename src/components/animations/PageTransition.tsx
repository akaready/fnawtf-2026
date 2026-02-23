'use client';

import React, { useEffect } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

function createPanel(styles: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.left = '0';
  panel.style.right = '0';
  panel.style.zIndex = '9999';
  panel.style.pointerEvents = 'none';
  Object.assign(panel.style, styles);
  document.body.appendChild(panel);
  return panel;
}

// Active transition — diagonal skewed sweep, covers viewport below the nav bar
function runDiagonal(navigate: () => void, onComplete: () => void) {
  const navEl = document.querySelector('nav') as HTMLElement | null;
  const navHeight = navEl ? navEl.offsetHeight : 0;

  const panel = createPanel({
    top: `${navHeight}px`,
    bottom: '-10vh',
    backgroundColor: 'var(--accent)',
    transformOrigin: 'center center',
    zIndex: '9999',
  });
  gsap.timeline()
    .fromTo(panel, { yPercent: -120, skewY: -8 }, { yPercent: 0, skewY: 0, duration: 0.6, ease: 'power3.inOut' })
    .call(() => {
      // Instant scroll reset while panel covers screen — invisible to user.
      // 'instant' bypasses scroll-smooth on html; router.push({ scroll: false })
      // prevents Next.js from doing its own animated reset afterward.
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Hide content while panel covers the screen — new page will render into it hidden
      const content = document.querySelector('#page-content');
      if (content) gsap.set(content, { y: -50 });
      navigate();
    })
    .to(panel, { yPercent: 120, skewY: 8, duration: 0.55, ease: 'power3.in', onComplete: () => panel.remove() })
    // Overlap content reveal with the last 0.3s of the panel exit
    .to('#page-content', { y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform', onComplete }, '-=0.3');
}

// Stashed — simple black fade, keep for future use
// function runFade(navigate: () => void, onComplete: () => void) {
//   const panel = createPanel({ top: '0', bottom: '0', backgroundColor: 'var(--background)', opacity: '0' });
//   gsap.timeline({ onComplete })
//     .to(panel, { opacity: 1, duration: 0.35, ease: 'power2.inOut' })
//     .call(navigate)
//     .to(panel, { opacity: 0, duration: 0.35, ease: 'power2.inOut', delay: 0.1, onComplete: () => panel.remove() });
// }

/**
 * PageTransition — diagonal skewed purple sweep on all page navigations.
 *
 * Uses capture-phase click interception + e.preventDefault() to stop
 * Next.js from navigating immediately. router.push() is called at the
 * midpoint (when the panel fully covers the screen), so the new page
 * renders behind the panel before the reveal plays.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter();

  useEffect(() => {
    let isAnimating = false;

    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      if (!link) return;
      if (link.getAttribute('target') === '_blank') return;

      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) return;
      } catch {
        return;
      }

      const destPathname = url.pathname;

      // Same page — GSAP scroll to top with custom easing.
      // Disable scroll-smooth on html while GSAP runs, otherwise the browser
      // tries to smooth each individual scrollTo call, fighting GSAP every frame.
      if (destPathname === window.location.pathname) {
        e.preventDefault();
        const start = window.scrollY;
        document.documentElement.style.scrollBehavior = 'auto';
        gsap.to({ y: start }, {
          y: 0,
          duration: 0.8,
          ease: 'power3.inOut',
          onUpdate: function () { window.scrollTo(0, this.targets()[0].y); },
          onComplete: () => { document.documentElement.style.scrollBehavior = ''; },
        });
        return;
      }

      if (isAnimating) return;

      // Stop Next.js Link's own click handler from navigating immediately.
      // We call router.push() manually at the animation midpoint instead.
      e.preventDefault();
      e.stopPropagation();
      isAnimating = true;

      // Signal Navigation so it can immediately update pending active state
      window.dispatchEvent(new CustomEvent('fna-nav-start', { detail: { href: destPathname } }));

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        router.push(destPathname, { scroll: false });
        isAnimating = false;
        return;
      }

      runDiagonal(
        () => router.push(destPathname, { scroll: false }),
        () => { isAnimating = false; }
      );
    };

    // Capture phase — fires before Next.js Link's bubble-phase handler
    document.addEventListener('click', handleNavClick, true);
    return () => document.removeEventListener('click', handleNavClick, true);
  }, [router]);

  return <>{children}</>;
}
