'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PageTransition } from '@/components/animations/PageTransition';
import { ParallaxProvider } from '@/components/animations/ParallaxProvider';
import { ScrollProgressRight } from '@/components/animations/ScrollProgressRight';
import { FnaLoader } from '@/components/animations/FnaLoader';

interface Props {
  children: React.ReactNode;
  nav: React.ReactNode;
  navOnly?: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Wraps site pages with Navigation, Footer, PageTransition, and Parallax.
 * Admin routes (/admin/**) skip the navbar entirely — AdminShell has its own sidebar.
 */
export function SiteLayoutWrapper({ children, nav, footer }: Props) {
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);

  // If the user's first page isn't home, mark the intro animation as seen
  // so navigating to "/" later won't play it.
  useEffect(() => {
    if (initialPathRef.current !== '/') {
      sessionStorage.setItem('fna_seen', '1');
    }
  }, []);

  // Admin routes: no navbar — AdminShell has its own sidebar with logo
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Immersive pages: no nav/footer (they unmount behind the PageTransition panel)
  const isProposalDeck = /^\/p\/[^/]+$/.test(pathname);
  const isIntakeForm = pathname === '/start';
  const isImmersive = isProposalDeck || isIntakeForm;

  return (
    <PageTransition>
      {pathname === '/' && <FnaLoader />}
      <ScrollProgressRight />
      {!isImmersive && nav}
      <ParallaxProvider>
        <div id="page-content" className="min-h-screen">
          {children}
        </div>
      </ParallaxProvider>
      {!isImmersive && footer}
    </PageTransition>
  );
}
