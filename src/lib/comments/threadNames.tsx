'use client';

import React from 'react';
import type { ScriptShareCommentRow } from '@/types/scripts';
import { firstName } from '@/lib/comments/utils';

/** Render unique participant names as bold spans with normal-weight connectors */
export function threadNames(comments: ScriptShareCommentRow[]): React.ReactNode {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const c of comments) {
    const n = firstName(c.viewer_name, c.viewer_email);
    if (!seen.has(n)) { seen.add(n); names.push(n); }
  }
  const b = (n: string) => <span key={n} className="font-semibold">{n}</span>;
  if (names.length === 1) return b(names[0]);
  if (names.length === 2) return <>{b(names[0])} <span className="font-normal">and</span> {b(names[1])}</>;
  if (names.length === 3) return <>{b(names[0])}<span className="font-normal">,</span> {b(names[1])}<span className="font-normal">, and</span> {b(names[2])}</>;
  return <>{b(names[0])}<span className="font-normal">,</span> {b(names[1])}<span className="font-normal">,</span> {b(names[2])}<span className="font-normal">...</span></>;
}
