'use client';

import { useState, useRef } from 'react';
import {
  ClipboardList, X, ExternalLink,
  Building2, User, FileText, Link2, UserPlus, Check,
  Hammer, Rocket, TrendingUp, Coins, BadgeDollarSign,
  Send, Play,
  // Deliverable icons
  Target, Type, Palette, Code, Globe, MailOpen, Megaphone,
  Star, Sparkles, Package, Eye, Heart, Briefcase, MessageSquare,
  // Experience icons
  Home, Flame, Trophy,
  // Partner icons
  BarChart3, PenTool, Camera, Share2, Search as SearchIcon, HeartHandshake,
} from 'lucide-react';
import { QuoteSummaryCard } from './QuoteSummaryCard';
import { IntakeCompanyCard } from './IntakeCompanyCard';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { AdminDataTable } from '../../_components/table/AdminDataTable';
import type { ColDef } from '../../_components/table/types';
import { PanelDrawer } from '../../_components/PanelDrawer';
import { SaveDot } from '../../_components/SaveDot';
import type { AutoSaveStatus } from '../../_hooks/useAutoSave';
import { StatusBadge } from '../../_components/StatusBadge';
import { INTAKE_STATUSES } from '../../_components/statusConfigs';
import { updateIntakeSubmission, batchDeleteIntakeSubmissions } from '../../actions';
import type { IntakeSubmission, ClientRow } from '../../actions';
import type { ContactRow } from '@/types/proposal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'Urgent',
  soon: 'Within 6 Weeks',
  later: '2+ Months',
  specific: 'Specific Date',
  unsure: 'Flexible',
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

const EXPERIENCE_META: Record<string, { label: string; description: string; Icon: React.ElementType }> = {
  none:        { label: 'First Time',      description: 'Brand new to professional video',           Icon: Sparkles },
  inhouse:     { label: 'In-House Only',   description: 'Handled it themselves so far',              Icon: Home },
  some:        { label: 'Some Experience',  description: 'Worked with a production team before',     Icon: Flame },
  experienced: { label: 'Experienced',     description: 'Video is a regular part of their strategy', Icon: Trophy },
};

const DELIVERABLE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  consulting:             { label: 'Consulting',            Icon: FileText },
  brand_strategy:         { label: 'Brand Strategy',        Icon: Target },
  copywriting:            { label: 'Copywriting',           Icon: Type },
  logo_design:            { label: 'Logo Design',           Icon: Palette },
  web_design:             { label: 'Web Design',            Icon: Code },
  landing_page:           { label: 'Launch Page',           Icon: Globe },
  email_campaign:         { label: 'Email Campaigns',       Icon: MailOpen },
  ads:                    { label: 'Ad Creative',           Icon: Megaphone },
  flagship:               { label: 'Flagship Video',        Icon: Star },
  motion_graphics:        { label: 'Motion Graphics',       Icon: Sparkles },
  social_cuts:            { label: 'Social Cutdowns',       Icon: Play },
  gifs:                   { label: 'GIFs & Web Loops',      Icon: Rocket },
  photography_product:    { label: 'Product Photography',   Icon: Package },
  photography_lifestyle:  { label: 'Lifestyle Photography', Icon: Eye },
  testimonials:           { label: 'Testimonials',          Icon: Heart },
  pitch_video:            { label: 'Pitch Video',           Icon: Briefcase },
  all:                    { label: 'All of the Above',      Icon: Check },
  unsure:                 { label: 'Help Us Decide',        Icon: MessageSquare },
};

