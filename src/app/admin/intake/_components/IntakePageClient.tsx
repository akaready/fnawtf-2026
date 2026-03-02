'use client';

import { useState, useTransition } from 'react';
import {
  ClipboardList, X, ExternalLink, ChevronDown, Trash2,
  Building2, User, FileText, Link2, UserPlus, Check,
  Hammer, Rocket, TrendingUp, Coins, BadgeDollarSign,
  FileDown, Send, Play,
} from 'lucide-react';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { PanelDrawer } from '../../_components/PanelDrawer';
import { StatusBadge } from '../../_components/StatusBadge';
import { INTAKE_STATUSES } from '../../_components/statusConfigs';
import { updateIntakeSubmission, deleteIntakeSubmission } from '../../actions';
import type { IntakeSubmission, ClientRow } from '../../actions';
import type { ContactRow } from '@/types/proposal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'Urgent',
  soon: 'Within 6 Weeks',
  later: '2+ Months',
  specific: 'Specific Date',
  unsure: 'Unsure',
};

const TIMELINE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  asap:     { bg: 'bg-admin-danger-bg',  border: 'border-admin-danger-border',  text: 'text-admin-danger' },
  soon:     { bg: 'bg-admin-warning-bg', border: 'border-admin-warning-border', text: 'text-admin-warning' },
  later:    { bg: 'bg-admin-info-bg',    border: 'border-admin-info-border',    text: 'text-admin-info' },
  specific: { bg: 'bg-admin-accent-bg',  border: 'border-admin-accent-border',  text: 'text-accent' },
  unsure:   { bg: 'bg-admin-bg-hover',   border: 'border-admin-border',         text: 'text-admin-text-muted' },
};

const PRIORITY_COLORS: { bg: string; text: string; border: string }[] = [
  { bg: 'bg-admin-success-bg', text: 'text-admin-success', border: 'border-admin-success-border' },
  { bg: 'bg-admin-warning-bg', text: 'text-admin-warning', border: 'border-admin-warning-border' },
  { bg: 'bg-admin-danger-bg',  text: 'text-admin-danger',  border: 'border-admin-danger-border' },
];

const PHASE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  build:        { label: 'Build',        Icon: Hammer },
  launch:       { label: 'Launch',       Icon: Rocket },
  scale:        { label: 'Scale',        Icon: TrendingUp },
  crowdfunding: { label: 'Crowdfunding', Icon: Coins },
  fundraising:  { label: 'Fundraising',  Icon: BadgeDollarSign },
};

const EXPERIENCE_META: Record<string, { label: string; description: string }> = {
  none:        { label: 'First Time',      description: 'Brand new to professional video' },
  inhouse:     { label: 'In-House Only',   description: 'Handled it themselves so far' },
  some:        { label: 'Some Experience',  description: 'Worked with a production team before' },
  experienced: { label: 'Experienced',     description: 'Video is a regular part of their strategy' },
};

