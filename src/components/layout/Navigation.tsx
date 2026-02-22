'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { NavLogo } from './NavLogo';
import { NavButton } from './NavButton';
import { CalBookingButton } from '@/components/cal/CalBookingButton';
import { MobileMenu } from './MobileMenu';
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

  // Animation state
  const [hasAnimated, setHasAnimated] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

  // Trigger nav animation after mask reveal completes (with a small delay)
  useEffect(() => {
    const isHomePage = currentPage_ === '/';
    if (!isDesktop || hasAnimated || prefersReducedMotion || !isHomePage) {
      // Ensure nav is visible immediately if conditions not met
      if (navRef.current) {
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
      className="fixed top-0 z-40 w-full px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md"
      style={
        isDesktop && !hasAnimated
          ? { transform: 'translateY(-100%)' }
          : undefined
      }
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <NavLogo
          ref={logoRef}
          style={isDesktop && !hasAnimated ? { opacity: 0 } : undefined}
        />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link, index) => (
            <div
              key={link.href}
              ref={(el) => {
                navItemsRef.current[index] = el;
              }}
              style={isDesktop && !hasAnimated ? { opacity: 0 } : undefined}
            >
              <NavButton href={link.href} iconName={link.iconName}>
                {link.label}
              </NavButton>
            </div>
          ))}
        </div>

        {/* Desktop CTA */}
        <div
          ref={ctaRef}
          className="hidden md:block"
          style={isDesktop && !hasAnimated ? { opacity: 0 } : undefined}
        >
          <CalBookingButton
            buttonText="Let's Talk"
            namespace="introduction"
            calLink="fnawtf/introduction"
            isPrimary
          />
        </div>

        {/* Mobile Menu */}
        <MobileMenu currentPage={currentPage} />
      </div>
    </nav>
  );
}
