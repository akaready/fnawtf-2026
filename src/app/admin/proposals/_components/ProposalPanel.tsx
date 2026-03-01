'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { ProposalAdminEditor } from './ProposalAdminEditor';
import type { ProposalEditorHandle } from './ProposalAdminEditor';
import {
  getProposal,
  getProposalSections,
  getProposalMilestones,
  getProposalQuotes,
  getProposalProjects,
  getContentSnippets,
  getContacts,
  getProjectsForBrowser,
  getProposalContacts,
  getClients,
  type ClientRow,
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
  proposalContacts: (ContactRow & { pivot_id: string })[];
  clients: ClientRow[];
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
  const editorRef = useRef<ProposalEditorHandle>(null);
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.tryClose();
    } else {
      onClose();
    }
  }, [onClose]);

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
      getProposalContacts(proposalId),
      getClients(),
    ]).then(([proposal, sections, milestones, quotes, proposalProjects, snippets, contacts, allProjects, proposalContacts, clients]) => {
      setData({
        proposal,
        sections,
        milestones,
        quotes: quotes.filter((q) => !q.deleted_at),
        proposalProjects,
        snippets,
        contacts,
        allProjects,
        proposalContacts,
        clients,
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
    <PanelDrawer open={open} onClose={handleClose} width="w-[min(92vw,840px)]">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-admin-border-emphasis border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
      {!loading && data && (
        <ProposalAdminEditor
          ref={editorRef}
          proposal={data.proposal}
          contacts={data.contacts}
          proposalContacts={data.proposalContacts}
          clients={data.clients}
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
