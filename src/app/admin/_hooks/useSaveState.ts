import { useState, useRef, useCallback, useEffect } from 'react';

export function useSaveState(clearAfter = 3000) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const wrap = useCallback(async (fn: () => Promise<void>) => {
    setSaving(true);
    try {
      await fn();
      setSaved(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSaved(false), clearAfter);
    } finally {
      setSaving(false);
    }
  }, [clearAfter]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { saving, saved, wrap };
}
