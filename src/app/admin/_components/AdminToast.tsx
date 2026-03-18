'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Toast {
  id: number;
  message: string;
  detail?: string;
}

interface ToastContextValue {
  showError: (message: string, detail?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useAdminToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useAdminToast must be used inside ToastProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showError = useCallback((message: string, detail?: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, detail }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {/* Toast stack — top-right, above everything */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 bg-admin-bg-overlay border border-admin-danger/40 rounded-admin-lg shadow-lg px-4 py-3 animate-in slide-in-from-right"
            >
              <AlertCircle className="w-5 h-5 text-admin-danger flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-admin-sm font-admin-body font-medium text-admin-text-primary">{t.message}</p>
                {t.detail && (
                  <p className="text-admin-sm font-admin-body text-admin-text-muted mt-1">{t.detail}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="w-8 h-8 flex items-center justify-center text-admin-text-muted hover:text-admin-text-primary transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
