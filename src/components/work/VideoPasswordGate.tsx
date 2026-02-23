'use client';

import { useState, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';

interface VideoPasswordGateProps {
  videoSrc: string;
  placeholderSrc?: string;
  password: string;
  hoverPreview?: boolean;
  aspectRatio?: string;
}

export function VideoPasswordGate({ videoSrc, placeholderSrc, password, hoverPreview, aspectRatio }: VideoPasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === password) {
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setInput('');
      setTimeout(() => setShaking(false), 450);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (unlocked) {
    return (
      <ReelPlayer videoSrc={videoSrc} placeholderSrc={placeholderSrc} defaultMuted={false} hoverPreview={hoverPreview} aspectRatio={aspectRatio} />
    );
  }

  return (
    <div className="relative">
      {/* Poster-only placeholder while locked */}
      <div
        className="w-full rounded-lg overflow-hidden"
        style={{ aspectRatio: aspectRatio ?? '16/9', background: '#000' }}
      >
        {placeholderSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={placeholderSrc}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-40"
          />
        )}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
        <div
          className={`flex flex-col items-center gap-5 px-6${shaking ? ' vpg-shake' : ''}`}
        >
          {/* Lock icon */}
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white/70" strokeWidth={1.5} />
          </div>

          {password ? (
            <>
              <div className="text-center">
                <p className="text-white font-display font-bold text-lg">Password Protected</p>
                <p className="text-white/40 text-sm mt-1">Enter the password to watch this video</p>
              </div>

              {/* Password form */}
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
                <div className="relative w-full">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(false); }}
                    placeholder="Enter password"
                    autoComplete="off"
                    className={`w-full bg-white/10 border rounded px-4 py-2.5 pr-10 text-white placeholder-white/30 text-sm outline-none focus:bg-white/15 transition-colors ${
                      error ? 'border-red-500/70' : 'border-white/20 focus:border-white/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-red-400 text-xs -mt-1">Incorrect password. Try again.</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-white font-medium text-sm py-2.5 rounded transition-colors"
                >
                  Unlock Video
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-white font-display font-bold text-lg">Private</p>
              <p className="text-white/40 text-sm mt-1">This video is available to clients only</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes vpg-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .vpg-shake { animation: vpg-shake 0.45s ease-in-out; }
      `}</style>
    </div>
  );
}
