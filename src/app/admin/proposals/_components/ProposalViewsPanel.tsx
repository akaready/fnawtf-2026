'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { getProposalViews, getProposalQuotes } from '@/app/admin/actions';
import { ViewsTab } from './tabs/ViewsTab';
import type { ProposalViewRow } from '@/app/admin/actions';
import type { ProposalQuoteRow } from '@/types/proposal';

interface ProposalViewsPanelProps {
  proposalId: string | null;
  proposalTitle?: string;
  open: boolean;
  onClose: () => void;
}

export function ProposalViewsPanel({ proposalId, proposalTitle, open, onClose }: ProposalViewsPanelProps) {
  const [views, setViews] = useState<ProposalViewRow[]>([]);
  const [quotes, setQuotes] = useState<ProposalQuoteRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!proposalId || !open) return;
    setLoading(true);
    Promise.all([
      getProposalViews(proposalId),
      getProposalQuotes(proposalId),
    ]).then(([v, q]) => {
      setViews(v);
      setQuotes(q);
    }).finally(() => setLoading(false));
  }, [proposalId, open]);

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[480px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-bg-sidebar">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-admin-text-primary truncate">Views</h2>
            {proposalTitle && (
              <p className="text-xs text-admin-text-muted truncate mt-0.5">{proposalTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto admin-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-admin-text-faint" />
            </div>
          ) : (
            <ViewsTab views={views} quotes={quotes} />
          )}
        </div>
      </div>
    </PanelDrawer>
  );
}
