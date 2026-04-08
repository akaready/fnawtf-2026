'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { verifyScriptShareAccess } from '../actions';

interface Props {
  token: string;
  scriptTitle: string;
  clientName: string;
  requireAccessCode?: boolean;
}

export function ScriptLoginForm({ token, scriptTitle, clientName, requireAccessCode = false }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && (!requireAccessCode || password.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) return;

    startTransition(async () => {
      const result = await verifyScriptShareAccess(token, email.trim(), password.trim(), firstName.trim(), lastName.trim());
      if (!result.success) {
        setError(result.error ?? 'Unable to verify access.');
        return;
      }

      // Navigate via synthetic link click for page transition
      const link = document.createElement('a');
      link.href = `/s/${token}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          {clientName && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Script for {clientName}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold text-foreground">
            {scriptTitle}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
                autoComplete="given-name"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                autoComplete="family-name"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Your Email
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

          {requireAccessCode && (
            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Access Code
              </label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your access code"
                autoComplete="off"
                className={inputCls}
              />
            </div>
          )}

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
                Verifying...
              </span>
            ) : (
              'View Script'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