const DELIVERABLE_LABELS: Record<string, string> = {
  flagship: 'Flagship Video', social_cuts: 'Social Cutdowns',
  photography_lifestyle: 'Lifestyle Photography', photography_product: 'Product Photography',
  testimonials: 'Testimonials', motion_graphics: 'Motion Graphics',
  gifs: 'GIFs & Loops', pitch_video: 'Pitch Video',
  ads: 'Ad Creatives', brand_story: 'Brand Story',
  scripting: 'Scripting & Strategy', landing_page: 'Launch Page',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Extract YouTube video ID from a URL */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Extract Vimeo video ID from a URL */
function extractVimeoId(url: string): string | null {
  const m = url.match(/(?:vimeo\.com\/)(\d+)/);
  return m ? m[1] : null;
}

/** Parse video_links text into structured entries */
function parseVideoLinks(text: string): { url: string; youtubeId: string | null; vimeoId: string | null; note: string }[] {
  const lines = text.split('\n').filter(Boolean);
  return lines.map((line) => {
    const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[1] : '';
    const note = line.replace(url, '').replace(/^[\s—–-]+/, '').trim();
    const youtubeId = url ? extractYouTubeId(url) : null;
    const vimeoId = url && !youtubeId ? extractVimeoId(url) : null;
    return { url, youtubeId, vimeoId, note };
  });
}

/** Parse stakeholders string into individual entries.
 *  Supports formats:
 *  - "Name <email> — Title"  (newline-separated, from intake form)
 *  - "Name (Title), Name (Title)"  (comma-separated, legacy)
 *  - "Name (Title)"  (single entry)
 */
function parseStakeholders(text: string): { name: string; email: string; title: string }[] {
  // If it has angle brackets, it's the new format (newline-separated)
  if (text.includes('<')) {
    return text.split('\n').filter(Boolean).map((line) => {
      const match = line.match(/^(.+?)\s*<([^>]*)>\s*(?:—\s*(.+))?$/);
      if (match) return { name: match[1].trim(), email: match[2].trim(), title: match[3]?.trim() || '' };
      return { name: line.trim(), email: '', title: '' };
    });
  }
  // Otherwise try comma-separated "Name (Title)" format
  return text.split(',').map((s) => s.trim()).filter(Boolean).map((entry) => {
    const match = entry.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (match) return { name: match[1].trim(), email: '', title: match[2].trim() };
    return { name: entry.trim(), email: '', title: '' };
  });
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  submissions: IntakeSubmission[];
  clients: ClientRow[];
  contacts: ContactRow[];
}

// ── Main component ───────────────────────────────────────────────────────────

export function IntakePageClient({ submissions: initialSubmissions, clients, contacts: _contacts }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IntakeSubmission | null>(null);
  const [, startTransition] = useTransition();

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.project_name.toLowerCase().includes(q) ||
      (s.pitch && s.pitch.toLowerCase().includes(q))
    );
  });

  const handleStatusChange = (id: string, status: string) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    startTransition(() => updateIntakeSubmission(id, { status } as Partial<IntakeSubmission>));
  };

  const handleLink = (id: string, field: 'client_id' | 'contact_id', value: string | null) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, [field]: value } : prev);
    startTransition(() => updateIntakeSubmission(id, { [field]: value } as Partial<IntakeSubmission>));
  };

  const handleDelete = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    if (selected?.id === id) setSelected(null);
    startTransition(() => deleteIntakeSubmission(id));
  };

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Intake Submissions"
        subtitle={`${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search submissions..."
      />

      {/* Table */}
      <div className="flex-1 overflow-auto admin-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-admin-text-muted">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'No submissions match your search.' : 'No intake submissions yet.'}
            </p>
            {!search && (
              <p className="text-xs text-admin-text-dim mt-1">
                Share the form at <span className="font-mono text-accent">/start</span> to collect project intake data.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-admin-bg-base border-b border-admin-border">
              <tr className="text-left text-xs text-admin-text-dim uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Timeline</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Linked</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {filtered.map((s) => {
                const linkedClient = s.client_id ? clients.find((c) => c.id === s.client_id) : null;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="cursor-pointer hover:bg-admin-bg-hover transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-admin-text-primary">{s.name}</div>
                      <div className="text-xs text-admin-text-dim">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-admin-text-secondary max-w-[200px] truncate">
                      {s.project_name}
                    </td>
                    <td className="px-4 py-3 text-admin-text-muted text-xs">
                      {TIMELINE_LABELS[s.timeline] || s.timeline}
                    </td>
                    <td className="px-4 py-3 text-admin-text-muted text-xs">
                      {s.budget || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} config={INTAKE_STATUSES} />
                    </td>
                    <td className="px-4 py-3 text-xs text-admin-text-dim">
                      {linkedClient ? (
                        <span className="inline-flex items-center gap-1 text-accent">
                          <Building2 className="w-3 h-3" />
                          {linkedClient.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-admin-text-dim text-xs">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        className="btn-ghost-danger w-7 h-7"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      <PanelDrawer open={!!selected} onClose={() => setSelected(null)} width="w-[560px]">
        {selected && (
          <IntakeDetailPanel
            submission={selected}
            clients={clients}
            onStatusChange={(status) => handleStatusChange(selected.id, status)}
            onLinkClient={(id) => handleLink(selected.id, 'client_id', id)}
            onDelete={() => handleDelete(selected.id)}
            onClose={() => setSelected(null)}
          />
        )}
      </PanelDrawer>
    </div>
  );
}

// ── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ name, email, title }: {
  name: string;
  email: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-admin-bg-raised border border-admin-border-subtle">
      <div className="w-10 h-10 rounded-lg bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-admin-text-dim" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-admin-text-primary truncate">{name}</p>
        {title && <p className="text-sm text-admin-text-dim truncate">{title}</p>}
        {email && (
          <a href={`mailto:${email}`} className="text-sm text-admin-text-muted hover:text-accent truncate block transition-colors">{email}</a>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {email && (
          <a
            href={`mailto:${email}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            title={`Email ${name}`}
          >
            <Send size={14} />
          </a>
        )}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-admin-border text-sm text-admin-text-muted hover:text-admin-text-primary hover:border-admin-border-emphasis hover:bg-admin-bg-hover transition-colors">
          <UserPlus size={14} />
          Add
        </button>
      </div>
    </div>
  );
}

