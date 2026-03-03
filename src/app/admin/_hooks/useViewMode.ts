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
  const [view, setViewRaw] = useState<K>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as K | null;
    if (stored && stored !== view) setViewRaw(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, view);
  }, [storageKey, view]);

  const setView = useCallback((v: K) => setViewRaw(v), []);

  return [view, setView];
}
