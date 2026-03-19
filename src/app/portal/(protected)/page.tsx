import Link from 'next/link';
import { FileText, ScrollText, Receipt, FileSignature, Inbox } from 'lucide-react';
import { getPortalSession } from '@/lib/portal/portalAuth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecentItem {
  id: string;
  type: 'proposal' | 'script';
  title: string;
  status: string;
  updatedAt: string;
  href: string;
}

interface SectionTile {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  href: string;
  count: number | null;
  countLabel: string;
  hasNew: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveFirstName(email: string): string {
  const local = email.split('@')[0] ?? '';
  // capitalise first segment before any dot/underscore/plus
  const first = local.split(/[._+]/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function formatRelativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isWithinSevenDays(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function fetchPageData(clientId: string, clientName: string) {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Proposals for this client (matched by contact_company = clientName)
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, slug, title, status, created_at, updated_at')
    .eq('contact_company', clientName)
    .order('updated_at', { ascending: false });

  const proposalRows = (proposals ?? []) as {
    id: string;
    slug: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[];

  // Scripts for this client via projects.client_id
  const { data: scripts } = await supabase
    .from('scripts')
    .select('id, title, status, created_at, updated_at, project_id, projects!inner(client_id)')
    .eq('projects.client_id', clientId)
    .order('updated_at', { ascending: false });

  const scriptRows = (scripts ?? []) as {
    id: string;
    title: string;
    status: string;
    created_at: string | null;
    updated_at: string | null;
    project_id: string | null;
  }[];

  // Build recent items list (merge + sort + take 3)
  const recentProposals: RecentItem[] = proposalRows.map((p) => ({
    id: p.id,
    type: 'proposal',
    title: p.title,
    status: p.status,
    updatedAt: p.updated_at,
    href: `/portal/proposals`,
  }));

  const recentScripts: RecentItem[] = scriptRows.map((s) => ({
    id: s.id,
    type: 'script',
    title: s.title,
    status: s.status,
    updatedAt: s.updated_at ?? s.created_at ?? new Date(0).toISOString(),
    href: `/portal/scripts`,
  }));

  const recentItems = [...recentProposals, ...recentScripts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // Counts for section tiles
  const proposalCount = proposalRows.length;
  const scriptCount = scriptRows.length;

  const proposalHasNew = proposalRows.some((p) => isWithinSevenDays(p.updated_at));
  const scriptHasNew = scriptRows.some((s) =>
    isWithinSevenDays(s.updated_at ?? s.created_at ?? '')
  );

  // Contracts count for this client
  const { count: contractCount } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  // Contracts: check for new
  const { data: recentContracts } = await supabase
    .from('contracts')
    .select('id')
    .eq('client_id', clientId)
    .gte('created_at', sevenDaysAgo)
    .limit(1);
  const contractHasNew = (recentContracts ?? []).length > 0;

  // Intake submissions for this client
  const { count: intakeCount } = await supabase
    .from('intake_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { data: recentIntake } = await supabase
    .from('intake_submissions')
    .select('id')
    .eq('client_id', clientId)
    .gte('created_at', sevenDaysAgo)
    .limit(1);
  const intakeHasNew = (recentIntake ?? []).length > 0;

  return {
    recentItems,
    proposalCount,
    scriptCount,
    contractCount: contractCount ?? 0,
    intakeCount: intakeCount ?? 0,
    proposalHasNew,
    scriptHasNew,
    contractHasNew,
    intakeHasNew,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTileCard({ tile }: { tile: SectionTile }) {
  const Icon = tile.icon;
  return (
    <Link
      href={tile.href}
      className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-portal-tile-border bg-portal-tile-bg hover:bg-portal-tile-hover hover:border-portal-avatar-border transition-colors px-4 py-6"
    >
      {tile.hasNew && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-portal-accent" />
      )}
      <Icon size={28} strokeWidth={1.5} className="text-portal-text-muted" />
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-medium text-portal-text-primary leading-tight">
          {tile.label}
        </span>
        <span className="text-xs text-portal-text-faint">
          {tile.countLabel}
        </span>
      </div>
    </Link>
  );
}

function RecentItemCard({ item }: { item: RecentItem }) {
  const isNew = isWithinSevenDays(item.updatedAt);
  const Icon = item.type === 'proposal' ? FileText : ScrollText;

  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-lg border border-portal-tile-border bg-portal-card-bg hover:bg-portal-tile-hover hover:border-portal-avatar-border transition-colors px-4 py-3.5"
    >
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-portal-avatar-bg border border-portal-tile-border">
        <Icon size={15} strokeWidth={1.5} className="text-portal-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs uppercase tracking-wider text-portal-text-faint font-medium">
            {item.type === 'proposal' ? 'Proposal' : 'Script'}
          </span>
          {isNew && (
            <span className="text-xs px-1.5 py-0.5 rounded-full border border-portal-accent text-portal-accent leading-none">
              New
            </span>
          )}
        </div>
        <p className="text-sm text-portal-text-primary truncate leading-snug">
          {item.title}
        </p>
        <p className="text-xs text-portal-text-faint mt-0.5">
          {formatRelativeDate(item.updatedAt)}
        </p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortalHomePage() {
  const session = await getPortalSession();
  if (!session) redirect('/portal/login');

  const {
    recentItems,
    proposalCount,
    scriptCount,
    contractCount,
    intakeCount,
    proposalHasNew,
    scriptHasNew,
    contractHasNew,
    intakeHasNew,
  } = await fetchPageData(session.clientId, session.clientName);

  const firstName = deriveFirstName(session.email);

  const tiles: SectionTile[] = [
    {
      label: 'Proposals',
      icon: FileText,
      href: '/portal/proposals',
      count: proposalCount,
      countLabel: proposalCount === 1 ? '1 total' : `${proposalCount} total`,
      hasNew: proposalHasNew,
    },
    {
      label: 'Scripts',
      icon: ScrollText,
      href: '/portal/scripts',
      count: scriptCount,
      countLabel: scriptCount === 1 ? '1 total' : `${scriptCount} total`,
      hasNew: scriptHasNew,
    },
    {
      label: 'Invoices',
      icon: Receipt,
      href: '/portal/invoices',
      count: null,
      countLabel: 'Coming soon',
      hasNew: false,
    },
    {
      label: 'Contracts',
      icon: FileSignature,
      href: '/portal/contracts',
      count: contractCount,
      countLabel: contractCount === 1 ? '1 total' : `${contractCount} total`,
      hasNew: contractHasNew,
    },
    {
      label: 'Intake',
      icon: Inbox,
      href: '/portal/intake',
      count: intakeCount,
      countLabel: intakeCount === 1 ? '1 total' : `${intakeCount} total`,
      hasNew: intakeHasNew,
    },
  ];

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-portal-text-primary tracking-tight">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-portal-text-muted">
          {session.clientName} &middot; Your project portal
        </p>
      </div>

      {/* Recent strip */}
      {recentItems.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-portal-text-faint font-medium mb-3">
            Recent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentItems.map((item) => (
              <RecentItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Section tiles */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-portal-text-faint font-medium mb-3">
          Sections
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tiles.map((tile) => (
            <SectionTileCard key={tile.label} tile={tile} />
          ))}
        </div>
      </section>
    </div>
  );
}
