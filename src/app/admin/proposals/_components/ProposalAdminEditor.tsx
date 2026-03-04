'use client';

import { Fragment, useState, useTransition, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X, ExternalLink, Check, Loader2, Trash2, Home, Hand, GitBranch, Calendar, Play, DollarSign, Save, Eye, ChevronDown } from 'lucide-react';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import type { LucideIcon } from 'lucide-react';
import { deleteProposal, updateProposal, type ClientRow } from '@/app/admin/actions';
import { DetailsTab } from './tabs/DetailsTab';
import type { DetailsTabHandle } from './tabs/DetailsTab';
import { WelcomeTab } from './tabs/WelcomeTab';
import type { WelcomeTabHandle } from './tabs/WelcomeTab';
import { ApproachTab } from './tabs/ApproachTab';
import type { ApproachTabHandle } from './tabs/ApproachTab';
import { TimelineTab } from './tabs/TimelineTab';
import { SamplesTab } from './tabs/SamplesTab';
import { PricingTab } from './tabs/PricingTab';
import type { PricingTabHandle } from './tabs/PricingTab';
import type {
  ProposalRow, ContactRow, ContentSnippetRow, ProposalSectionRow,
  ProposalMilestoneRow, ProposalQuoteRow, BrowserProject, ProposalProjectWithProject,
} from '@/types/proposal';

const TABS = ['details', 'welcome', 'approach', 'timeline', 'samples', 'pricing'] as const;
type TabId = typeof TABS[number];

const TAB_ICONS: Record<TabId, LucideIcon> = {
  details: Home,
  welcome: Hand,
  approach: GitBranch,
  timeline: Calendar,
  samples: Play,
  pricing: DollarSign,
};

export interface ProposalEditorHandle {
  tryClose: () => void;
}

interface Props {
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
  viewCount?: number;
  onClose?: () => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-admin-bg-active text-admin-text-dim',
  sent: 'bg-admin-info-bg text-admin-info',
  viewed: 'bg-admin-warning-bg text-admin-warning',
  accepted: 'bg-admin-success-bg text-admin-success',
};

