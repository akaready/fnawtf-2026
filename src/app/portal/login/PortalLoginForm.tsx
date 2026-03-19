'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { loginToPortal } from '@/lib/portal/portalActions';

export function PortalLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit = email.trim() && accessCode.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) return;

    startTransition(async () => {
      const result = await loginToPortal(email.trim(), accessCode.trim());
      if (!result.success) {
        setError(result.error ?? 'Invalid access code.');
        return;
      }

      router.push('/portal');
    });
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Client Portal
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Friends &amp; Allies
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="accessCode" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Access Code
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter your access code"
              autoComplete="off"
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className={`relative w-full px-4 py-3 font-medium rounded-lg overflow-hidden border transition-all duration-300 ${
              canSubmit
                ? 'text-black bg-white border-white cursor-pointer hover:bg-white/90'
                : 'text-muted-foreground bg-white/5 border-border cursor-not-allowed'
            } disabled:opacity-60`}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Verifying…
              </span>
            ) : (
              'Access Portal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
