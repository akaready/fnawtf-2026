'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastVariant = 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  detail?: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  showError: (message: string, detail?: string) => void;
  showInfo: (message: string, opts?: { detail?: string; action?: { label: string; onClick: () => void }; duration?: number }) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useAdminToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useAdminToast must be used inside ToastProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Individual toast — handles its own auto-dismiss                    */
/* ------------------------------------------------------------------ */

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const isError = toast.variant === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: 56 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 56 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-center gap-3 bg-admin-bg-overlay border border-admin-border rounded-admin-xl shadow-xl backdrop-blur-sm pl-4 pr-3 py-4 border-l-2 ${isError ? 'border-l-admin-danger' : 'border-l-admin-info'}`}
    >
      {isError && <AlertCircle className="w-4 h-4 text-admin-danger flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-admin-sm font-admin-body font-medium text-admin-text-primary leading-snug">{toast.message}</p>
        {toast.detail && (
          <p className="text-admin-sm font-admin-body text-admin-text-muted mt-0.5 leading-snug">{toast.detail}</p>
        )}
      </div>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onDismiss(toast.id); }}
          className="text-admin-sm font-medium text-admin-info hover:text-admin-text-primary transition-colors flex-shrink-0 px-2 py-1 rounded-admin-sm hover:bg-admin-bg-hover"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="w-7 h-7 flex items-center justify-center text-admin-text-faint hover:text-admin-text-primary transition-colors flex-shrink-0 rounded-admin-sm hover:bg-admin-bg-hover"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showError = useCallback((message: string, detail?: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, detail, variant: 'error' }]);
  }, []);

  const showInfo = useCallback((message: string, opts?: { detail?: string; action?: { label: string; onClick: () => void }; duration?: number }) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, detail: opts?.detail, variant: 'info', action: opts?.action, duration: opts?.duration }]);
    return id;
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showError, showInfo, dismiss }}>
      {children}
      {/* Toast stack — aligned with header button row (top-6 centers at ~56px, matching h-[7rem] header midpoint) */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
