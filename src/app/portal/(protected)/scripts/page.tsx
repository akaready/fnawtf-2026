import { ScrollText } from 'lucide-react';
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

export default async function PortalScriptsPage() {
  const session = await getPortalSession();
  const supabase = await createClient();

  const { data: scripts, error } = await supabase
    .from('scripts')
    .select('id, title, status, created_at, updated_at, project_id, projects!inner(client_id)')
    .eq('projects.client_id', session!.clientId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Portal scripts: query failed — ${error.message}`);
  }

  const scriptRows = scripts ?? [];

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-portal-text-primary tracking-tight">
          Scripts
        </h1>
        <p className="mt-1 text-sm text-portal-text-muted">
          Shared versions ready for your review
        </p>
      </div>

      {/* List */}
      {scriptRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ScrollText size={40} strokeWidth={1.25} className="text-portal-text-faint mb-4" />
          <p className="text-sm text-portal-text-muted">No scripts shared yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {scriptRows.map((script) => {
            const updatedAt = script.updated_at ?? script.created_at ?? new Date(0).toISOString();
            const isNew = isWithinSevenDays(updatedAt);

            return (
              <div
                key={script.id}
                className="flex items-start gap-3 rounded-lg border border-portal-tile-border bg-portal-card-bg px-4 py-3.5 cursor-default"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-portal-avatar-bg border border-portal-tile-border">
                  <ScrollText size={15} strokeWidth={1.5} className="text-portal-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs uppercase tracking-wider text-portal-text-faint font-medium">
                      Script
                    </span>
                    {isNew && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full border border-portal-accent text-portal-accent leading-none">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-portal-text-primary truncate leading-snug">
                    {script.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-portal-text-faint">
                      {script.status}
                    </span>
                    <span className="text-portal-text-separator text-xs">·</span>
                    <span className="text-xs text-portal-text-faint">
                      {formatRelativeDate(updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
