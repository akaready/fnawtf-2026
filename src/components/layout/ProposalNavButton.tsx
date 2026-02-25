'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const COOKIE_PREFIX = 'proposal_auth_';

function parseProposalSlugFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(COOKIE_PREFIX)) {
      const key  = trimmed.split('=')[0].trim();
      const slug = key.slice(COOKIE_PREFIX.length);
      if (slug) return slug;
    }
  }
  return null;
}

export function ProposalNavButton() {
  const [slug, setSlug] = useState<string | null>(null);
  const btnRef  = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSlug(parseProposalSlugFromCookies());
  }, []);

  useEffect(() => {
    const btn  = btnRef.current;
    const fill = fillRef.current;
    if (!btn || !fill || !slug) return;

    const textSpan  = btn.querySelector('span');
    const restColor  = 'rgba(161, 77, 253, 0.7)';
    const hoverColor = '#ffffff';

    const onEnter = (e: MouseEvent) => {
      const rect   = btn.getBoundingClientRect();
      const origin = e.clientX - rect.left < rect.width / 2 ? '0 50%' : '100% 50%';
      gsap.killTweensOf([fill, textSpan]);
      gsap.fromTo(fill, { scaleX: 0, transformOrigin: origin }, { scaleX: 1, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: hoverColor, duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = (e: MouseEvent) => {
      const rect   = btn.getBoundingClientRect();
      const origin = e.clientX - rect.left < rect.width / 2 ? '0 50%' : '100% 50%';
      gsap.to(fill, { scaleX: 0, transformOrigin: origin, duration: 0.3, ease: 'power2.out' });
      if (textSpan) gsap.to(textSpan, { color: restColor, duration: 0.3, ease: 'power2.out' });
    };

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, [slug]);

  if (!slug) return null;

  return (
    <a
      ref={btnRef}
      href={`/p/${slug}`}
      className="relative inline-block px-4 py-2 font-medium rounded-lg overflow-hidden border border-[var(--accent)]/40"
    >
      <div
        ref={fillRef}
        className="absolute inset-0 bg-[var(--accent)] pointer-events-none"
        style={{ transform: 'scaleX(0)', transformOrigin: '0 50%', zIndex: 0 }}
      />
      <span
        className="relative flex items-center text-sm"
        style={{ zIndex: 10, color: 'rgba(161, 77, 253, 0.7)' }}
      >
        Review Proposal
      </span>
    </a>
  );
}
