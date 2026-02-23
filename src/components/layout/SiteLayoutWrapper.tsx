'use client';

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

  // Admin routes: no navbar — AdminShell has its own sidebar with logo
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <PageTransition>
      {pathname === '/' && <FnaLoader />}
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
