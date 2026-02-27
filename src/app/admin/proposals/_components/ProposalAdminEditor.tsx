'use client';

import { Fragment, useState, useTransition, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X, ExternalLink, Check, Loader2, Trash2, Home, Hand, GitBranch, Calendar, Play, DollarSign } from 'lucide-react';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import { SaveButton } from '@/app/admin/_components/SaveButton';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import type { LucideIcon } from 'lucide-react';
import { deleteProposal, type ClientRow } from '@/app/admin/actions';
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
  onClose?: () => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-white/10 text-[#666]',
  sent: 'bg-blue-500/20 text-blue-300',
  viewed: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300',
};

export const ProposalAdminEditor = forwardRef<ProposalEditorHandle, Props>(function ProposalAdminEditor({
  proposal: initialProposal, contacts, proposalContacts, clients, snippets, sections: initialSections,
  milestones, quotes, allProjects, proposalProjects, onClose, onDelete,
}, editorRef) {
  const [proposal] = useState(initialProposal);
  const [proposalType, setProposalType] = useState(initialProposal.proposal_type);
  const [sections, setSections] = useState(initialSections);
  const [status] = useState(initialProposal.status);
  const [isDeleting, startDelete] = useTransition();
  const detailsRef = useRef<DetailsTabHandle>(null);
  const welcomeRef = useRef<WelcomeTabHandle>(null);
  const approachRef = useRef<ApproachTabHandle>(null);
  const pricingRef = useRef<PricingTabHandle>(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const { saving: pricingSaving, saved: pricingSaved, wrap: wrapPricing } = useSaveState();
  const { saving: markdownSaving, saved: markdownSaved, wrap: wrapMarkdown } = useSaveState();
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const isLive = status !== 'draft';

  const handleClose = useCallback(() => {
    if (
      detailsRef.current?.isDirty ||
      welcomeRef.current?.isDirty ||
      approachRef.current?.isDirty ||
      pricingRef.current?.isDirty
    ) {
      setConfirmClose(true);
    } else {
      onClose?.();
    }
  }, [onClose]);

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
        onDiscard={() => { setConfirmClose(false); onClose?.(); }}
      />

      {/* Header: title + meta (left) | status + X (right) */}
      <div className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{proposal.title}</h1>
            <p className="text-sm mt-1 text-muted-foreground font-mono truncate">
              /p/{proposal.slug} · #{proposal.proposal_number}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5">
            <span className="flex items-center gap-1.5 px-4 py-1 rounded-full text-xs text-[#666] whitespace-nowrap bg-white/[0.04]">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400' : 'bg-white/25'}`} />
              {isLive ? 'Live' : 'Draft'}
            </span>
            <span className={`px-4 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_BADGE[status] ?? STATUS_BADGE.draft}`}>
              {status}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-8 py-3 border-b border-[#2a2a2a] bg-white/[0.02]">
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
                      ? 'bg-white/10 text-foreground'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground/80'
                  }`}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span className="hidden md:inline">{tab}</span>
                </button>
                {tab === 'details' && (
                  <div className="w-px bg-white/10 mx-0.5 my-1" />
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
            onSaveStateChange={(pending, saved) => {
              setDetailsSaving(pending);
              setDetailsSaved(saved);
            }}
          />
        </div>
        <div className={activeTab === 'welcome' ? 'h-full overflow-hidden' : 'hidden'}>
          <WelcomeTab
            ref={welcomeRef}
            proposalId={proposal.id}
            proposalType={proposal.proposal_type}
            section={welcomeSection}
            snippets={snippets}
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
          />
        </div>
      </div>

      {/* Footer: action buttons (left) | delete (right) */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-[#2a2a2a] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <SaveButton
            saving={activeTab === 'pricing' ? pricingSaving : activeTab === 'welcome' || activeTab === 'approach' ? markdownSaving : detailsSaving}
            saved={activeTab === 'pricing' ? pricingSaved : activeTab === 'welcome' || activeTab === 'approach' ? markdownSaved : detailsSaved}
            disabled={detailsSaving || pricingSaving || markdownSaving}
            onClick={async () => {
              if (activeTab === 'pricing') {
                await wrapPricing(() => pricingRef.current!.save());
              } else if (activeTab === 'welcome') {
                await wrapMarkdown(() => welcomeRef.current!.save());
              } else if (activeTab === 'approach') {
                await wrapMarkdown(() => approachRef.current!.save());
              } else {
                detailsRef.current?.save();
              }
            }}
            className="px-5 py-2.5 text-sm"
          />
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
              <span className="text-xs text-red-400">Delete this proposal?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                title="Confirm delete"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#4d4d4d] hover:text-[#b3b3b3] hover:bg-white/5 transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
