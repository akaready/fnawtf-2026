import Link from 'next/link';
import { type LucideIcon, FileText, ScrollText, Receipt, FileSignature, Inbox, Clapperboard, Package, Truck } from 'lucide-react';
import { getPortalSession } from '@/lib/portal/portalAuth';
import { createClient } from '@/lib/supabase/server';

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
  icon: LucideIcon;
  href: string;
  count: number | null;
  countLabel: string;
  hasNew: boolean;
  color: string;
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

  // Fan out all 4 queries in parallel (Fix 1 + Fix 3)
  const [
    { data: proposals, error: proposalsError },
    { data: scripts, error: scriptsError },
    { data: contracts, error: contractsError },
    { data: intakeRows, error: intakeError },
  ] = await Promise.all([
    // Proposals for this client (matched by contact_company = clientName)
    supabase
      .from('proposals')
      .select('id, slug, title, status, created_at, updated_at')
      .eq('contact_company', clientName)
      .order('updated_at', { ascending: false }),

    // Scripts for this client via projects.client_id
    supabase
      .from('scripts')
      .select('id, title, status, created_at, updated_at, project_id, projects!inner(client_id)')
      .eq('projects.client_id', clientId)
      .order('updated_at', { ascending: false }),

    // Contracts — one query, derive count + recency client-side (Fix 3)
    supabase
      .from('contracts')
      .select('id, created_at')
      .eq('client_id', clientId),

    // Intake submissions — one query, derive count + recency client-side (Fix 3)
    supabase
      .from('intake_submissions')
      .select('id, created_at')
      .eq('client_id', clientId),
  ]);

  // Fix 2: throw on critical errors, console.error on supplementary ones
  if (proposalsError) {
    throw new Error(`Portal home: proposals query failed — ${proposalsError.message}`);
  }
  if (scriptsError) {
    throw new Error(`Portal home: scripts query failed — ${scriptsError.message}`);
  }
  if (contractsError) {
    console.error('Portal home: contracts query failed —', contractsError.message);
  }
  if (intakeError) {
    console.error('Portal home: intake query failed —', intakeError.message);
  }

  // Fix 3: derive count + recency from the single query result
  const contractCount = contracts?.length ?? 0;
  const contractHasNew = contracts?.some((c) => isWithinSevenDays(c.created_at)) ?? false;

  const intakeCount = intakeRows?.length ?? 0;
  const intakeHasNew = intakeRows?.some((r) => isWithinSevenDays(r.created_at)) ?? false;

  // Fix 5: use inferred types — no `as` casts needed; ?? [] satisfies non-null
  const proposalRows = proposals ?? [];
  const scriptRows = scripts ?? [];

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

  return {
    recentItems,
    proposalCount,
    scriptCount,
    contractCount,
    intakeCount,
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
      className="relative flex flex-col items-start gap-4 rounded-lg border bg-portal-tile-bg hover:bg-portal-tile-hover transition-colors px-5 py-6"
      style={{ borderColor: `${tile.color}33` }}
    >
      {tile.hasNew && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ backgroundColor: tile.color }} />
      )}
      <Icon size={24} strokeWidth={1.5} style={{ color: tile.color }} className="opacity-60" />
      <div className="flex flex-col gap-1">
        <span className="text-base font-medium text-portal-text-primary leading-tight">
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
  // Fix 4: layout.tsx already guards the session; keep call for clientId/clientName/email,
  // but remove the redirect — it can never be null here.
  const session = await getPortalSession();

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
  } = await fetchPageData(session!.clientId, session!.clientName);

  const firstName = deriveFirstName(session!.email);

  const businessTiles: SectionTile[] = [
    {
      label: 'Intake',
      icon: Inbox,
      href: '/portal/intake',
      count: intakeCount,
      countLabel: intakeCount === 1 ? '1 form' : `${intakeCount} forms`,
      hasNew: intakeHasNew,
      color: '#ef4444',
    },
    {
      label: 'Proposals',
      icon: FileText,
      href: '/portal/proposals',
      count: proposalCount,
      countLabel: proposalCount === 1 ? '1 total' : `${proposalCount} total`,
      hasNew: proposalHasNew,
      color: '#f97316',
    },
    {
      label: 'Contracts',
      icon: FileSignature,
      href: '/portal/contracts',
      count: contractCount,
      countLabel: contractCount === 1 ? '1 total' : `${contractCount} total`,
      hasNew: contractHasNew,
      color: '#eab308',
    },
    {
      label: 'Invoices',
      icon: Receipt,
      href: '/portal/invoices',
      count: null,
      countLabel: 'Coming soon',
      hasNew: false,
      color: '#22c55e',
    },
  ];

  const creativeTiles: SectionTile[] = [
    {
      label: 'Scripts',
      icon: ScrollText,
      href: '/portal/scripts',
      count: scriptCount,
      countLabel: scriptCount === 1 ? '1 total' : `${scriptCount} total`,
      hasNew: scriptHasNew,
      color: '#3b82f6',
    },
    {
      label: 'Call Sheets',
      icon: Clapperboard,
      href: '/portal/call-sheets',
      count: null,
      countLabel: 'Coming soon',
      hasNew: false,
      color: '#6366f1',
    },
    {
      label: 'Exports',
      icon: Package,
      href: '/portal/exports',
      count: null,
      countLabel: 'Coming soon',
      hasNew: false,
      color: '#8b5cf6',
    },
    {
      label: 'Delivery',
      icon: Truck,
      href: '/portal/delivery',
      count: null,
      countLabel: 'Coming soon',
      hasNew: false,
      color: '#a855f7',
    },
  ];

  return (
    <div className="px-4 md:px-8 pt-14 pb-10 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-12">
        <h1 className="text-4xl font-light text-portal-text-primary tracking-tight leading-tight">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2 text-base text-portal-text-muted">
          {session!.clientName}
        </p>
      </div>

      {/* Recent strip */}
      {recentItems.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs uppercase tracking-widest text-portal-text-faint font-medium mb-4">
            Activity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentItems.map((item) => (
              <RecentItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Project & Billing */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-widest text-portal-text-faint font-medium mb-4">
          Project
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {businessTiles.map((tile) => (
            <SectionTileCard key={tile.label} tile={tile} />
          ))}
        </div>
      </section>

      {/* Creative */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-portal-text-faint font-medium mb-4">
          Creative
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {creativeTiles.map((tile) => (
            <SectionTileCard key={tile.label} tile={tile} />
          ))}
        </div>
      </section>
    </div>
  );
}
