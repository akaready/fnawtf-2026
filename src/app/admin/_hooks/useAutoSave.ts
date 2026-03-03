import { useState, useRef, useCallback, useEffect } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function useAutoSave(
  saveFn: () => Promise<void>,
  options?: { delay?: number },
) {
  const delay = options?.delay ?? 600;
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hasPendingRef = useRef(false);
  const saveFnRef = useRef(saveFn);

  // Keep saveFn ref current so flush always uses the latest closure
  useEffect(() => { saveFnRef.current = saveFn; });

  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);
    clearTimeout(savedTimerRef.current);
    hasPendingRef.current = false;
    setStatus('saving');
    try {
      await saveFnRef.current();
      setStatus('saved');
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }, []);

  const trigger = useCallback(() => {
    clearTimeout(timerRef.current);
    hasPendingRef.current = true;
    setStatus('pending');
    timerRef.current = setTimeout(() => {
      void flush();
    }, delay);
  }, [delay, flush]);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(savedTimerRef.current);
    hasPendingRef.current = false;
    setStatus('idle');
  }, []);

  // Auto-flush on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (hasPendingRef.current) {
        clearTimeout(timerRef.current);
        void saveFnRef.current();
      }
      clearTimeout(savedTimerRef.current);
    };
  }, []);

  return {
    status,
    hasPending: status === 'pending',
    trigger,
    flush,
    reset,
  };
}
