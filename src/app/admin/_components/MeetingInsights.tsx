'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Circle,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import type { ActionItem, MeetingTranscriptRow } from '@/types/meetings';

interface Props {
  meetingId: string;
  transcript: MeetingTranscriptRow | null;
  onUpdate?: () => void;
}

export function MeetingInsights({ meetingId, transcript, onUpdate }: Props) {
  const [generating, startGenerate] = useTransition();
  const [summary, setSummary] = useState(transcript?.summary || null);
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    (transcript?.action_items as ActionItem[] | undefined) || [],
  );
  const [status, setStatus] = useState(transcript?.insights_status || 'none');
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  // Edit states
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [newItemDraft, setNewItemDraft] = useState('');

  const persist = useCallback(
    async (updates: { summary?: string; actionItems?: ActionItem[] }) => {
      try {
        await fetch('/api/admin/meetings/insights', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId, ...updates }),
        });
      } catch {
        console.error('Failed to save insights');
      }
    },
    [meetingId],
  );

  const handleGenerate = () => {
    startGenerate(async () => {
      setError(null);
      setStatus('pending');
      try {
        const res = await fetch('/api/admin/meetings/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to generate insights');
        }
        const data = await res.json();
        setSummary(data.summary);
        setActionItems(data.actionItems);
        setStatus('ready');
        onUpdate?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
        setStatus('failed');
      }
    });
  };

  // Auto-generate on first view if transcript exists but no insights
  useEffect(() => {
    if (autoTriggered.current) return;
    if (transcript && status === 'none' && !generating) {
      autoTriggered.current = true;
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, status]);

  // ── Summary editing ──
  const startEditSummary = () => {
    setSummaryDraft(summary || '');
    setEditingSummary(true);
  };
  const saveSummary = () => {
    setSummary(summaryDraft);
    setEditingSummary(false);
    persist({ summary: summaryDraft });
  };
  const cancelEditSummary = () => setEditingSummary(false);

  // ── Action item editing ──
  const startEditItem = (idx: number) => {
    setItemDraft(actionItems[idx].text);
    setEditingItemIdx(idx);
  };
  const saveEditItem = () => {
    if (editingItemIdx === null) return;
    const updated = actionItems.map((item, i) =>
      i === editingItemIdx ? { ...item, text: itemDraft } : item,
    );
    setActionItems(updated);
    setEditingItemIdx(null);
    persist({ actionItems: updated });
  };
  const cancelEditItem = () => setEditingItemIdx(null);

  const toggleItem = (index: number) => {
    const updated = actionItems.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item,
    );
    setActionItems(updated);
    persist({ actionItems: updated });
  };

  const deleteItem = (index: number) => {
    const updated = actionItems.filter((_, i) => i !== index);
    setActionItems(updated);
    persist({ actionItems: updated });
  };

  const addItem = () => {
    if (!newItemDraft.trim()) return;
    const updated = [...actionItems, { text: newItemDraft.trim(), assignee: null, done: false }];
    setActionItems(updated);
    setNewItemDraft('');
    setAddingItem(false);
    persist({ actionItems: updated });
  };

  // ── Empty states ──
  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Sparkles size={24} className="text-admin-text-ghost" />
        <p className="text-sm text-admin-text-secondary">
          Record a meeting to generate insights
        </p>
      </div>
    );
  }

  if (status === 'none' || (status === 'failed' && !summary)) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-4">
        <Sparkles size={24} className="text-admin-text-ghost" />
        <p className="text-sm text-admin-text-secondary">
          Use AI to extract a summary and action items from this transcript
        </p>
        {error && <p className="text-xs text-admin-danger">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary px-5 py-2.5 text-sm cursor-pointer"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>
    );
  }

  if (status === 'pending' && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Loader2 size={24} className="animate-spin text-admin-text-faint" />
        <p className="text-sm text-admin-text-secondary">Generating insights...</p>
      </div>
    );
  }

  // ── Has insights ──
  return (
    <div className="px-5 py-5 space-y-6">
      {/* Summary */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-admin-sm text-admin-text-placeholder uppercase tracking-wider font-medium">
            Summary
          </label>
          {!editingSummary && (
            <button
              onClick={startEditSummary}
              className="w-6 h-6 flex items-center justify-center rounded text-admin-text-ghost hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors cursor-pointer"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
        {editingSummary ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              rows={6}
              className="admin-input w-full px-3 py-2 text-sm resize-y"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={saveSummary} className="btn-primary px-3 py-1.5 text-xs cursor-pointer">
                <Check size={12} /> Save
              </button>
              <button onClick={cancelEditSummary} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-admin-text-secondary leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        )}
      </div>

      {/* Action Items */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-admin-sm text-admin-text-placeholder uppercase tracking-wider font-medium">
            Action Items ({actionItems.filter((i) => i.done).length}/{actionItems.length})
          </label>
        </div>
        <div className="mt-2 space-y-1">
          {actionItems.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-admin-bg-hover transition-colors group/item"
            >
              <button
                onClick={() => toggleItem(i)}
                className="flex-shrink-0 mt-0.5 cursor-pointer"
              >
                {item.done ? (
                  <CheckCircle2 size={16} className="text-admin-success" />
                ) : (
                  <Circle size={16} className="text-admin-text-faint" />
                )}
              </button>

              {editingItemIdx === i ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditItem();
                      if (e.key === 'Escape') cancelEditItem();
                    }}
                    className="admin-input flex-1 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button onClick={saveEditItem} className="w-6 h-6 flex items-center justify-center text-admin-success cursor-pointer">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEditItem} className="w-6 h-6 flex items-center justify-center text-admin-text-faint cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => startEditItem(i)}
                    className={`flex-1 text-sm cursor-text ${
                      item.done ? 'text-admin-text-faint line-through' : 'text-admin-text-primary'
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteItem(i)}
                    className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover/item:opacity-100 text-admin-text-ghost hover:text-admin-danger hover:bg-admin-danger-bg transition-all cursor-pointer flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add new item */}
          {addingItem ? (
            <div className="flex items-center gap-1.5 px-3 py-2">
              <Circle size={16} className="text-admin-text-faint flex-shrink-0" />
              <input
                value={newItemDraft}
                onChange={(e) => setNewItemDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addItem();
                  if (e.key === 'Escape') { setAddingItem(false); setNewItemDraft(''); }
                }}
                placeholder="New action item..."
                className="admin-input flex-1 px-2 py-1 text-sm"
                autoFocus
              />
              <button onClick={addItem} className="w-6 h-6 flex items-center justify-center text-admin-success cursor-pointer">
                <Check size={14} />
              </button>
              <button onClick={() => { setAddingItem(false); setNewItemDraft(''); }} className="w-6 h-6 flex items-center justify-center text-admin-text-faint cursor-pointer">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-admin-text-faint hover:text-admin-text-secondary transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Add item
            </button>
          )}
        </div>
      </div>

      {/* Regenerate */}
      <div className="pt-2">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-secondary px-4 py-2 text-sm cursor-pointer"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>
    </div>
  );
}
