'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Hard redirect — full page load sends the cookies the browser client just set
    window.location.href = '/admin/projects';
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 transition-colors';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-7">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-[#2a2a2a] flex items-center justify-center mb-5">
              <Lock size={16} className="text-muted-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">Admin Login</h1>
            <p className="text-sm text-muted-foreground mt-1">Friends &rsquo;n Allies Team Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ready@fna.wtf"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400/80">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
