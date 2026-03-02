'use client';

import { useState, useMemo, useTransition, useCallback, useEffect, useRef } from 'react';
import {
  RefreshCw,
  FileText,
  Building2,
  Calendar,
  Users,
  Plug,
  Loader2,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { StatusBadge } from './StatusBadge';
import { MEETING_STATUSES } from './statusConfigs';
import { AdminDataTable, type ColDef } from './table';
import { MeetingPanel } from './MeetingPanel';
import {
  saveMeetingsConfig,
  triggerCalendarSync,
} from '../actions';
import type {
  MeetingWithRelations,
  MeetingsConfigRow,
} from '@/types/meetings';

interface Props {
  initialMeetings: MeetingWithRelations[];
  config: MeetingsConfigRow | null;
  clients: { id: string; name: string }[];
  contacts: { id: string; first_name: string; last_name: string }[];
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export function MeetingsManager({
  initialMeetings,
  config,
  clients,
  contacts,
}: Props) {
  const [meetings] = useState(initialMeetings);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [syncing, startSync] = useTransition();

  // Setup state
  const [icalUrl, setIcalUrl] = useState('');
  const [saving, startSave] = useTransition();

  const handleSync = useCallback(() => {
    startSync(async () => {
      try {
        await triggerCalendarSync();
        window.location.reload();
      } catch (err) {
        console.error('Sync failed:', err);
      }
    });
  }, []);

  // Auto-sync on mount if last sync was >1 hour ago
  const didAutoSync = useRef(false);
  useEffect(() => {
    if (!config || didAutoSync.current) return;
    didAutoSync.current = true;
    const lastSync = config.last_synced_at ? new Date(config.last_synced_at).getTime() : 0;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (lastSync < oneHourAgo) {
      handleSync();
    }
  }, [config, handleSync]);

  const handleSetup = useCallback(() => {
    if (!icalUrl.trim()) return;
    startSave(async () => {
      await saveMeetingsConfig(icalUrl.trim());
      window.location.reload();
    });
  }, [icalUrl]);

  const filtered = useMemo(() => {
    let list = meetings;

    // Tab filter
    if (tab !== 'all') {
      list = list.filter((m) => m.status === tab);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.meeting_attendees.some(
            (a) =>
              a.email.toLowerCase().includes(q) ||
              a.display_name?.toLowerCase().includes(q),
          ) ||
          m.meeting_relationships.some(
            (r) =>
              r.clients?.name.toLowerCase().includes(q) ||
              `${r.contacts?.first_name} ${r.contacts?.last_name}`
                .toLowerCase()
                .includes(q),
          ),
      );
    }

    return list;
  }, [meetings, tab, search]);

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId],
  );

  const columns: ColDef<MeetingWithRelations>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium truncate block max-w-[220px]">
          {row.title}
        </span>
      ),
    },
    {
      key: 'start_time',
      label: 'Date',
      defaultWidth: 160,
      sortable: true,
      sortValue: (row) => new Date(row.start_time).getTime(),
      render: (row) => (
        <div className="text-sm">
          <div className="text-admin-text-secondary">
            {new Date(row.start_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="text-admin-text-faint text-xs">
            {new Date(row.start_time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      defaultWidth: 80,
      render: (row) => {
        const mins = Math.round(
          (new Date(row.end_time).getTime() -
            new Date(row.start_time).getTime()) /
            60_000,
        );
        return <span className="text-sm text-admin-text-dim">{mins}m</span>;
      },
    },
    {
      key: 'attendees',
      label: 'Attendees',
      defaultWidth: 96,
      render: (row) => (
        <span className="flex items-center gap-1 text-sm text-admin-text-dim">
          <Users size={12} />
          {row.meeting_attendees.length}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      defaultWidth: 128,
      sortable: true,
      render: (row) => <StatusBadge status={row.status} config={MEETING_STATUSES} />,
    },
    {
      key: 'transcript',
      label: 'Transcript',
      defaultWidth: 112,
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-xs ${
            row.transcript_status === 'ready'
              ? 'text-admin-success'
              : row.transcript_status === 'pending'
                ? 'text-admin-warning'
                : row.transcript_status === 'failed'
                  ? 'text-admin-danger'
                  : 'text-admin-text-ghost'
          }`}
        >
          <FileText size={12} />
          {row.transcript_status === 'none' ? '—' : row.transcript_status}
        </span>
      ),
    },
    {
      key: 'companies',
      label: 'Companies',
      render: (row) => {
        const companyRels = row.meeting_relationships.filter((r) => r.clients);
        if (companyRels.length === 0)
          return <span className="text-admin-text-primary/15 text-xs">—</span>;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {companyRels.slice(0, 3).map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-admin-warning-bg text-admin-warning"
              >
                <Building2 size={10} />
                {r.clients!.name}
              </span>
            ))}
            {companyRels.length > 3 && (
              <span className="text-[10px] text-admin-text-faint">
                +{companyRels.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // ── Setup state ──────────────────────────────────────────────────────────
  if (!config) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminPageHeader title="Meetings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full text-center space-y-8 px-6">
            <div className="w-20 h-20 rounded-2xl bg-admin-bg-hover flex items-center justify-center mx-auto">
              <Calendar size={36} className="text-admin-text-faint" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Connect your calendar</h2>
              <p className="text-base text-admin-text-dim mt-3 leading-relaxed">
                Paste your Google Calendar iCal feed URL to start automatically
                tracking meetings and deploying Recall.AI bots.
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="url"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
                className="admin-input w-full px-4 py-3 text-sm"
              />
              <div className="flex justify-center">
                <button
                  onClick={handleSetup}
                  disabled={!icalUrl.trim() || saving}
                  className="btn-primary py-3 px-8 text-sm cursor-pointer"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plug size={14} />
                  )}
                  {saving ? 'Connecting…' : 'Connect Calendar'}
                </button>
              </div>
            </div>
            <p className="text-sm text-admin-text-ghost leading-relaxed">
              Find this in Google Calendar → Settings → Calendar settings →
              Secret address in iCal format
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Connected state ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminPageHeader
        title="Meetings"
        subtitle={
          config.last_synced_at
            ? `Last synced ${new Date(config.last_synced_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })} · Auto-syncs hourly`
            : 'Calendar connected · Auto-syncs hourly'
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search meetings…"
        actions={
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-primary px-4 py-2.5 text-sm cursor-pointer"
          >
            <RefreshCw
              size={14}
              className={syncing ? 'animate-spin' : ''}
            />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        }
        mobileActions={
          <button onClick={handleSync} disabled={syncing} className="btn-primary p-2.5 text-sm cursor-pointer" title="Sync Now">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
        }
      />

      <AdminDataTable
        data={filtered}
        columns={columns}
        storageKey="fna-table-meetings"
        toolbar
        sortable
        filterable
        columnVisibility
        columnReorder
        columnResize
        selectable
        freezePanes
        exportCsv
        onRowClick={(row) => setSelectedId(row.id)}
        selectedId={selectedId ?? undefined}
        emptyMessage={
          tab === 'all'
            ? 'No meetings synced yet. Click "Sync Now" to fetch from your calendar.'
            : `No ${tab.replace('_', ' ')} meetings.`
        }
        toolbarSlot={
          <>
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-1.5 px-[15px] py-[4px] rounded-lg text-sm font-medium transition-colors border ${
                  tab === t.value
                    ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                }`}
              >
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                  tab === t.value ? 'bg-admin-bg-active' : 'bg-admin-bg-hover text-admin-text-faint'
                }`}>
                  {t.value === 'all' ? meetings.length : meetings.filter((m) => m.status === t.value).length}
                </span>
              </button>
            ))}
          </>
        }
      />

      <MeetingPanel
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onClose={() => setSelectedId(null)}
        clients={clients}
        contacts={contacts}
      />
    </div>
  );
}
