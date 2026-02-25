'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useRouter, usePathname } from 'next/navigation';

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

function playPanelExit(panel: HTMLDivElement, onComplete: () => void) {
  // Set y: -50 right before exit — panel still covers screen at this point,
  // so it's invisible. Guarantees a fresh starting value on the real content
  // regardless of what happened during any hold period.
  const content = document.querySelector('#page-content');
  if (content) gsap.set(content, { y: -50 });

  gsap.timeline()
    .to(panel, { yPercent: 120, skewY: 8, duration: 0.55, ease: 'power3.in', onComplete: () => panel.remove() })
    .to('#page-content', { y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform', onComplete }, '-=0.3');
}

/**
 * PageTransition — diagonal skewed purple sweep on all page navigations.
 *
 * The panel always holds at full coverage after navigate() is called and only
 * exits once usePathname() confirms the new route has committed to the DOM.
 * For fast client-cached routes this is near-instant; for server components
 * with data fetching (e.g. /work, /work/[slug]) the panel correctly waits.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Holds the panel + resume callback while waiting for a slow server route
  const pendingRef = useRef<{
    panel: HTMLDivElement;
    destPathname: string;
    onComplete: () => void;
    timeout: ReturnType<typeof setTimeout>;
  } | null>(null);

  // When pathname changes to the expected destination, release the panel
  useEffect(() => {
    if (!pendingRef.current) return;
    if (pathname !== pendingRef.current.destPathname) return;

    clearTimeout(pendingRef.current.timeout);
    const { panel, onComplete } = pendingRef.current;
    pendingRef.current = null;
    playPanelExit(panel, onComplete);
  }, [pathname]);

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

      // Admin routes don't use page transitions — let browser navigate normally
      if (destPathname.startsWith('/admin')) return;

      // Same page — GSAP scroll to top with custom easing.
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

      e.preventDefault();
      e.stopPropagation();
      isAnimating = true;

      window.dispatchEvent(new CustomEvent('fna-nav-start', { detail: { href: destPathname } }));

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        router.push(destPathname, { scroll: false });
        isAnimating = false;
        return;
      }

      const navEl = document.querySelector('nav') as HTMLElement | null;
      const navHeight = navEl ? navEl.offsetHeight : 0;

      // Proposal routes: cover entire viewport (nav unmounts behind the panel)
      const isProposalTransition = destPathname.startsWith('/p/') || window.location.pathname.startsWith('/p/');

      const panel = createPanel({
        top: isProposalTransition ? '0' : `${navHeight}px`,
        bottom: '-10vh',
        backgroundColor: 'var(--accent)',
        transformOrigin: 'center center',
        zIndex: isProposalTransition ? '10001' : '9999',
      });

      const onComplete = () => { isAnimating = false; };

      gsap.timeline()
        .fromTo(panel, { yPercent: -120, skewY: -8 }, { yPercent: 0, skewY: 0, duration: 0.6, ease: 'power3.inOut' })
        .call(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          router.push(destPathname, { scroll: false });

          // Always hold — release when usePathname confirms the new route
          const timeout = setTimeout(() => {
            if (pendingRef.current) {
              pendingRef.current = null;
              playPanelExit(panel, onComplete);
            }
          }, 5000); // safety cap

          pendingRef.current = { panel, destPathname, onComplete, timeout };
        });
    };

    document.addEventListener('click', handleNavClick, true);
    return () => document.removeEventListener('click', handleNavClick, true);
  }, [router]);

  return <>{children}</>;
}
