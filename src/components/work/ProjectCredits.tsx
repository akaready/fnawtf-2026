'use client';

import { Fragment, useRef, useEffect, useCallback } from 'react';
import type { ProjectCredit } from '@/types/project';

interface ProjectCreditsProps {
  credits: ProjectCredit[];
}

export function ProjectCredits({ credits }: ProjectCreditsProps) {
  if (credits.length === 0) return null;

  const talentRoles = ['cast', 'narrator', 'vocalist'];
  const crew = credits.filter(c => !talentRoles.includes(c.role.toLowerCase()));
  const castMembers = credits.filter(c => c.role.toLowerCase() === 'cast');
  const narrators = credits.filter(c => c.role.toLowerCase() === 'narrator');
  const vocalists = credits.filter(c => c.role.toLowerCase() === 'vocalist');
  const hasTalent = castMembers.length > 0 || narrators.length > 0 || vocalists.length > 0;

  const castRef = useRef<HTMLDivElement>(null);

  const updateSeparators = useCallback(() => {
    const el = castRef.current;
    if (!el) return;
    // First pass: show all separators so layout is accurate
    const seps = el.querySelectorAll<HTMLElement>('[data-sep]');
    seps.forEach((sep) => { sep.style.display = ''; });

    // Second pass: hide separators at line breaks
    seps.forEach((sep) => {
      const prev = sep.previousElementSibling;
      const next = sep.nextElementSibling;
      if (prev && next) {
        const prevTop = prev.getBoundingClientRect().top;
        const nextTop = next.getBoundingClientRect().top;
        sep.style.display = Math.abs(prevTop - nextTop) < 4 ? '' : 'none';
      }
    });
  }, []);

  useEffect(() => {
    const el = castRef.current;
    if (!el) return;
    updateSeparators();
    const ro = new ResizeObserver(updateSeparators);
    ro.observe(el);
    return () => ro.disconnect();
  }, [castMembers, updateSeparators]);

  return (
    <section className="pt-10 pb-20 px-6 lg:px-16 border-b border-border">
      <div className="max-w-md mx-auto text-center">
        {/* Creative Team (crew) */}
        {crew.length > 0 && (
          <>
            <p className="text-xs tracking-[0.4em] uppercase font-mono text-muted-foreground mb-3">
              creative team
            </p>
            <div className="w-8 border-t border-white/20 mx-auto mb-4" />

            <div className="flex flex-col mb-12">
              {crew.map((credit) => (
                <p key={credit.id} className="leading-snug mb-2 text-xl">
                  <span className="block sm:inline text-muted-foreground font-light">
                    {credit.role.toLowerCase()}{' '}
                  </span>
                  <span className="whitespace-nowrap text-foreground font-bold font-display">
                    {credit.name.toUpperCase()}
                  </span>
                </p>
              ))}
            </div>
          </>
        )}

        {/* Cast + Narrator + Vocalist */}
        {hasTalent && (
          <>
            <p className="text-xs tracking-[0.4em] uppercase font-mono text-muted-foreground mb-3">
              cast
            </p>
            <div className="w-8 border-t border-white/20 mx-auto mb-4" />

            {castMembers.length > 0 && (
              <div
                ref={castRef}
                className="text-xl leading-relaxed mb-2 flex flex-wrap justify-center items-center gap-y-1"
              >
                {castMembers.map((c, i) => (
                  <Fragment key={c.id}>
                    {i > 0 && (
                      <span data-sep className="font-sans font-normal text-muted-foreground mx-2">•</span>
                    )}
                    <span className="whitespace-nowrap font-bold font-display">
                      {c.name.toUpperCase()}
                    </span>
                  </Fragment>
                ))}
              </div>
            )}

            {narrators.map((n) => (
              <p key={n.id} className="leading-snug mb-2 text-xl">
                <span className="text-muted-foreground font-light">
                  narrator{' '}
                </span>
                <span className="whitespace-nowrap text-foreground font-bold font-display">
                  {n.name.toUpperCase()}
                </span>
              </p>
            ))}

            {vocalists.map((v) => (
              <p key={v.id} className="leading-snug mb-2 text-xl">
                <span className="text-muted-foreground font-light">
                  vocalist{' '}
                </span>
                <span className="whitespace-nowrap text-foreground font-bold font-display">
                  {v.name.toUpperCase()}
                </span>
              </p>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
