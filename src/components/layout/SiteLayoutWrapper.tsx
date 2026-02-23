'use client';

import { usePathname } from 'next/navigation';
import { PageTransition } from '@/components/animations/PageTransition';
import { ParallaxProvider } from '@/components/animations/ParallaxProvider';
import { ScrollProgressRight } from '@/components/animations/ScrollProgressRight';

interface Props {
  children: React.ReactNode;
  nav: React.ReactNode;
  navOnly: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Wraps site pages with Navigation, Footer, PageTransition, and Parallax.
 * Admin routes (/admin/**) get bare Navigation only — no overlay, no animations.
 */
export function SiteLayoutWrapper({ children, nav, navOnly, footer }: Props) {
  const pathname = usePathname();

  // Admin routes: nav bar only (no video overlay, no Cal embed side-effects)
  if (pathname.startsWith('/admin')) {
    return (
      <>
        {navOnly}
        {children}
      </>
    );
  }

  return (
    <PageTransition>
      <ScrollProgressRight />
      {nav}
      <ParallaxProvider>
        <div id="page-content" className="min-h-screen">
          {children}
        </div>
      </ParallaxProvider>
      {footer}
    </PageTransition>
  );
}
