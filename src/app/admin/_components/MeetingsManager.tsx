'use client';

import { useState, useMemo, useTransition, useCallback } from 'react';
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
import { AdminTabBar } from './AdminTabBar';
import { AdminTable, StatusBadge, type ColumnDef } from './AdminTable';
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
  const [sortKey, setSortKey] = useState('start_time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Setup state
  const [icalUrl, setIcalUrl] = useState('');
  const [saving, startSave] = useTransition();

  const handleSync = useCallback(() => {
    startSync(async () => {
      const result = await triggerCalendarSync();
      // Refresh will happen via revalidatePath, but update local state for immediate feedback
      console.log('Sync result:', result);
      window.location.reload();
    });
  }, []);

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

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'start_time') {
        cmp =
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      } else if (sortKey === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [meetings, tab, search, sortKey, sortDir]);

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId],
  );

  const handleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  const columns: ColumnDef<MeetingWithRelations>[] = [
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
      width: 'w-40',
      sortable: true,
      render: (row) => (
        <div className="text-sm">
          <div className="text-white/70">
            {new Date(row.start_time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="text-white/30 text-xs">
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
      width: 'w-20',
      render: (row) => {
        const mins = Math.round(
          (new Date(row.end_time).getTime() -
            new Date(row.start_time).getTime()) /
            60_000,
        );
        return <span className="text-sm text-white/40">{mins}m</span>;
      },
    },
    {
      key: 'attendees',
      label: 'Attendees',
      width: 'w-24',
      render: (row) => (
        <span className="flex items-center gap-1 text-sm text-white/40">
          <Users size={12} />
          {row.meeting_attendees.length}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-32',
      sortable: true,
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: 'transcript',
      label: 'Transcript',
      width: 'w-28',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-xs ${
            row.transcript_status === 'ready'
              ? 'text-emerald-400'
              : row.transcript_status === 'pending'
                ? 'text-amber-400'
                : row.transcript_status === 'failed'
                  ? 'text-red-400'
                  : 'text-white/20'
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
          return <span className="text-white/15 text-xs">—</span>;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {companyRels.slice(0, 3).map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300"
              >
                <Building2 size={10} />
                {r.clients!.name}
              </span>
            ))}
            {companyRels.length > 3 && (
              <span className="text-[10px] text-white/30">
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
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              <Calendar size={36} className="text-white/30" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Connect your calendar</h2>
              <p className="text-base text-white/40 mt-3 leading-relaxed">
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
            <p className="text-sm text-white/25 leading-relaxed">
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
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search meetings…"
        rightContent={
          config.last_synced_at && (
            <span className="text-xs text-white/20 flex-shrink-0">
              Synced{' '}
              {new Date(config.last_synced_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )
        }
        actions={
          <button
            onClick={handleSync}
            disabled={syncing}
            className="admin-btn flex items-center gap-1.5 text-sm"
          >
            <RefreshCw
              size={14}
              className={syncing ? 'animate-spin' : ''}
            />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        }
      />

      <AdminTabBar
        tabs={TABS.map((t) => ({
          ...t,
          badge:
            t.value !== 'all' ? (
              <span className="ml-1 text-[10px] text-white/30">
                {meetings.filter((m) => m.status === t.value).length || ''}
              </span>
            ) : (
              <span className="ml-1 text-[10px] text-white/30">
                {meetings.length}
              </span>
            ),
        }))}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="flex-1 overflow-y-auto">
        <AdminTable
          data={filtered}
          columns={columns}
          onRowClick={(row) => setSelectedId(row.id)}
          selectedId={selectedId ?? undefined}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          emptyMessage={
            tab === 'all'
              ? 'No meetings synced yet. Click "Sync Now" to fetch from your calendar.'
              : `No ${tab.replace('_', ' ')} meetings.`
          }
        />
      </div>

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
