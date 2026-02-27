'use client';

import { Suspense, useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ExternalLink, Home, Hand, GitBranch, Calendar, Play, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { updateProposal } from '@/app/admin/actions';
import { DetailsTab } from './tabs/DetailsTab';
import { WelcomeTab } from './tabs/WelcomeTab';
import { ApproachTab } from './tabs/ApproachTab';
import { TimelineTab } from './tabs/TimelineTab';
import { SamplesTab } from './tabs/SamplesTab';
import { PricingTab } from './tabs/PricingTab';
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

interface Props {
  proposal: ProposalRow;
  contacts: ContactRow[];
  snippets: ContentSnippetRow[];
  sections: ProposalSectionRow[];
  milestones: ProposalMilestoneRow[];
  quotes: ProposalQuoteRow[];
  allProjects: BrowserProject[];
  proposalProjects: ProposalProjectWithProject[];
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-white/10 text-white/40',
  sent: 'bg-blue-500/20 text-blue-300',
  viewed: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300',
};

function EditorInner({
  proposal: initialProposal, contacts, snippets, sections: initialSections,
  milestones, quotes, allProjects, proposalProjects,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [proposal] = useState(initialProposal);
  const [sections, setSections] = useState(initialSections);
  const [status, setStatus] = useState(initialProposal.status);
  const [isPublishing, startPublish] = useTransition();

  const activeTab = (searchParams.get('tab') as TabId | null) ?? 'details';
  const isLive = status !== 'draft';

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleUpdated() {
    router.refresh();
  }

  function handlePublish() {
    startPublish(async () => {
      await updateProposal(proposal.id, { status: 'sent' });
      setStatus('sent');
    });
  }

  const welcomeSection = sections.find(s => s.sort_order === 0 && s.section_type === 'text') ?? null;
  const approachSection = sections.find(s => s.sort_order === 1 && s.section_type === 'text') ?? null;
  const activeQuotes = quotes.filter(q => !q.deleted_at);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <AdminPageHeader
        title={proposal.title}
        subtitle={`/p/${proposal.slug} · #${proposal.proposal_number}`}
        leftActions={
          <a href="/admin/proposals" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
            <ArrowLeft size={16} />
          </a>
        }
        actions={
          <div className="flex items-center gap-4 pl-2">
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400' : 'bg-white/25'}`} />
              {isLive ? 'Live' : 'Draft'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.draft}`}>
              {status}
            </span>
            <a
              href={`/p/${proposal.slug}?pwd=${proposal.proposal_password}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 text-sm"
            >
              <ExternalLink size={13} />
              View
            </a>
            <button
              onClick={handlePublish}
              disabled={isPublishing || isLive}
              className="btn-primary px-5 py-2 text-sm"
            >
              {isPublishing ? 'Publishing…' : isLive ? 'Published' : 'Publish'}
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex-shrink-0 px-8 py-3">
        <nav className="inline-flex gap-1.5 bg-white/[0.04] rounded-xl p-2">
          {TABS.map(tab => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground/80'
                }`}
              >
                <Icon size={13} className="flex-shrink-0" />
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar">
        {activeTab === 'details' && (
          <DetailsTab proposal={proposal} contacts={contacts} onUpdated={handleUpdated} />
        )}
        {activeTab === 'welcome' && (
          <WelcomeTab
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
        )}
        {activeTab === 'approach' && (
          <ApproachTab
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
        )}
        {activeTab === 'timeline' && (
          <TimelineTab
            proposalId={proposal.id}
            proposal={proposal}
            initialMilestones={milestones}
          />
        )}
        {activeTab === 'samples' && (
          <SamplesTab
            proposalId={proposal.id}
            allProjects={allProjects}
            initialProposalProjects={proposalProjects}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingTab
            proposalId={proposal.id}
            proposalType={proposal.proposal_type}
            crowdfundingApproved={proposal.crowdfunding_approved}
            initialQuotes={activeQuotes}
          />
        )}
      </div>
    </div>
  );
}

export function ProposalAdminEditor(props: Props) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <EditorInner {...props} />
    </Suspense>
  );
}
