'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { saveProjectCredits } from '../actions';

interface Credit {
  role: string;
  name: string;
  sort_order: number;
}

interface Props {
  projectId: string;
  initialCredits: Credit[];
}

const inputClass =
  'w-full px-3 py-2 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 transition-colors';

export function CreditsTab({ projectId, initialCredits }: Props) {
  const [credits, setCredits] = useState<Credit[]>(
    initialCredits.length
      ? initialCredits
      : []
  );
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const update = (index: number, key: keyof Credit, value: string | number) => {
    setCredits((prev) => prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
    if (status !== 'idle') setStatus('idle');
  };

  const add = () => {
    setCredits((prev) => [...prev, { role: '', name: '', sort_order: prev.length }]);
  };

  const remove = (index: number) => {
    setCredits((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort_order: i })));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...credits];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCredits(next.map((c, i) => ({ ...c, sort_order: i })));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveProjectCredits(projectId, credits);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2500);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    });
  };

  return (
    <div className="space-y-4">
      {credits.length === 0 ? (
        <p className="text-sm text-muted-foreground/50 py-4">No credits yet.</p>
      ) : (
        <div className="space-y-2">
          {credits.map((credit, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 border border-border/40 rounded-lg bg-white/[0.02]"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === credits.length - 1}
                  className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <input
                type="text"
                value={credit.role}
                onChange={(e) => update(i, 'role', e.target.value)}
                placeholder="Role"
                className={`${inputClass} max-w-40`}
              />
              <input
                type="text"
                value={credit.name}
                onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="Full Name"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus size={14} /> Add credit
      </button>

      <div className="flex items-center gap-3 pt-2 border-t border-border/20">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save Credits'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-400">Saved</span>}
        {status === 'error' && <span className="text-sm text-red-400">Save failed</span>}
      </div>
    </div>
  );
}