export const ProposalAdminEditor = forwardRef<ProposalEditorHandle, Props>(function ProposalAdminEditor({
  proposal: initialProposal, contacts, proposalContacts, clients, snippets, sections: initialSections,
  milestones, quotes, allProjects, proposalProjects, viewCount = 0, onClose, onDelete,
}, editorRef) {
  const [proposal] = useState(initialProposal);
  const [proposalType, setProposalType] = useState(initialProposal.proposal_type);
  const [sections, setSections] = useState(initialSections);
  const [status, setStatus] = useState(initialProposal.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [isDeleting, startDelete] = useTransition();
  const detailsRef = useRef<DetailsTabHandle>(null);
  const welcomeRef = useRef<WelcomeTabHandle>(null);
  const approachRef = useRef<ApproachTabHandle>(null);
  const pricingRef = useRef<PricingTabHandle>(null);
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const autoSave = useAutoSave(async () => {
    await Promise.all([
      detailsRef.current?.save(),
      welcomeRef.current?.save(),
      approachRef.current?.save(),
      pricingRef.current?.save(),
    ]);
  });
  const handleDirty = useCallback(() => autoSave.trigger(), [autoSave]);

  const handleStatusChange = useCallback(async (newStatus: 'draft' | 'sent') => {
    setStatus(newStatus);
    setStatusOpen(false);
    await updateProposal(proposal.id, { status: newStatus });
  }, [proposal.id]);

  const handleClose = useCallback(() => {
    const dirty = autoSave.hasPending || [
      detailsRef.current?.isDirty,
      welcomeRef.current?.isDirty,
      approachRef.current?.isDirty,
      pricingRef.current?.isDirty,
    ].some(Boolean);

    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose?.();
    }
  }, [onClose, autoSave.hasPending]);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  useImperativeHandle(editorRef, () => ({ tryClose: handleClose }), [handleClose]);

  function handleDelete() {
    startDelete(async () => {
      await deleteProposal(proposal.id);
      onDelete?.(proposal.id);
      onClose?.();
    });
  }

  function handleUpdated() {
    // no-op: panel owns the data lifecycle
  }

  const welcomeSection = sections.find(s => s.sort_order === 0 && s.section_type === 'text') ?? null;
  const approachSection = sections.find(s => s.sort_order === 1 && s.section_type === 'text') ?? null;
  const activeQuotes = quotes.filter(q => !q.deleted_at);

  return (
    <div className="flex flex-col h-full relative">
      <DiscardChangesDialog
        open={confirmClose}
        onKeepEditing={() => setConfirmClose(false)}
        onDiscard={() => { setConfirmClose(false); autoSave.reset(); onClose?.(); }}
      />

      {/* Header: title + meta (left) | views + status + X (right) */}
      <div className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-admin-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{proposal.title}</h1>
            <p className="text-sm mt-1 text-admin-text-muted font-mono truncate">
              /p/{proposal.slug}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5">
            <SaveDot status={autoSave.status} />
            <span className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs whitespace-nowrap ${
              viewCount > 0 ? 'bg-admin-bg-selected text-admin-text-dim' : 'bg-admin-bg-selected text-admin-text-ghost'
            }`}>
              <Eye size={11} />
              {viewCount} {viewCount === 1 ? 'view' : 'views'}
            </span>
            <span className={`px-4 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_BADGE[status] ?? STATUS_BADGE.draft}`}>
              {status}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-8 py-3 border-b border-admin-border bg-admin-bg-wash">
        <nav className="inline-flex flex-wrap gap-1.5">
          {TABS.map(tab => {
            const Icon = TAB_ICONS[tab];
            return (
              <Fragment key={tab}>
                <button
                  onClick={() => handleTabChange(tab)}
                  title={tab}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary/80'
                  }`}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span className="hidden md:inline">{tab}</span>
                </button>
                {tab === 'details' && (
                  <div className="w-px bg-admin-bg-active mx-0.5 my-1" />
                )}
              </Fragment>
            );
          })}
        </nav>
      </div>

      {/* Tab content — all tabs stay mounted to preserve editor state */}
      <div className="flex-1 min-h-0 relative">
        <div className={activeTab === 'details' ? 'h-full overflow-y-auto admin-scrollbar' : 'hidden'}>
          <DetailsTab
            ref={detailsRef}
            proposal={proposal}
            contacts={contacts}
            proposalContacts={proposalContacts}
            clients={clients}
            onUpdated={handleUpdated}
            onProposalTypeChange={(type) => setProposalType(type)}
            onDirty={handleDirty}
          />
        </div>
        <div className={activeTab === 'welcome' ? 'h-full overflow-hidden' : 'hidden'}>
          <WelcomeTab
            ref={welcomeRef}
            proposalId={proposal.id}
            proposalType={proposal.proposal_type}
            section={welcomeSection}
            snippets={snippets}
            onDirty={handleDirty}
            onSectionUpdated={(s) => setSections(prev => {
              const existing = prev.findIndex(x => x.id === s.id);
              if (existing >= 0) return prev.map(x => x.id === s.id ? s : x);
              return [...prev, s];
            })}
          />
        </div>
        <div className={activeTab === 'approach' ? 'h-full overflow-hidden' : 'hidden'}>
          <ApproachTab
            ref={approachRef}
            proposalId={proposal.id}
            proposalType={proposal.proposal_type}
            section={approachSection}
            snippets={snippets}
            onDirty={handleDirty}
            onSectionUpdated={(s) => setSections(prev => {
              const existing = prev.findIndex(x => x.id === s.id);
              if (existing >= 0) return prev.map(x => x.id === s.id ? s : x);
              return [...prev, s];
            })}
          />
        </div>
        <div className={activeTab === 'timeline' ? 'h-full overflow-y-auto admin-scrollbar' : 'hidden'}>
          <TimelineTab
            proposalId={proposal.id}
            proposal={proposal}
            initialMilestones={milestones}
          />
        </div>
        <div className={activeTab === 'samples' ? 'h-full overflow-hidden' : 'hidden'}>
          <SamplesTab
            proposalId={proposal.id}
            allProjects={allProjects}
            initialProposalProjects={proposalProjects}
          />
        </div>
        <div className={activeTab === 'pricing' ? 'h-full overflow-y-auto admin-scrollbar' : 'hidden'}>
          <PricingTab
            ref={pricingRef}
            proposalId={proposal.id}
            proposalType={proposalType}
            initialQuotes={activeQuotes}
            onProposalTypeChange={(type) => setProposalType(type)}
            onDirty={handleDirty}
          />
        </div>
      </div>

      {/* Footer: action buttons (left) | delete (right) */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-admin-border bg-admin-bg-wash">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void autoSave.flush()}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Save size={14} />
            Save
          </button>
          {/* Status toggle — Draft / Sent */}
          <div ref={statusRef} className="relative">
            <button
              type="button"
              onClick={() => setStatusOpen((o) => !o)}
              className={`${status !== 'draft' ? 'btn-success' : 'btn-secondary'} gap-1.5 px-4 py-2.5 text-sm font-medium`}
            >
              {status === 'draft' ? 'Draft' : status === 'sent' ? 'Sent' : status.charAt(0).toUpperCase() + status.slice(1)}
              <ChevronDown size={12} className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                <div className="absolute bottom-full mb-1 left-0 min-w-[160px] bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 z-50">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('sent')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      status !== 'draft' ? 'text-admin-success bg-admin-success-bg/30' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-admin-success" />
                      Sent
                    </span>
                    {status !== 'draft' && <Check size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('draft')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      status === 'draft' ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-admin-text-faint" />
                      Draft
                    </span>
                    {status === 'draft' && <Check size={12} />}
                  </button>
                </div>
              </>
            )}
          </div>
          <a
            href={`/p/${proposal.slug}?pwd=${proposal.proposal_password}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-4 py-2.5 text-sm"
          >
            <ExternalLink size={13} />
            View
          </a>
        </div>

        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <span className="text-xs text-admin-danger">Delete this proposal?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-danger hover:text-admin-danger-hover hover:bg-admin-danger-bg transition-colors disabled:opacity-40"
                title="Confirm delete"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-faint hover:text-admin-text-secondary hover:bg-admin-bg-hover transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/50 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
