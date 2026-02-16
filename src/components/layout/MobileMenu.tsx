'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hamburgerRef.current) return;

    const handleClick = () => {
      setIsOpen(!isOpen);
    };

    hamburgerRef.current.addEventListener('click', handleClick);
    return () => {
      hamburgerRef.current?.removeEventListener('click', handleClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!line1Ref.current || !line2Ref.current || !line3Ref.current) return;

    if (isOpen) {
      gsap.timeline()
        .to(line1Ref.current, { y: 10, rotation: 45, duration: 0.3 }, 0)
        .to(line2Ref.current, { opacity: 0, duration: 0.3 }, 0)
        .to(line3Ref.current, { y: -10, rotation: -45, duration: 0.3 }, 0);

      if (menuRef.current) {
        gsap.to(menuRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.3 });
      }
    } else {
      gsap.timeline()
        .to(line1Ref.current, { y: 0, rotation: 0, duration: 0.3 }, 0)
        .to(line2Ref.current, { opacity: 1, duration: 0.3 }, 0)
        .to(line3Ref.current, { y: 0, rotation: 0, duration: 0.3 }, 0);

      if (menuRef.current) {
        gsap.to(menuRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.3 });
      }
    }
  }, [isOpen]);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        ref={hamburgerRef}
        className="md:hidden flex flex-col gap-1.5 p-2 z-50 relative"
        aria-label="Toggle menu"
        data-menu-button="burger"
      >
        <div ref={line1Ref} className="w-6 h-0.5 bg-foreground" />
        <div ref={line2Ref} className="w-6 h-0.5 bg-foreground" />
        <div ref={line3Ref} className="w-6 h-0.5 bg-foreground" />
      </button>

      {/* Mobile Menu Overlay */}
      <div
        ref={menuRef}
        className="fixed inset-0 bg-background z-40 md:hidden flex flex-col items-center justify-center gap-8 opacity-0 pointer-events-none"
      >
        <nav className="flex flex-col gap-6 items-center text-center">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className={`text-2xl font-display ${
                currentPage === link.href ? 'text-accent' : 'text-foreground'
              } hover:text-accent transition-colors`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <CalBookingButton
          buttonText="Let's Talk"
          namespace="introduction"
          calLink="fnawtf/introduction"
          isPrimary
        />
      </div>
    </>
  );
}
