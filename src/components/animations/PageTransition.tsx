'use client';

import React, { useEffect } from 'react';
import gsap from 'gsap';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition - Page wipe transition with page name label
 * Uses data attributes:
 * - data-page-name - Name to display during transition
 */
export function PageTransition({ children }: PageTransitionProps) {
  // Wipe transition effect on navigation
  useEffect(() => {
    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (!link || link.getAttribute('target') === '_blank') return;
      if (link.href.startsWith('#')) return;

      const pageName = link.getAttribute('data-page-name') || 'Loading';

      // Create wipe panel
      const wipePanel = document.createElement('div');
      wipePanel.className =
        'fixed inset-0 bg-accent flex items-center justify-center z-50 pointer-events-none';
      wipePanel.innerHTML = `
        <div class="text-background font-display text-4xl font-bold opacity-50">
          ${pageName}
        </div>
      `;

      document.body.appendChild(wipePanel);

      // Animate wipe
      const timeline = gsap.timeline({
        onComplete: () => {
          wipePanel.remove();
        },
      });

      timeline
        .fromTo(wipePanel, { yPercent: -100 }, { yPercent: 0, duration: 0.4 })
        .to(wipePanel, { yPercent: 100, duration: 0.4 });
    };

    document.addEventListener('click', handleNavClick);
    return () => document.removeEventListener('click', handleNavClick);
  }, []);

  return <>{children}</>;
}
