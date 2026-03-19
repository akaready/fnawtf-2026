import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import { getPortalSession } from '@/lib/portal/portalAuth';
import { createClient } from '@/lib/supabase/server';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortalProposalsPage() {
  const session = await getPortalSession();
  const supabase = await createClient();

  const { data: proposals, error } = await supabase
    .from('proposals')
    .select('id, slug, title, status, created_at, updated_at')
    .eq('contact_company', session!.clientName)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Portal proposals: query failed — ${error.message}`);
  }

  const proposalRows = proposals ?? [];

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-portal-text-primary tracking-tight">
          Proposals
        </h1>
        <p className="mt-1 text-sm text-portal-text-muted">
          Active and past proposals
        </p>
      </div>

      {/* List */}
      {proposalRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={40} strokeWidth={1.25} className="text-portal-text-faint mb-4" />
          <p className="text-sm text-portal-text-muted">No proposals shared yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {proposalRows.map((proposal) => {
            const updatedAt = proposal.updated_at ?? proposal.created_at ?? new Date(0).toISOString();
            const isNew = isWithinSevenDays(updatedAt);

            return (
              <Link
                key={proposal.id}
                href={`/p/${proposal.slug}`}
                className="flex items-start gap-3 rounded-lg border border-portal-tile-border bg-portal-card-bg hover:bg-portal-tile-hover hover:border-portal-avatar-border transition-colors px-4 py-3.5"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-portal-avatar-bg border border-portal-tile-border">
                  <FileText size={15} strokeWidth={1.5} className="text-portal-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs uppercase tracking-wider text-portal-text-faint font-medium">
                      Proposal
                    </span>
                    {isNew && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full border border-portal-accent text-portal-accent leading-none">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-portal-text-primary truncate leading-snug">
                    {proposal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-portal-text-faint">
                      {proposal.status}
                    </span>
                    <span className="text-portal-text-separator text-xs">·</span>
                    <span className="text-xs text-portal-text-faint">
                      {formatRelativeDate(updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center self-center">
                  <ChevronRight size={16} strokeWidth={1.5} className="text-portal-text-faint" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
