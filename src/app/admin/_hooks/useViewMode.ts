'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Persist a view-mode key to localStorage with SSR-safe hydration.
 * Returns [activeView, setActiveView].
 */
export function useViewMode<K extends string>(
  storageKey: string,
  defaultView: K,
): [K, (v: K) => void] {
  const [view, setViewRaw] = useState<K>(() => {
    if (typeof window === 'undefined') return defaultView;
    return (localStorage.getItem(storageKey) as K) || defaultView;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, view);
  }, [storageKey, view]);

  const setView = useCallback((v: K) => setViewRaw(v), []);

  return [view, setView];
}
