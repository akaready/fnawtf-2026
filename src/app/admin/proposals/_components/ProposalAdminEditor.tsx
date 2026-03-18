'use client';

import { Fragment, useState, useEffect, useTransition, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X, ExternalLink, Check, Home, Hand, GitBranch, Calendar, Play, DollarSign, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { PanelFooter } from '@/app/admin/_components/PanelFooter';
import type { AutoSaveStatus } from '@/app/admin/_hooks/useAutoSave';
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
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';

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
  onUpdated?: (fields: Partial<ProposalRow>) => void;
  onViewsClick?: () => void;
}



export const ProposalAdminEditor = forwardRef<ProposalEditorHandle, Props>(function ProposalAdminEditor({
  proposal: initialProposal, contacts, proposalContacts, clients, snippets, sections: initialSections,
  milestones, quotes, allProjects, proposalProjects, viewCount = 0, onClose, onDelete, onUpdated, onViewsClick,
}, editorRef) {
  const [proposal] = useState(initialProposal);
  const [proposalType, setProposalType] = useState(initialProposal.proposal_type);
  const [sections, setSections] = useState(initialSections);
  const [status, setStatus] = useState(initialProposal.status);

  // Track slide visibility for tab dimming (updated when DetailsTab saves)
  const [slideVisibility, setSlideVisibility] = useState({
    show_welcome: initialProposal.show_welcome,
    show_process: initialProposal.show_process,
    show_approach: initialProposal.show_approach,
    show_timeline: initialProposal.show_timeline,
    show_samples: initialProposal.show_samples,
    show_pricing: initialProposal.show_pricing,
  });
  const TAB_VISIBILITY_MAP: Partial<Record<TabId, keyof typeof slideVisibility>> = {
    welcome: 'show_welcome',
    approach: 'show_approach',
    timeline: 'show_timeline',
    samples: 'show_samples',
    pricing: 'show_pricing',
  };
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [isDeleting, startDelete] = useTransition();
  const detailsRef = useRef<DetailsTabHandle>(null);
  const welcomeRef = useRef<WelcomeTabHandle>(null);
  const approachRef = useRef<ApproachTabHandle>(null);
  const pricingRef = useRef<PricingTabHandle>(null);
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Tabs self-save on their own timers; this just tracks visual status for SaveDot
  const handleDirty = useCallback(() => {
    setSaveStatus('pending');
    clearTimeout(savedTimerRef.current);
    // Tabs auto-save after ~600ms; show "saved" after a reasonable delay
    savedTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1200);
  }, []);

  const handleFlush = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await Promise.all([
        detailsRef.current?.save(),
        welcomeRef.current?.save(),
        approachRef.current?.save(),
        pricingRef.current?.save(),
      ].filter(Boolean));
      setSaveStatus('saved');
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, []);

  const handleStatusChange = useCallback(async (newStatus: 'draft' | 'sent') => {
    setStatus(newStatus);
    setStatusOpen(false);
    await updateProposal(proposal.id, { status: newStatus });
    onUpdated?.({ status: newStatus });
  }, [proposal.id, onUpdated]);

  const handleClose = useCallback(() => {
    // Flush any pending tab saves, then close
    void Promise.all([
      detailsRef.current?.save(),
      welcomeRef.current?.save(),
      approachRef.current?.save(),
      pricingRef.current?.save(),
    ].filter(Boolean)).finally(() => onClose?.());
  }, [onClose]);

  const handleTabChange = useCallback((tab: TabId) => {
    // Flush any pending debounced saves from the current tab before switching
    void Promise.all([
      welcomeRef.current?.save(),
      approachRef.current?.save(),
    ].filter(Boolean));
    setActiveTab(tab);
  }, []);

  const handleVisibilityToggle = useCallback((visKey: keyof typeof slideVisibility) => {
    const newValue = !slideVisibility[visKey];
    setSlideVisibility(prev => ({ ...prev, [visKey]: newValue }));
    void updateProposal(proposal.id, { [visKey]: newValue });
    onUpdated?.({ [visKey]: newValue } as Partial<ProposalRow>);
  }, [slideVisibility, proposal.id, onUpdated]);

  useImperativeHandle(editorRef, () => ({ tryClose: handleClose }), [handleClose]);

  // Chat panel context
  const { setPanelContext } = useChatContext();

  useEffect(() => {
    if (!proposal?.id) return;
    const lines: string[] = [];
    lines.push(`Title: ${proposal.title}`);
    lines.push(`Slug: /p/${proposal.slug}`);
    lines.push(`Status: ${status}`);
    lines.push(`Type: ${proposalType ?? 'N/A'}`);
    lines.push(`Views: ${viewCount}`);
    if (proposal.contact_company) lines.push(`Client/Company: ${proposal.contact_company}`);
    if (proposal.show_welcome !== undefined) lines.push(`Welcome visible: ${slideVisibility.show_welcome}`);
    if (proposal.show_approach !== undefined) lines.push(`Approach visible: ${slideVisibility.show_approach}`);
    if (proposal.show_timeline !== undefined) lines.push(`Timeline visible: ${slideVisibility.show_timeline}`);
    if (proposal.show_samples !== undefined) lines.push(`Samples visible: ${slideVisibility.show_samples}`);
    if (proposal.show_pricing !== undefined) lines.push(`Pricing visible: ${slideVisibility.show_pricing}`);
    if (proposalContacts.length > 0) {
      lines.push(`Contacts (${proposalContacts.length}):`);
      proposalContacts.forEach(c => {
        lines.push(`  - ${c.first_name ?? ''} ${c.last_name ?? ''}${c.email ? ` (${c.email})` : ''}${c.role ? ` — ${c.role}` : ''}`);
      });
    }
    if (sections.length > 0) {
      lines.push(`Sections (${sections.length}):`);
      sections.forEach(s => {
        lines.push(`  - ${s.custom_title ?? s.section_type}: ${(s.custom_content ?? '').slice(0, 120)}`);
      });
    }
    if (milestones.length > 0) {
      lines.push(`Milestones (${milestones.length}):`);
      milestones.forEach(m => {
        lines.push(`  - ${m.label || 'Untitled'}${m.phase ? ` [${m.phase}]` : ''} ${m.start_date} — ${m.end_date}`);
      });
    }
    const activeQ = quotes.filter(q => !q.deleted_at);
    if (activeQ.length > 0) {
      lines.push(`Quotes (${activeQ.length}):`);
      activeQ.forEach(q => {
        const addonKeys = Object.keys(q.selected_addons ?? {});
        lines.push(`  - ${q.label || 'Untitled'}: $${q.total_amount ?? 0}${addonKeys.length ? ` (addons: ${addonKeys.join(', ')})` : ''}`);
      });
    }
    if (proposalProjects.length > 0) {
      lines.push(`Linked Projects (${proposalProjects.length}):`);
      proposalProjects.forEach(pp => {
        lines.push(`  - ${pp.project?.title ?? pp.project_id}`);
      });
    }
    setPanelContext({
      recordType: 'proposal',
      recordId: proposal.id,
      recordLabel: proposal.title || 'Untitled Proposal',
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [proposal, status, proposalType, viewCount, clients, proposalContacts, sections, milestones, quotes, proposalProjects, slideVisibility, setPanelContext]);

  function handleDelete() {
    startDelete(async () => {
      await deleteProposal(proposal.id);
      onDelete?.(proposal.id);
      onClose?.();
    });
  }

  function handleUpdated(fields: Partial<ProposalRow>) {
    onUpdated?.(fields);
  }

  const welcomeSection = sections.find(s => s.sort_order === 0 && s.section_type === 'text') ?? null;
  const approachSection = sections.find(s => s.sort_order === 1 && s.section_type === 'text') ?? null;
  const activeQuotes = quotes.filter(q => !q.deleted_at);

  return (
    <div className="flex flex-col h-full relative">
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
            <SaveDot status={saveStatus} />
            <button
              onClick={onViewsClick}
              className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                viewCount > 0
                  ? 'bg-admin-info-bg text-admin-info border-admin-info-border hover:bg-admin-info-bg-strong'
                  : 'bg-admin-bg-selected text-admin-text-ghost border-admin-border hover:bg-admin-bg-hover hover:text-admin-text-muted'
              }`}
            >
              <Eye size={11} />
              {viewCount} {viewCount === 1 ? 'view' : 'views'}
            </button>
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
            const visKey = TAB_VISIBILITY_MAP[tab];
            const isHidden = visKey ? !slideVisibility[visKey] : false;
            return (
              <Fragment key={tab}>
                <button
                  onClick={() => handleTabChange(tab)}
                  title={tab}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-admin-bg-active text-admin-text-primary'
                      : 'text-admin-text-muted hover:bg-admin-bg-hover hover:text-admin-text-primary/80'
                  } ${isHidden ? 'opacity-30' : ''}`}
                >
                  {visKey ? (
                    <span className="group/ico flex-shrink-0 relative w-[13px] h-[13px]" onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(visKey); }}>
                      <span className="absolute inset-0 group-hover/ico:hidden">
                        <Icon size={13} />
                      </span>
                      <span className="absolute inset-0 hidden group-hover/ico:block">
                        {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      </span>
                    </span>
                  ) : (
                    <Icon size={13} className="flex-shrink-0" />
                  )}
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
            currentProposalType={proposalType}
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
            initialPricingNotes={proposal.pricing_notes}
            initialShowPricingNotes={proposal.show_pricing_notes}
            initialForceAdditionalDiscount={proposal.force_additional_discount}
            initialClientAdditionalDiscount={proposal.client_additional_discount}
            initialForcePriorityScheduling={proposal.force_priority_scheduling}
            initialHideDeferredPayment={proposal.hide_deferred_payment}
            onProposalTypeChange={(type) => setProposalType(type)}
            onDirty={handleDirty}
          />
        </div>
      </div>

      {/* Footer */}
      <PanelFooter
        onSave={() => void handleFlush()}
        onDelete={handleDelete}
        deleteDisabled={isDeleting}
        secondaryActions={
          <>
            <a
              href={`/p/${proposal.slug}?pwd=${proposal.proposal_password}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-warning px-4 py-2.5 text-sm"
            >
              <ExternalLink size={13} />
              Preview
            </a>
            {/* Status toggle — Draft / Sent */}
            <div ref={statusRef} className="relative">
              <button
                type="button"
                onClick={() => setStatusOpen((o) => !o)}
                className={`${status !== 'draft' ? 'btn-success' : 'btn-secondary'} gap-1.5 px-4 py-2.5 text-sm font-medium`}
              >
                {status === 'draft' ? 'Draft' : 'Sent'}
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
          </>
        }
      />
    </div>
  );
});