// ── Detail Panel ─────────────────────────────────────────────────────────────

function IntakeDetailPanel({
  submission: s,
  clients,
  onStatusChange,
  onLinkClient,
  onDelete,
  onClose,
}: {
  submission: IntakeSubmission;
  clients: ClientRow[];
  onStatusChange: (status: string) => void;
  onLinkClient: (id: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const stakeholderEntries = s.stakeholders ? parseStakeholders(s.stakeholders) : [];
  const tl = TIMELINE_COLORS[s.timeline] || TIMELINE_COLORS.unsure;

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 py-5 border-b border-admin-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-admin-text-primary truncate">{s.project_name}</h2>
          {s.company_name && (
            <p className="text-sm text-admin-text-muted mt-0.5">{s.company_name}</p>
          )}
          <p className="text-xs text-admin-text-dim mt-0.5">{formatDate(s.created_at)}</p>
        </div>
        <button onClick={onClose} className="btn-ghost w-8 h-8 flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-6">

        {/* ── People ── */}
        <div>
          <SectionLabel>People</SectionLabel>
          <div className="space-y-2">
            <ContactCard name={s.name} email={s.email} title={s.title || undefined} />
            {stakeholderEntries.map((sh, i) => (
              <ContactCard key={i} name={sh.name} email={sh.email} title={sh.title || undefined} />
            ))}
          </div>
        </div>

        {/* ── Linking ── */}
        <div>
          <SectionLabel>
            <Link2 className="w-3 h-3 inline mr-1" />
            Link to Company
          </SectionLabel>
          <div className="relative">
            <select
              value={s.client_id || ''}
              onChange={(e) => onLinkClient(e.target.value || null)}
              className="admin-input w-full py-2 px-3 text-sm appearance-none pr-8"
            >
              <option value="">Not linked</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-text-faint pointer-events-none" />
          </div>
        </div>

        <hr className="border-admin-border-subtle" />

        {/* ── Services ── */}
        {s.phases && s.phases.length > 0 && (
          <div>
            <SectionLabel>Services</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {s.phases.map((p: string) => {
                const meta = PHASE_META[p];
                const Icon = meta?.Icon;
                const label = meta?.label || p.replace(/_/g, ' ');
                return (
                  <span key={p} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-admin-accent-bg text-accent border border-admin-accent-border text-sm font-medium whitespace-nowrap">
                    {Icon && <Icon size={14} className="flex-shrink-0" />}
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── One-Liner ── */}
        <DetailBlock label="One-Liner" value={s.pitch} />
        <DetailBlock label="What Excites Them" value={s.excitement} />
        <DetailBlock label="Key Feature" value={s.key_feature} />
        <DetailBlock label="Vision" value={s.vision} />
        <DetailBlock label="What to Avoid" value={s.avoid} />
        <DetailBlock label="Target Audience" value={s.audience} />
        <DetailBlock label="Challenge" value={s.challenge} />
        <DetailBlock label="Competitors" value={s.competitors} />

        <hr className="border-admin-border-subtle" />

        {/* ── Video References ── */}
        {s.video_links && (
          <div>
            <SectionLabel>Video References</SectionLabel>
            <div className="space-y-3">
              {parseVideoLinks(s.video_links).map((entry, i) => (
                <div key={i}>
                  {entry.youtubeId ? (
                    <div className="rounded-xl overflow-hidden border border-admin-border-subtle">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${entry.youtubeId}`}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`Video reference ${i + 1}`}
                      />
                    </div>
                  ) : entry.vimeoId ? (
                    <div className="rounded-xl overflow-hidden border border-admin-border-subtle">
                      <iframe
                        src={`https://player.vimeo.com/video/${entry.vimeoId}?byline=0&portrait=0`}
                        className="w-full aspect-video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={`Video reference ${i + 1}`}
                      />
                    </div>
                  ) : entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-admin-border-subtle hover:bg-admin-bg-hover text-sm text-accent transition-colors"
                    >
                      <Play className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{entry.url}</span>
                      <ExternalLink className="w-3 h-3 text-admin-text-ghost flex-shrink-0 ml-auto" />
                    </a>
                  ) : null}
                  {entry.note && (
                    <p className="text-xs text-admin-text-muted mt-1.5 pl-1">{entry.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Deliverables ── */}
        {s.deliverables.length > 0 && (
          <div>
            <SectionLabel>Deliverables</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {s.deliverables.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-lg bg-admin-accent-bg text-accent text-xs font-medium border border-admin-accent-border">
                  {DELIVERABLE_LABELS[d] || d.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            {s.deliverable_notes && <p className="text-sm text-admin-text-secondary mt-2 leading-relaxed">{s.deliverable_notes}</p>}
          </div>
        )}

        <hr className="border-admin-border-subtle" />

        {/* ── Timeline ── */}
        <div>
          <SectionLabel>Timeline</SectionLabel>
          <div className={`rounded-xl border p-4 ${tl.bg} ${tl.border}`}>
            <p className={`text-sm font-semibold ${tl.text}`}>{TIMELINE_LABELS[s.timeline] || s.timeline}</p>
            {s.timeline_date && (
              <p className={`text-xs mt-1.5 ${tl.text} opacity-80`}>Target: {formatDate(s.timeline_date)}</p>
            )}
            {s.timeline_notes && (
              <p className="text-xs text-admin-text-secondary mt-1.5">{s.timeline_notes}</p>
            )}
          </div>
        </div>

        {/* ── Priority ── */}
        {s.priority_order.length > 0 && (
          <div>
            <SectionLabel>Priority</SectionLabel>
            <div className="flex gap-2">
              {s.priority_order.map((p, i) => {
                const colors = PRIORITY_COLORS[i] || PRIORITY_COLORS[2];
                return (
                  <div key={p} className={`flex-1 rounded-xl border p-3 text-center ${colors.bg} ${colors.border}`}>
                    <span className={`text-base font-bold block ${colors.text}`}>{i + 1}</span>
                    <span className={`text-xs font-medium capitalize ${colors.text}`}>{p}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <hr className="border-admin-border-subtle" />

        {/* ── Experience ── */}
        <div>
          <SectionLabel>Experience</SectionLabel>
          {(() => {
            const meta = EXPERIENCE_META[s.experience];
            return meta ? (
              <p className="text-sm text-admin-text-secondary">
                <span className="font-medium text-admin-text-primary">{meta.label}</span>
                <span className="text-admin-text-dim">{' — '}{meta.description}</span>
              </p>
            ) : (
              <p className="text-sm text-admin-text-secondary capitalize">{s.experience}</p>
            );
          })()}
          {s.experience_notes && (
            <p className="text-sm text-admin-text-secondary mt-1.5 whitespace-pre-wrap leading-relaxed">{s.experience_notes}</p>
          )}
        </div>

        {/* ── Partners ── */}
        {s.partners.length > 0 && (
          <div>
            <SectionLabel>Partners</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {s.partners.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-admin-success-bg text-admin-success text-xs font-medium border border-admin-success-border">
                  <Check size={12} className="flex-shrink-0" />
                  <span className="capitalize">{p.replace(/_/g, ' ')}</span>
                </span>
              ))}
            </div>
            {s.partner_details && <p className="text-sm text-admin-text-secondary mt-2 leading-relaxed">{s.partner_details}</p>}
          </div>
        )}

        <hr className="border-admin-border-subtle" />

        {/* ── Goals & Budget ── */}
        <div className="grid grid-cols-2 gap-4">
          <DetailBlock label="Public Goal" value={s.public_goal} />
          <DetailBlock label="Internal Goal" value={s.internal_goal} />
        </div>
        <DetailBlock label="Budget" value={s.budget} />
        <DetailBlock label="Email List Size" value={s.email_list_size} />

        {/* ── Files ── */}
        {s.file_urls.length > 0 && (
          <>
            <hr className="border-admin-border-subtle" />
            <div>
              <SectionLabel>Files</SectionLabel>
              <div className="space-y-1.5">
                {s.file_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-admin-border-subtle hover:bg-admin-bg-hover text-sm text-accent transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate flex-1">File {i + 1}</span>
                    <ExternalLink className="w-3 h-3 text-admin-text-ghost" />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        <DetailBlock label="Anything Else" value={s.anything_else} />
        <DetailBlock label="Referral" value={s.referral} />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg-wash flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Status */}
          <div className="relative">
            <select
              value={s.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="admin-input py-2.5 pl-3 pr-8 text-sm appearance-none"
            >
              {Object.entries(INTAKE_STATUSES).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-text-faint pointer-events-none" />
          </div>

          {/* Stub actions — match secondary button pattern */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg border border-admin-border text-sm text-admin-text-muted transition-colors disabled:opacity-40"
          >
            <FileDown size={14} />
            PDF
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg border border-admin-border text-sm text-admin-text-muted transition-colors disabled:opacity-40"
          >
            <Send size={14} />
            Email
          </button>
        </div>

        {/* Delete — icon button matching CompanyPanel pattern */}
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/60 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
          title="Delete submission"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-admin-text-dim uppercase tracking-wider font-medium mb-2">{children}</label>
  );
}

function DetailBlock({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-sm text-admin-text-secondary whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
