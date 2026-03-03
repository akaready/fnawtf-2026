'use client';

import { useState, useEffect, useCallback } from 'react';
import { Terminal, CheckCircle2, XCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { getPromptLogs } from '@/app/admin/actions';
import type { AiPromptLogRow } from '@/types/scripts';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export default function PromptLogPage() {
  const [logs, setLogs] = useState<AiPromptLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [sourceOpen, setSourceOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromptLogs({
        source: sourceFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const sourceOptions = ['', 'storyboard'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Prompt Log"
        icon={Terminal}
        subtitle="AI generation history"
      />

      {/* Toolbar */}
      <div className="h-[3rem] bg-admin-bg-inset border-b border-admin-border flex-shrink-0 flex items-center px-4 gap-3">
        {/* Source filter */}
        <div className="relative">
          <button
            onClick={() => setSourceOpen(!sourceOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-admin-sm bg-admin-bg-base border border-admin-border text-admin-text-muted hover:text-admin-text-primary transition-colors"
          >
            <Terminal size={12} />
            <span>{sourceFilter || 'All sources'}</span>
            <ChevronDown size={10} />
          </button>
          {sourceOpen && (
            <div className="absolute top-full mt-1 left-0 z-20 bg-admin-bg-overlay border border-admin-border rounded-admin-md shadow-lg py-1 min-w-[140px]">
              {sourceOptions.map((opt) => (
                <button
                  key={opt || '__all'}
                  onClick={() => { setSourceFilter(opt); setSourceOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    sourceFilter === opt
                      ? 'text-admin-text-primary bg-admin-bg-active'
                      : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                  }`}
                >
                  {opt || 'All sources'}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-admin-text-faint">
          {logs.length} entries
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto admin-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-admin-text-ghost" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-admin-text-faint">
            <Terminal size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No prompt logs yet</p>
            <p className="text-xs mt-1">Generate a storyboard frame to see entries here</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border text-admin-text-muted text-xs">
                <th className="text-left px-4 py-2 w-8"></th>
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-left px-3 py-2">Source</th>
                <th className="text-left px-3 py-2">Model</th>
                <th className="text-left px-3 py-2">Prompt</th>
                <th className="text-right px-3 py-2">Tokens</th>
                <th className="text-right px-3 py-2">Cost</th>
                <th className="text-right px-3 py-2">Duration</th>
                <th className="text-center px-3 py-2">Status</th>
                <th className="text-center px-3 py-2 w-16">Image</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const expanded = expandedId === log.id;
                return (
                  <tr key={log.id} className="group/row">
                    {/* Summary row */}
                    <td
                      colSpan={10}
                      className="p-0"
                    >
                      <button
                        onClick={() => setExpandedId(expanded ? null : log.id)}
                        className="w-full text-left flex items-center border-b border-admin-border-subtle hover:bg-admin-bg-hover transition-colors"
                      >
                        <span className="px-4 py-2.5 w-8 flex-shrink-0">
                          {expanded
                            ? <ChevronDown size={12} className="text-admin-text-faint" />
                            : <ChevronRight size={12} className="text-admin-text-faint" />}
                        </span>
                        <span className="px-3 py-2.5 w-[90px] flex-shrink-0 text-xs text-admin-text-muted whitespace-nowrap">
                          {relativeTime(log.created_at)}
                        </span>
                        <span className="px-3 py-2.5 w-[100px] flex-shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded-admin-full text-[10px] font-medium bg-admin-info-bg text-admin-info">
                            {log.source}
                          </span>
                        </span>
                        <span className="px-3 py-2.5 w-[180px] flex-shrink-0 font-admin-mono text-xs text-admin-text-muted truncate">
                          {log.model}
                        </span>
                        <span className="px-3 py-2.5 flex-1 min-w-0 text-xs text-admin-text-primary truncate">
                          {truncate(log.prompt_text, 80)}
                        </span>
                        <span className="px-3 py-2.5 w-[100px] flex-shrink-0 text-right text-xs text-admin-text-muted whitespace-nowrap">
                          {log.input_tokens != null && log.output_tokens != null
                            ? `${log.input_tokens} / ${log.output_tokens}`
                            : '-'}
                        </span>
                        <span className="px-3 py-2.5 w-[80px] flex-shrink-0 text-right text-xs text-admin-text-muted">
                          {log.cost_estimate != null ? `$${Number(log.cost_estimate).toFixed(4)}` : '-'}
                        </span>
                        <span className="px-3 py-2.5 w-[80px] flex-shrink-0 text-right text-xs text-admin-text-muted">
                          {log.duration_ms != null ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                        </span>
                        <span className="px-3 py-2.5 w-[70px] flex-shrink-0 text-center">
                          {log.status === 'success' ? (
                            <CheckCircle2 size={14} className="inline text-admin-success" />
                          ) : (
                            <XCircle size={14} className="inline text-admin-danger" />
                          )}
                        </span>
                        <span className="px-3 py-2.5 w-16 flex-shrink-0 text-center">
                          {log.image_url ? (
                            <img
                              src={log.image_url}
                              alt=""
                              className="w-10 h-6 object-cover rounded inline-block"
                            />
                          ) : (
                            <span className="text-admin-text-ghost text-xs">-</span>
                          )}
                        </span>
                      </button>

                      {/* Expanded details */}
                      {expanded && (
                        <div className="border-b border-admin-border bg-admin-bg-inset px-6 py-4 space-y-4">
                          {/* Full prompt */}
                          <div>
                            <h4 className="text-xs font-semibold text-admin-text-muted mb-1.5">Full Prompt</h4>
                            <pre className="text-xs text-admin-text-primary bg-admin-bg-base border border-admin-border rounded-admin-md p-3 whitespace-pre-wrap max-h-[300px] overflow-y-auto admin-scrollbar-auto font-admin-mono">
                              {log.prompt_text}
                            </pre>
                          </div>

                          {/* Response summary */}
                          {log.response_summary && (
                            <div>
                              <h4 className="text-xs font-semibold text-admin-text-muted mb-1.5">Response Summary</h4>
                              <p className="text-xs text-admin-text-primary bg-admin-bg-base border border-admin-border rounded-admin-md p-3">
                                {log.response_summary}
                              </p>
                            </div>
                          )}

                          {/* Larger image */}
                          {log.image_url && (
                            <div>
                              <h4 className="text-xs font-semibold text-admin-text-muted mb-1.5">Generated Image</h4>
                              <img
                                src={log.image_url}
                                alt=""
                                className="max-w-md rounded-admin-md border border-admin-border"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
