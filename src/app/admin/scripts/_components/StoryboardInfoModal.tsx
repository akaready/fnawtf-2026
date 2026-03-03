'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2 } from 'lucide-react';
import type { AiPromptLogRow } from '@/types/scripts';
import { getPromptLogForBeat } from '@/app/admin/actions';

interface Props {
  beatId: string;
  onClose: () => void;
  onRegenerate: (editedPrompt: string) => void;
}

export function StoryboardInfoModal({ beatId, onClose, onRegenerate }: Props) {
  const [log, setLog] = useState<AiPromptLogRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [regenerating, setRegenrating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPromptLogForBeat(beatId).then((data) => {
      if (cancelled) return;
      setLog(data);
      setEditedPrompt(data?.prompt_text ?? '');
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [beatId]);

  const promptChanged = log ? editedPrompt !== log.prompt_text : false;

  const handleRegenerate = () => {
    setRegenrating(true);
    onRegenerate(editedPrompt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-admin-bg-overlay border border-admin-border rounded-admin-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border flex-shrink-0">
          <h2 className="text-base font-semibold text-admin-text-primary">Generation Details</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-admin-text-ghost" />
          </div>
        ) : !log ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-admin-text-faint">
            <p className="text-sm">No generation data found for this beat</p>
            <p className="text-xs mt-1">Generate a frame first to see prompt details</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto admin-scrollbar-auto px-5 py-4 space-y-4">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-admin-bg-base rounded-admin-sm px-3 py-2 border border-admin-border-subtle">
                <div className="text-xs text-admin-text-faint uppercase tracking-wider">Model</div>
                <div className="text-sm font-admin-mono text-admin-text-primary mt-0.5">{log.model}</div>
              </div>
              <div className="bg-admin-bg-base rounded-admin-sm px-3 py-2 border border-admin-border-subtle">
                <div className="text-xs text-admin-text-faint uppercase tracking-wider">Input</div>
                <div className="text-sm text-admin-text-primary mt-0.5">{log.input_tokens ?? '-'}</div>
              </div>
              <div className="bg-admin-bg-base rounded-admin-sm px-3 py-2 border border-admin-border-subtle">
                <div className="text-xs text-admin-text-faint uppercase tracking-wider">Output</div>
                <div className="text-sm text-admin-text-primary mt-0.5">{log.output_tokens ?? '-'}</div>
              </div>
              {log.cost_estimate != null && (
                <div className="bg-admin-bg-base rounded-admin-sm px-3 py-2 border border-admin-border-subtle">
                  <div className="text-xs text-admin-text-faint uppercase tracking-wider">Cost</div>
                  <div className="text-sm text-admin-text-primary mt-0.5">${Number(log.cost_estimate).toFixed(4)}</div>
                </div>
              )}
              <div className="bg-admin-bg-base rounded-admin-sm px-3 py-2 border border-admin-border-subtle">
                <div className="text-xs text-admin-text-faint uppercase tracking-wider">Duration</div>
                <div className="text-sm text-admin-text-primary mt-0.5">
                  {log.duration_ms != null ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                </div>
              </div>
              <div className="bg-admin-bg-base rounded-admin-sm px-3 py-2 border border-admin-border-subtle">
                <div className="text-xs text-admin-text-faint uppercase tracking-wider">Status</div>
                <div className={`text-xs mt-0.5 font-medium ${log.status === 'success' ? 'text-admin-success' : 'text-admin-danger'}`}>
                  {log.status}
                </div>
              </div>
            </div>

            {/* Response summary */}
            {log.response_summary && (
              <div>
                <h4 className="text-sm font-semibold text-admin-text-muted mb-1.5">Response</h4>
                <p className="text-sm text-admin-text-primary bg-admin-bg-base border border-admin-border rounded-admin-md p-3">
                  {log.response_summary}
                </p>
              </div>
            )}

            {/* Generated image */}
            {log.image_url && (
              <div>
                <h4 className="text-sm font-semibold text-admin-text-muted mb-1.5">Generated Image</h4>
                <img
                  src={log.image_url}
                  alt=""
                  className="max-w-full rounded-admin-md border border-admin-border"
                />
              </div>
            )}

            {/* Editable prompt */}
            <div>
              <h4 className="text-sm font-semibold text-admin-text-muted mb-1.5">Prompt</h4>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="admin-input w-full text-sm font-admin-mono min-h-[200px] resize-y"
              />
            </div>
          </div>
        )}

        {/* Footer actions */}
        {log && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-admin-border flex-shrink-0">
            <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs">
              Close
            </button>
            {promptChanged && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-2"
              >
                {regenerating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