const PARTNER_META: Record<string, { label: string; Icon: React.ElementType }> = {
  ad_tracking:      { label: 'Ad Tracking',      Icon: BarChart3 },
  pr:               { label: 'Public Relations',  Icon: Megaphone },
  email_list:       { label: 'Email List Gen',    Icon: MailOpen },
  landing_page:     { label: 'Landing Page',      Icon: Globe },
  marketing_agency: { label: 'Marketing Agency',  Icon: PenTool },
  photographer:     { label: 'Photographer',      Icon: Camera },
  web_dev:          { label: 'Web Developer',     Icon: Code },
  social_media:     { label: 'Social Media',      Icon: Share2 },
  interviewing:     { label: 'Interviewing',      Icon: SearchIcon },
  none:             { label: 'None Yet',           Icon: X },
  open_to_recs:     { label: 'Open to Recs',      Icon: HeartHandshake },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(value: string) {
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return value;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
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
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const trackSave = (promise: Promise<unknown>) => {
    setSaveStatus('saving');
    clearTimeout(savedTimerRef.current);
    promise
      .then(() => {
        setSaveStatus('saved');
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
      })
      .catch(() => setSaveStatus('error'));
  };

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.project_name.toLowerCase().includes(q) ||
      (s.pitch && s.pitch.toLowerCase().includes(q))
    );
  });

  const handleStatusChange = (id: string, status: string) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    trackSave(updateIntakeSubmission(id, { status } as Partial<IntakeSubmission>));
  };

  const handleLink = (id: string, field: 'client_id' | 'contact_id', value: string | null) => {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, [field]: value } : prev);
    trackSave(updateIntakeSubmission(id, { [field]: value } as Partial<IntakeSubmission>));
  };


  const columns: ColDef<IntakeSubmission>[] = [
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      sortValue: (s) => `${s.first_name} ${s.last_name}`.toLowerCase(),
      searchable: true,
      render: (s) => (
        <div>
          <div className="font-medium text-admin-text-primary">{s.first_name} {s.last_name}</div>
          <div className="text-xs text-admin-text-dim">{s.email}</div>
        </div>
      ),
    },
    {
      key: 'project_name',
      label: 'Project',
      type: 'text',
      sortable: true,
      searchable: true,
      maxWidth: 200,
      render: (s) => (
        <span className="text-admin-text-secondary truncate">{s.project_name}</span>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      type: 'select',
      sortable: true,
      options: Object.entries(TIMELINE_LABELS).map(([value, label]) => ({ value, label })),
      render: (s) => (
        <span className="text-admin-text-muted text-xs">{TIMELINE_LABELS[s.timeline] || s.timeline}</span>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      type: 'text',
      sortable: true,
      render: (s) => (
        <span className="text-admin-text-muted text-xs">{s.budget || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      sortable: true,
      options: Object.entries(INTAKE_STATUSES).map(([value, { label }]) => ({ value, label })),
      render: (s) => <StatusBadge status={s.status} config={INTAKE_STATUSES} />,
    },
    {
      key: 'client_id',
      label: 'Linked',
      sortable: true,
      sortValue: (s) => {
        const c = s.client_id ? clients.find((cl) => cl.id === s.client_id) : null;
        return c ? c.name.toLowerCase() : '';
      },
      render: (s) => {
        const linkedClient = s.client_id ? clients.find((c) => c.id === s.client_id) : null;
        return linkedClient ? (
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <Building2 className="w-3 h-3" />
            {linkedClient.name}
          </span>
        ) : <span className="text-xs text-admin-text-dim">—</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Submitted',
      type: 'date',
      sortable: true,
      sortValue: (s) => s.created_at,
      render: (s) => (
        <span className="text-admin-text-dim text-xs">{formatDate(s.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Intake Submissions"
        icon={ClipboardList}
        subtitle={`${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search submissions..."
      />

      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-intake"
        toolbar
        sortable
        filterable
        columnVisibility
        columnReorder
        columnResize
        selectable
        search={search}
        onBatchDelete={async (ids) => {
          await batchDeleteIntakeSubmissions(ids);
          setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)));
          if (selected && ids.includes(selected.id)) setSelected(null);
        }}
        onRowClick={(row) => setSelected(row)}
        selectedId={selected?.id}
        emptyMessage={search ? 'No submissions match your search.' : 'No intake submissions yet.'}
      />

      {/* Detail Drawer */}
      <PanelDrawer open={!!selected} onClose={() => setSelected(null)} width="w-[560px]">
        {selected && (
          <IntakeDetailPanel
            submission={selected}
            clients={clients}
            saveStatus={saveStatus}
            onStatusChange={(status) => handleStatusChange(selected.id, status)}
            onLinkClient={(id) => handleLink(selected.id, 'client_id', id)}
            onClose={() => setSelected(null)}
          />
        )}
      </PanelDrawer>
    </div>
  );
}

// ── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ name, email, title, nickname }: {
  name: string;
  email: string;
  title?: string;
  nickname?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-admin-bg-raised border border-admin-border-subtle">
      <div className="w-10 h-10 rounded-lg bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-admin-text-dim" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-admin-text-primary truncate">
          {name}{nickname && <span className="text-admin-text-muted font-normal"> &quot;{nickname}&quot;</span>}
        </p>
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

type DetailTab = 'overview' | 'creative' | 'quote' | 'files';
const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'creative', label: 'Creative' },
  { key: 'quote', label: 'Quote' },
  { key: 'files', label: 'Files' },
];

function IntakeDetailPanel({
  submission: s,
  clients,
  saveStatus,
  onStatusChange,
  onLinkClient,
  onClose,
}: {
  submission: IntakeSubmission;
  clients: ClientRow[];
  saveStatus: AutoSaveStatus;
  onStatusChange: (status: string) => void;
  onLinkClient: (id: string | null) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const stakeholderEntries = s.stakeholders ? parseStakeholders(s.stakeholders) : [];
  const tl = TIMELINE_COLORS[s.timeline] || TIMELINE_COLORS.unsure;
  const hasFiles = s.file_urls.length > 0;
  const visibleTabs = hasFiles ? DETAIL_TABS : DETAIL_TABS.filter((t) => t.key !== 'files');

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-admin-border flex-shrink-0 bg-admin-bg-sidebar">
        <div className="w-10 h-10 rounded-admin-sm bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
          <Link2 size={16} className="text-admin-text-faint" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-admin-text-primary truncate">{s.project_name}</h2>
          {s.company_name && (
            <p className="text-sm text-admin-text-muted truncate">{s.company_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveDot status={saveStatus} />
          <StatusBadge status={s.status} config={INTAKE_STATUSES} />
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-admin-bg-active text-admin-text-primary'
                : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-6">

        {/* ════════ OVERVIEW TAB ════════ */}
        {tab === 'overview' && (
          <>
            {/* People */}
            <div>
              <SectionLabel>People</SectionLabel>
              <div className="space-y-2">
                <ContactCard
                  name={`${s.first_name} ${s.last_name}`.trim()}
                  email={s.email}
                  title={s.title || undefined}
                  nickname={s.nickname || undefined}
                />
                {stakeholderEntries.map((sh, i) => (
                  <ContactCard key={i} name={sh.name} email={sh.email} title={sh.title || undefined} />
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <SectionLabel>Company</SectionLabel>
              <IntakeCompanyCard submission={s} clients={clients} onLinkClient={onLinkClient} />
            </div>

            {/* Status */}
            <div>
              <SectionLabel>Status</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(INTAKE_STATUSES).map(([key, cfg]) => {
                  const isActive = s.status === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onStatusChange(key)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        isActive
                          ? cfg.className + ' border-current'
                          : 'border-admin-border-subtle bg-transparent text-admin-text-muted/25 hover:text-admin-text-faint hover:border-admin-border'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-admin-border-subtle" />

            {/* Services */}
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

            <hr className="border-admin-border-subtle" />

            {/* Timeline */}
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

            {/* Priority */}
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

            {/* Experience */}
            <div>
              <SectionLabel>Experience</SectionLabel>
              {(() => {
                const meta = EXPERIENCE_META[s.experience];
                return meta ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-admin-bg-hover flex items-center justify-center flex-shrink-0">
                      <meta.Icon size={14} className="text-admin-text-dim" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-admin-text-primary">{meta.label}</span>
                      <span className="text-sm text-admin-text-dim">{' — '}{meta.description}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-admin-text-secondary capitalize">{s.experience}</p>
                );
              })()}
              {s.experience_notes && (
                <p className="text-sm text-admin-text-secondary mt-1.5 whitespace-pre-wrap leading-relaxed">{s.experience_notes}</p>
              )}
            </div>

            {/* Partners */}
            {s.partners.length > 0 && (
              <div>
                <SectionLabel>Partners</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {s.partners.map((p) => {
                    const meta = PARTNER_META[p];
                    const Icon = meta?.Icon || Check;
                    return (
                      <span key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-admin-success-bg text-admin-success text-xs font-medium border border-admin-success-border">
                        <Icon size={12} className="flex-shrink-0" />
                        <span>{meta?.label || p.replace(/_/g, ' ')}</span>
                      </span>
                    );
                  })}
                </div>
                {s.partner_details && <p className="text-sm text-admin-text-secondary mt-2 leading-relaxed">{s.partner_details}</p>}
              </div>
            )}

            <DetailBlock label="Referral" value={s.referral} />
            <DetailBlock label="Anything Else" value={s.anything_else} />
          </>
        )}

        {/* ════════ CREATIVE TAB ════════ */}
        {tab === 'creative' && (
          <>
            <DetailBlock label="One-Liner" value={s.pitch} />
            <DetailBlock label="What Excites Them" value={s.excitement} />
            <DetailBlock label="Key Feature" value={s.key_feature} />
            <DetailBlock label="Vision" value={s.vision} />
            <DetailBlock label="What to Avoid" value={s.avoid} />
            <DetailBlock label="Target Audience" value={s.audience} />
            <DetailBlock label="Challenge" value={s.challenge} />

            {/* Deliverables */}
            {s.deliverables.length > 0 && (
              <>
                <hr className="border-admin-border-subtle" />
                <div>
                  <SectionLabel>Deliverables</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {s.deliverables.map((d) => {
                      const meta = DELIVERABLE_META[d];
                      const Icon = meta?.Icon;
                      return (
                        <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-admin-accent-bg text-accent text-xs font-medium border border-admin-accent-border">
                          {Icon && <Icon size={12} className="flex-shrink-0" />}
                          {meta?.label || d.replace(/_/g, ' ')}
                        </span>
                      );
                    })}
                  </div>
                  {s.deliverable_notes && <p className="text-sm text-admin-text-secondary mt-2 leading-relaxed">{s.deliverable_notes}</p>}
                </div>
              </>
            )}

            {/* Competitors */}
            {s.competitors && s.competitors.length > 0 && (
              <>
                <hr className="border-admin-border-subtle" />
                <div>
                  <SectionLabel>Competitors</SectionLabel>
                  <div className="space-y-1.5">
                    {s.competitors.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-admin-border-subtle hover:bg-admin-bg-hover text-sm text-accent transition-colors"
                      >
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate flex-1">{c.url}</span>
                        {c.note && <span className="text-admin-text-muted text-xs flex-shrink-0">{c.note}</span>}
                        <ExternalLink className="w-3 h-3 text-admin-text-ghost flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Video References */}
            {s.video_links && (
              <>
                <hr className="border-admin-border-subtle" />
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
              </>
            )}

            {/* Empty state */}
            {!s.pitch && !s.excitement && !s.key_feature && !s.vision && !s.avoid && !s.audience && !s.challenge && s.deliverables.length === 0 && !s.video_links && (!s.competitors || s.competitors.length === 0) && (
              <p className="text-sm text-admin-text-dim text-center py-8">No creative details provided</p>
            )}
          </>
        )}

        {/* ════════ QUOTE TAB ════════ */}
        {tab === 'quote' && (
          <>
            {/* Goals (crowdfunding) */}
            {s.phases?.includes('crowdfunding') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <DetailBlock label="Public Goal" value={s.public_goal ? formatCurrency(s.public_goal) : null} />
                  <DetailBlock label="Internal Goal" value={s.internal_goal ? formatCurrency(s.internal_goal) : null} />
                </div>
                <DetailBlock label="Email List Size" value={s.email_list_size} />
                <hr className="border-admin-border-subtle" />
              </>
            )}

            <DetailBlock label="Budget" value={s.budget} />

            <div>
              <SectionLabel>Quote</SectionLabel>
              <QuoteSummaryCard quoteData={s.quote_data} budgetInteracted={s.budget_interacted} />
            </div>
          </>
        )}

        {/* ════════ FILES TAB ════════ */}
        {tab === 'files' && (
          <>
            {s.file_urls.length > 0 ? (
              <div>
                <SectionLabel>Uploaded Files</SectionLabel>
                <div className="space-y-1.5">
                  {s.file_urls.map((url, i) => {
                    const filename = url.split('/').pop() || `File ${i + 1}`;
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-admin-border-subtle hover:bg-admin-bg-hover text-sm text-accent transition-colors"
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate flex-1">{filename}</span>
                        <ExternalLink className="w-3 h-3 text-admin-text-ghost" />
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-admin-text-dim text-center py-8">No files uploaded</p>
            )}
          </>
        )}
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
