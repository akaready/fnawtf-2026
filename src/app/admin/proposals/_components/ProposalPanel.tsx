'use client';

import { useState, useEffect } from 'react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { ProposalAdminEditor } from './ProposalAdminEditor';
import {
  getProposal,
  getProposalSections,
  getProposalMilestones,
  getProposalQuotes,
  getProposalProjects,
  getContentSnippets,
  getContacts,
  getProjectsForBrowser,
} from '@/app/admin/actions';
import type {
  ProposalRow,
  ContactRow,
  ContentSnippetRow,
  ProposalSectionRow,
  ProposalMilestoneRow,
  ProposalQuoteRow,
  BrowserProject,
  ProposalProjectWithProject,
} from '@/types/proposal';

interface PanelData {
  proposal: ProposalRow;
  contacts: ContactRow[];
  snippets: ContentSnippetRow[];
  sections: ProposalSectionRow[];
  milestones: ProposalMilestoneRow[];
  quotes: ProposalQuoteRow[];
  allProjects: BrowserProject[];
  proposalProjects: ProposalProjectWithProject[];
}

interface ProposalPanelProps {
  proposalId: string | null;
  open: boolean;
  onClose: () => void;
  onProposalUpdated?: (proposal: ProposalRow) => void;
  onProposalDeleted?: (id: string) => void;
}

export function ProposalPanel({ proposalId, open, onClose, onProposalUpdated, onProposalDeleted }: ProposalPanelProps) {
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId || proposalId === loadedFor) return;
    setLoading(true);
    setData(null);
    Promise.all([
      getProposal(proposalId),
      getProposalSections(proposalId),
      getProposalMilestones(proposalId),
      getProposalQuotes(proposalId),
      getProposalProjects(proposalId),
      getContentSnippets(),
      getContacts(),
      getProjectsForBrowser(),
    ]).then(([proposal, sections, milestones, quotes, proposalProjects, snippets, contacts, allProjects]) => {
      setData({
        proposal,
        sections,
        milestones,
        quotes: quotes.filter((q) => !q.deleted_at),
        proposalProjects,
        snippets,
        contacts,
        allProjects,
      });
      setLoadedFor(proposalId);
      if (onProposalUpdated) onProposalUpdated(proposal);
    }).finally(() => setLoading(false));
  }, [proposalId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when panel closes
  useEffect(() => {
    if (!open) {
      setLoadedFor(null);
      setData(null);
    }
  }, [open]);

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[min(92vw,840px)]">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
      {!loading && data && (
        <ProposalAdminEditor
          proposal={data.proposal}
          contacts={data.contacts}
          snippets={data.snippets}
          sections={data.sections}
          milestones={data.milestones}
          quotes={data.quotes}
          allProjects={data.allProjects}
          proposalProjects={data.proposalProjects}
          onClose={onClose}
          onDelete={onProposalDeleted}
        />
      )}
    </PanelDrawer>
  );
}
