'use client';

import { useState, useEffect } from 'react';
import { GitMerge, X } from 'lucide-react';

export interface MergeItem {
  id: string;
  label: string;
  /** e.g. "12 projects" — parsed for best-candidate suggestion */
  detail?: string;
  createdAt?: string;
}

interface MergeDialogProps {
  items: MergeItem[];
  onMerge: (sourceIds: string[], targetId: string) => void;
  onClose: () => void;
  isPending?: boolean;
  title?: string;
  consequenceText?: string;
}

/** Pick the best default merge target: highest detail count, then oldest. */
function pickBestCandidate(items: MergeItem[]): string {
  if (items.length === 0) return '';
  let best = items[0];
  let bestCount = parseDetailCount(best.detail);

  for (let i = 1; i < items.length; i++) {
    const count = parseDetailCount(items[i].detail);
    if (
      count > bestCount ||
      (count === bestCount && items[i].createdAt && best.createdAt && items[i].createdAt! < best.createdAt!)
    ) {
      best = items[i];
      bestCount = count;
    }
  }
  return best.id;
}

function parseDetailCount(detail?: string): number {
  if (!detail) return 0;
  const match = detail.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function MergeDialog({
  items,
  onMerge,
  onClose,
  isPending = false,
  title = 'Merge',
  consequenceText,
}: MergeDialogProps) {
  const [targetId, setTargetId] = useState(() => pickBestCandidate(items));

  // Sync if items change
  useEffect(() => {
    setTargetId(pickBestCandidate(items));
  }, [items]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-admin-bg-overlay border border-admin-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border-subtle">
          <h2 className="text-lg font-semibold text-admin-text-primary">{title}</h2>
          <button onClick={onClose} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Selected items chips */}
          <div>
            <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Merging</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-admin-bg-hover border border-admin-border text-sm text-admin-text-primary">
                  {item.label}
                  {item.detail && <span className="text-xs text-admin-text-muted">{item.detail}</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Keep-as radio list */}
          <div>
            <p className="text-xs text-admin-text-faint uppercase tracking-wider mb-2">Keep as</p>
            <div className="space-y-1.5">
              {items.map((item) => (
                <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-admin-bg-hover transition-colors">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${targetId === item.id ? 'border-admin-text-primary bg-admin-text-primary' : 'border-admin-border'}`}>
                    {targetId === item.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <input type="radio" className="sr-only" value={item.id} checked={targetId === item.id} onChange={() => setTargetId(item.id)} />
                  <span className="text-sm text-admin-text-primary flex-1">{item.label}</span>
                  {item.detail && <span className="text-xs text-admin-text-muted">{item.detail}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Consequence text */}
          {consequenceText && (
            <p className="text-xs text-admin-text-muted px-3 py-2 rounded-lg bg-admin-bg-subtle border border-admin-border">
              {consequenceText}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-admin-border-subtle">
          <button onClick={onClose} disabled={isPending} className="btn-secondary px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button
            disabled={isPending || !targetId}
            onClick={() => onMerge(items.filter((i) => i.id !== targetId).map((i) => i.id), targetId)}
            className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed"
          >
            <GitMerge size={13} />
            {isPending ? 'Merging\u2026' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}
