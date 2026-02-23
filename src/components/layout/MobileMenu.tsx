'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { CalBookingButton } from '@/components/cal/CalBookingButton';
import gsap from 'gsap';

interface MobileMenuProps {
  currentPage?: string;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function MobileMenu({ currentPage }: MobileMenuProps) {
  const pathname = usePathname();
  const currentPage_ = currentPage ?? pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close menu on route change (handles Next.js client-side navigation)
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const handleNavClick = () => setIsOpen(false);

  // Hamburger ↔ X morph
  useEffect(() => {
    if (!line1Ref.current || !line2Ref.current || !line3Ref.current) return;

    if (isOpen) {
      gsap.timeline()
        .to(line1Ref.current, { y: 8, rotation: 45, duration: 0.3, ease: 'power2.inOut' }, 0)
        .to(line2Ref.current, { opacity: 0, scaleX: 0, duration: 0.15 }, 0)
        .to(line3Ref.current, { y: -8, rotation: -45, duration: 0.3, ease: 'power2.inOut' }, 0);
    } else {
      gsap.timeline()
        .to(line1Ref.current, { y: 0, rotation: 0, duration: 0.3, ease: 'power2.inOut' }, 0)
        .to(line2Ref.current, { opacity: 1, scaleX: 1, duration: 0.2, delay: 0.1 }, 0)
        .to(line3Ref.current, { y: 0, rotation: 0, duration: 0.3, ease: 'power2.inOut' }, 0);
    }
  }, [isOpen]);

  // Menu open / close animation.
  // Panel only animates y (never opacity) so backdrop-filter renders correctly.
  // The overlay lives at z-[35] — below the nav's z-40 — so the logo and
  // hamburger stay visible above the overlay at all times.
  useEffect(() => {
    if (!menuRef.current) return;

    const validNavItems = navItemsRef.current.filter(Boolean);

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      gsap.set(menuRef.current, { pointerEvents: 'auto' });

      const tl = gsap.timeline();

      tl.fromTo(
        menuRef.current,
        { y: '-100%' },
        { y: '0%', duration: 0.55, ease: 'power3.out' }
      );

      if (validNavItems.length) {
        tl.fromTo(
          validNavItems,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.38, stagger: 0.07, ease: 'power2.out' },
          '-=0.3'
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { y: -12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.32, ease: 'back.out(1.7)' },
          '-=0.1'
        );
      }
    } else {
      document.body.style.overflow = '';

      const validItems = [...validNavItems, ctaRef.current].filter(Boolean) as Element[];

      const tl = gsap.timeline({
        onComplete: () => {
          if (menuRef.current) gsap.set(menuRef.current, { pointerEvents: 'none' });
          if (validNavItems.length) gsap.set(validNavItems, { y: -20, opacity: 0 });
          if (ctaRef.current) gsap.set(ctaRef.current, { y: -12, opacity: 0 });
        },
      });

      if (validItems.length) {
        tl.to(validItems, { opacity: 0, y: -12, duration: 0.18, stagger: 0.03, ease: 'power2.in' });
      }

      tl.to(
        menuRef.current,
        { y: '-100%', duration: 0.42, ease: 'power3.in' },
        '-=0.05'
      );
    }
  }, [isOpen]);

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Portalled so it escapes the nav's backdrop-filter containing block.
  // z-[35] keeps it below the nav (z-40), so the nav bar floats above it.
  const overlay = (
    <div
      ref={menuRef}
      className="fixed inset-0 z-[35] flex flex-col items-center justify-center gap-10 pointer-events-none"
      style={{
        transform: 'translateY(-100%)',
        backgroundColor: 'rgba(2, 2, 6, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Nudge content below the nav bar so it feels centered in the visible area */}
      <div className="flex flex-col items-center gap-10 mt-20">
        <nav className="flex flex-col items-center gap-2 text-center">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              ref={(el) => { navItemsRef.current[index] = el; }}
              href={link.href}
              onClick={handleNavClick}
              className={`text-5xl font-bold leading-tight tracking-tight transition-colors duration-200 ${
                currentPage_ === link.href
                  ? 'text-purple-400'
                  : 'text-white hover:text-purple-300'
              }`}
              style={{ opacity: 0 }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div ref={ctaRef} style={{ opacity: 0 }}>
          <CalBookingButton
            buttonText="Let's Talk"
            namespace="introduction"
            calLink="fnawtf/introduction"
            isPrimary
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hamburger stays inside the nav. Because the overlay is z-[35] and the
          nav is z-40, this button naturally paints above the overlay. */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="md:hidden flex flex-col justify-center gap-[6px] p-2 relative"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <div ref={line1Ref} className="w-6 h-0.5 bg-white origin-center" />
        <div ref={line2Ref} className="w-6 h-0.5 bg-white origin-center" />
        <div ref={line3Ref} className="w-6 h-0.5 bg-white origin-center" />
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
