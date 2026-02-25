'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { NavLogo } from './NavLogo';
import { NavButton } from './NavButton';
import { CalBookingButton } from '@/components/cal/CalBookingButton';
import { MobileMenu } from './MobileMenu';
import { ProposalNavButton } from './ProposalNavButton';
import { useGsap } from '@/hooks/useGsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface NavigationProps {
  currentPage?: string;
}

const navLinks = [
  { href: '/', label: 'Home', iconName: 'home' as const },
  { href: '/work', label: 'Work', iconName: 'play' as const },
  { href: '/services', label: 'Services', iconName: 'clipboard-list' as const },
  { href: '/pricing', label: 'Pricing', iconName: 'dollar-sign' as const },
  { href: '/about', label: 'About', iconName: 'info' as const },
];

export function Navigation({ currentPage }: NavigationProps) {
  // Get current pathname if not provided
  const pathname = usePathname();
  const currentPage_ = currentPage ?? pathname;

  // Track clicked-but-not-yet-navigated href so the destination button
  // shows active immediately and the old one exits immediately on click
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const handleNavStart = (e: Event) => {
      setPendingHref((e as CustomEvent<{ href: string }>).detail.href);
    };
    window.addEventListener('fna-nav-start', handleNavStart);
    return () => window.removeEventListener('fna-nav-start', handleNavStart);
  }, []);

  // Clear pending once the pathname actually updates
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  // Animation state — skip if user has already seen the loader this session
  const [hasAnimated, setHasAnimated] = useState(() =>
    typeof window !== 'undefined' && !!sessionStorage.getItem('fna_seen')
  );
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Proposal exit: nav should start hidden and animate in on reveal event
  const [proposalExiting, setProposalExiting] = useState(false);

  // Check sessionStorage synchronously before paint to avoid nav flash
  useLayoutEffect(() => {
    if (sessionStorage.getItem('fna_proposal_exit')) {
      setProposalExiting(true);
    }
  }, []);

  // DOM refs for animation targets
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Desktop detection (animation only runs on desktop)
  const [isDesktop, setIsDesktop] = useState(false);

  // Desktop detection effect
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Proposal exit: listen for reveal event and animate nav back in
  useEffect(() => {
    if (!proposalExiting) return;

    const handleReveal = () => {
      sessionStorage.removeItem('fna_proposal_exit');

      const nav = navRef.current;
      if (!nav) return;

      const tl = gsap.timeline({
        onComplete: () => setProposalExiting(false),
      });
      tl.to(nav, { y: 0, duration: 0.5, ease: 'power2.out' }, 0);
      if (logoRef.current) tl.fromTo(logoRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.3);
      const validNavItems = navItemsRef.current.filter(Boolean);
      if (validNavItems.length > 0) tl.fromTo(validNavItems, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, 0.4);
      if (ctaRef.current) tl.fromTo(ctaRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }, 0.7);
    };

    window.addEventListener('fna-nav-reveal', handleReveal);
    return () => window.removeEventListener('fna-nav-reveal', handleReveal);
  }, [proposalExiting]);

  // Trigger nav animation after mask reveal completes (with a small delay)
  useEffect(() => {
    const isHomePage = currentPage_ === '/';
    if (!isDesktop || hasAnimated || prefersReducedMotion || !isHomePage) {
      // Only reset the transform when the nav might be hidden (first visit).
      // Skip this on every-navigation re-runs (hasAnimated already true) to
      // avoid conflicting with GSAP's applied transform mid-transition.
      if (!hasAnimated && navRef.current) {
        navRef.current.style.transform = 'translateY(0)';
      }
      if (!isHomePage && !hasAnimated) {
        setHasAnimated(true);
      }
      return;
    }

    let delayId: NodeJS.Timeout;

    const handleLoaderComplete = () => {
      // Delay nav entrance so hero text animates in first
      delayId = setTimeout(() => {
        setShouldAnimate(true);
        setHasAnimated(true);
      }, 500);
    };

    window.addEventListener('fna-loader-complete', handleLoaderComplete);
    return () => {
      window.removeEventListener('fna-loader-complete', handleLoaderComplete);
      clearTimeout(delayId);
    };
  }, [isDesktop, hasAnimated, prefersReducedMotion, currentPage_]);

  // Animation effect
  useGsap(() => {
    if (!shouldAnimate || !navRef.current) return;

    const timeline = gsap.timeline();

    // 1. Container drops in from above
    timeline.fromTo(
      navRef.current,
      { y: '-100%' },
      { y: 0, duration: 0.5, ease: 'power2.out' },
      0
    );

    // 2. Logo fades in (overlaps with container)
    if (logoRef.current) {
      timeline.fromTo(
        logoRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        0.3
      );
    }

    // 3. Nav items stagger in
    const validNavItems = navItemsRef.current.filter(Boolean);
    if (validNavItems.length > 0) {
      timeline.fromTo(
        validNavItems,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' },
        0.4
      );
    }

    // 4. CTA button fades in last
    if (ctaRef.current) {
      timeline.fromTo(
        ctaRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' },
        0.7
      );
    }

    return () => {
      timeline.kill();
    };
  }, [shouldAnimate]);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 z-[10000] w-full px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md"
      style={
        pathname.startsWith('/p/') || proposalExiting
          ? { transform: 'translateY(-100%)' }
          : isDesktop && !hasAnimated
            ? { transform: 'translateY(-100%)' }
            : undefined
      }
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <NavLogo
          ref={logoRef}
          style={proposalExiting || (isDesktop && !hasAnimated) ? { opacity: 0 } : undefined}
        />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link, index) => (
            <div
              key={link.href}
              ref={(el) => {
                navItemsRef.current[index] = el;
              }}
              className="flex items-center"
              style={proposalExiting || (isDesktop && !hasAnimated) ? { opacity: 0 } : undefined}
            >
              <NavButton
                href={link.href}
                iconName={link.iconName}
                isActive={
                  pendingHref !== null
                    ? pendingHref === link.href
                    : currentPage_ === link.href
                }
              >
                {link.label}
              </NavButton>
            </div>
          ))}
        </div>

        {/* Desktop CTA — always render container for layout, skip Cal embed on admin routes */}
        <div
          ref={ctaRef}
          className="hidden md:flex md:items-center gap-3"
          style={proposalExiting || (isDesktop && !hasAnimated) ? { opacity: 0 } : undefined}
        >
          <ProposalNavButton />
          {!pathname.startsWith('/admin') && (
            <CalBookingButton
              buttonText="Let's Talk"
              namespace="introduction"
              calLink="fnawtf/introduction"
              isPrimary
            />
          )}
        </div>

        {/* Mobile Menu */}
        <MobileMenu currentPage={currentPage} />
      </div>
    </nav>
  );
}
