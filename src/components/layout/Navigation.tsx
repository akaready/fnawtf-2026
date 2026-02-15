'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useButtonHover } from '@/lib/animations/button-hover';

interface NavigationProps {
  currentPage?: string;
}

/**
 * Navigation component for the FNA.WTF website.
 * Provides desktop and mobile navigation with animated menu.
 */
export function Navigation({ currentPage = 'home' }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  // Initialize button hover animation
  const hoverContainerRef = useButtonHover({ theme: 'dark' });

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/work', label: 'Work' },
    { href: '/services', label: 'Services' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Initialize burger button animation
  useEffect(() => {
    const initBurgerAnimation = async () => {
      const button = document.querySelector('[data-menu-button="burger"]');
      if (!button) return;

      const gsapModule = await import('gsap');
      const gsap = gsapModule.default;

      // Animate burger icon
      const icon = button.querySelector('svg');
      if (icon) {
        gsap.fromTo(
          icon,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );
      }
    };

    initBurgerAnimation();
  }, [isOpen]);

  return (
    <div ref={hoverContainerRef}>
      {/* Desktop Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-6 lg:px-12 py-4 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-md' : 'bg-transparent'
        }`}
        data-nav="desktop"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-bold text-foreground hover:text-accent transition-colors"
          data-page-name="home"
        >
          fna.wtf
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2" ref={navRef}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn relative inline-flex items-center justify-center h-11 px-5 rounded-xl overflow-hidden"
              data-page-name={link.label.toLowerCase()}
              data-btn-hover
              data-theme={pathname === link.href ? 'light' : 'dark'}
            >
              <span className="btn__bg" />
              <span className="btn__circle-wrap">
                <span className="btn__circle">
                  <span className="before__100" />
                </span>
              </span>
              <span className="btn__text">
                <span className="btn-text-p">{link.label}</span>
              </span>
            </Link>
          ))}
        </div>

        {/* CTA Button with directional hover */}
        <Link
          href="/#contact"
          className="btn relative inline-flex items-center justify-center h-11 px-6 rounded-xl overflow-hidden"
          data-btn-hover
          data-theme="primary"
        >
          <span className="btn__bg" />
          <span className="btn__circle-wrap">
            <span className="btn__circle">
              <span className="before__100" />
            </span>
          </span>
          <span className="btn__text">
            <span className="btn-text-p">Let's Talk</span>
          </span>
        </Link>
      </nav>

      {/* Mobile Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 md:hidden px-4 py-4 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-md' : 'bg-transparent'
        }`}
        data-nav="mobile"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-lg font-bold text-foreground"
          >
            fna.wtf
          </Link>

          {/* Menu Button with animation */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-10 h-10 flex items-center justify-center text-foreground"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            data-menu-button="burger"
          >
            <span className="sr-only">{isOpen ? 'Close' : 'Menu'}</span>
            <div className="relative w-6 h-6">
              {/* Animated burger lines */}
              <span
                className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-1'
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-1'
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-background/95 backdrop-blur-md md:hidden transition-all duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        data-menu-overlay
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-display text-3xl font-bold transition-all duration-300 ${
                pathname === link.href
                  ? 'text-accent'
                  : 'text-foreground hover:text-accent'
              }`}
              style={{
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
              data-page-name={link.label.toLowerCase()}
            >
              {link.label}
            </Link>
          ))}

          {/* CTA */}
          <Link
            href="/#contact"
            className="mt-4 btn inline-flex items-center justify-center h-12 px-8 rounded-xl overflow-hidden"
            style={{
              transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
              opacity: isOpen ? 1 : 0,
              transitionDelay: isOpen ? '300ms' : '0ms',
            }}
            data-btn-hover
            data-theme="light"
          >
            <span className="btn__bg" />
            <span className="btn__circle-wrap">
              <span className="btn__circle">
                <span className="before__100" />
              </span>
            </span>
            <span className="btn__text">
              <span className="btn-text-p">Let's Talk</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
