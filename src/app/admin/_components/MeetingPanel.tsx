'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  X,
  ExternalLink,
  Users,
  Building2,
  User,
  Unlink,
  Bot,
} from 'lucide-react';
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';
import { AdminCombobox } from './AdminCombobox';
import { PanelDrawer } from './PanelDrawer';
import { AdminTabBar } from './AdminTabBar';
import { StatusBadge } from './StatusBadge';
import { MEETING_STATUSES } from './statusConfigs';
import { TranscriptViewer } from './TranscriptViewer';
import { MeetingInsights } from './MeetingInsights';
import {
  linkMeetingToCompany,
  linkMeetingToContact,
  unlinkMeetingRelationship,
} from '../actions';
import type { MeetingWithRelations, TranscriptSegment } from '@/types/meetings';

interface Props {
  meeting: MeetingWithRelations | null;
  open: boolean;
  onClose: () => void;
  clients: { id: string; name: string }[];
  contacts: { id: string; first_name: string; last_name: string }[];
}

export function MeetingPanel({
  meeting,
  open,
  onClose,
  clients,
  contacts,
}: Props) {
  const [tab, setTab] = useState('details');
  const [linking, startLink] = useTransition();
  const { setPanelContext } = useChatContext();

  /* ── Chat panel context ── */
  useEffect(() => {
    if (!meeting?.id) return;

    const lines: string[] = [];
    lines.push(`Title: ${meeting.title}`);
    lines.push(`Status: ${meeting.status}`);
    lines.push(`Date: ${meeting.start_time}`);
    lines.push(`Start Time: ${new Date(meeting.start_time).toLocaleTimeString()}`);
    lines.push(`End Time: ${new Date(meeting.end_time).toLocaleTimeString()}`);

    const dur =
      meeting.start_time && meeting.end_time
        ? Math.round(
            (new Date(meeting.end_time).getTime() -
              new Date(meeting.start_time).getTime()) /
              60_000,
          )
        : null;
    if (dur !== null) lines.push(`Duration: ${dur} minutes`);

    if (meeting.meeting_url) lines.push(`Meeting URL: ${meeting.meeting_url}`);
    if (meeting.description) lines.push(`Description: ${meeting.description}`);
    if (meeting.organizer_email)
      lines.push(`Organizer Email: ${meeting.organizer_email}`);
    if (meeting.recall_bot_status)
      lines.push(`Bot Status: ${meeting.recall_bot_status}`);

    // Attendees
    if (meeting.meeting_attendees.length > 0) {
      lines.push('');
      lines.push('--- Attendees ---');
      meeting.meeting_attendees.forEach((att) => {
        const namePart = att.display_name || att.email;
        const role = att.is_organizer ? ' (organizer)' : '';
        const response = att.response_status ? ` [${att.response_status}]` : '';
        lines.push(`- ${namePart}${role}${response} — ${att.email}`);
      });
    }

    // Linked companies
    const linkedCompanies = meeting.meeting_relationships
      .filter((r) => r.clients)
      .map((r) => r.clients!.name);
    if (linkedCompanies.length > 0) {
      lines.push('');
      lines.push('--- Linked Companies ---');
      linkedCompanies.forEach((name) => lines.push(`- ${name}`));
    }

    // Linked contacts
    const linkedContacts = meeting.meeting_relationships
      .filter((r) => r.contacts)
      .map((r) => `${r.contacts!.first_name} ${r.contacts!.last_name}`);
    if (linkedContacts.length > 0) {
      lines.push('');
      lines.push('--- Linked Contacts ---');
      linkedContacts.forEach((name) => lines.push(`- ${name}`));
    }

    // Transcript
    const transcript = meeting.meeting_transcripts;
    if (transcript?.formatted_text) {
      lines.push('');
      lines.push('--- Full Transcript ---');
      lines.push(transcript.formatted_text);
    }

    // Insights summary
    if (transcript?.summary) {
      lines.push('');
      lines.push('--- Insights Summary ---');
      lines.push(transcript.summary);
    }

    // Action items
    if (transcript?.action_items && transcript.action_items.length > 0) {
      lines.push('');
      lines.push('--- Action Items ---');
      transcript.action_items.forEach((item) => {
        const assignee = item.assignee ? ` (${item.assignee})` : '';
        const done = item.done ? ' [DONE]' : '';
        lines.push(`- ${item.text}${assignee}${done}`);
      });
    }

    setPanelContext({
      recordType: 'meeting',
      recordId: meeting.id,
      recordLabel: meeting.title || 'Untitled Meeting',
      summary: lines.join('\n'),
    });

    return () => setPanelContext(null);
  }, [meeting, setPanelContext]);

  if (!meeting) return null;

  const duration =
    meeting.start_time && meeting.end_time
      ? Math.round(
          (new Date(meeting.end_time).getTime() -
            new Date(meeting.start_time).getTime()) /
            60_000,
        )
      : null;

  const transcript = meeting.meeting_transcripts;
  const transcriptSegments: TranscriptSegment[] = transcript?.raw_transcript
    ? (transcript.raw_transcript as unknown as TranscriptSegment[])
    : [];

  const tabs = [
    { value: 'details', label: 'Details' },
    { value: 'transcript', label: 'Transcript' },
    { value: 'insights', label: 'Insights' },
  ];

  const linkedClientIds = new Set(
    meeting.meeting_relationships
      .filter((r) => r.client_id)
      .map((r) => r.client_id),
  );
  const linkedContactIds = new Set(
    meeting.meeting_relationships
      .filter((r) => r.contact_id)
      .map((r) => r.contact_id),
  );
  const unlinkableClients = clients.filter((c) => !linkedClientIds.has(c.id));
  const unlinkableContacts = contacts.filter(
    (c) => !linkedContactIds.has(c.id),
  );

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[540px]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-admin-border bg-admin-bg-sidebar">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{meeting.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-admin-text-faint">
            <span>
              {new Date(meeting.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>·</span>
            <span>
              {new Date(meeting.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            {duration && (
              <>
                <span>·</span>
                <span>{duration} min</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={meeting.status} config={MEETING_STATUSES} />
            {meeting.recall_bot_status && (
              <span className="inline-flex items-center gap-1 text-[10px] text-admin-text-placeholder">
                <Bot size={10} />
                {meeting.recall_bot_status}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-ghost hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <AdminTabBar tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden admin-scrollbar">
        {tab === 'details' && (
          <div className="px-6 py-5 space-y-5">
            {/* ── Relationships ── */}
            <div>
              <label className="text-admin-sm text-admin-text-placeholder uppercase tracking-wider font-medium">
                Relationships
              </label>
              {meeting.meeting_relationships.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {meeting.meeting_relationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2.5 rounded-lg bg-admin-bg-hover border border-admin-border px-3 py-2.5 group"
                    >
                      {rel.clients ? (
                        <>
                          <Building2
                            size={14}
                            className="text-admin-warning flex-shrink-0"
                          />
                          <span className="text-sm text-admin-text-primary truncate">
                            {rel.clients.name}
                          </span>
                        </>
                      ) : rel.contacts ? (
                        <>
                          <User
                            size={14}
                            className="text-admin-info flex-shrink-0"
                          />
                          <span className="text-sm text-admin-text-primary truncate">
                            {rel.contacts.first_name} {rel.contacts.last_name}
                          </span>
                        </>
                      ) : null}
                      <span
                        className={`ml-auto text-[10px] rounded-full px-1.5 py-0.5 flex-shrink-0 ${
                          rel.match_type === 'auto'
                            ? 'bg-admin-accent-bg text-admin-accent'
                            : 'bg-admin-bg-active text-admin-text-faint'
                        }`}
                      >
                        {rel.match_type}
                      </span>
                      {rel.matched_email && (
                        <span className="text-[10px] text-admin-text-placeholder flex-shrink-0 hidden group-hover:inline">
                          {rel.matched_email}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          startLink(async () => {
                            await unlinkMeetingRelationship(rel.id);
                          })
                        }
                        disabled={linking}
                        className="w-6 h-6 flex items-center justify-center rounded text-admin-text-muted/0 group-hover:text-admin-text-placeholder hover:!text-admin-danger hover:bg-admin-danger-bg transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <Unlink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-admin-text-placeholder">
                  No relationships detected yet.
                </p>
              )}

              {/* Link dropdowns */}
              {(unlinkableClients.length > 0 ||
                unlinkableContacts.length > 0) && (
                <div className="mt-3 flex gap-2">
                  {unlinkableClients.length > 0 && (
                    <AdminCombobox
                      value={null}
                      options={unlinkableClients.map((c) => ({ id: c.id, label: c.name }))}
                      onChange={(v) => {
                        if (!v) return;
                        startLink(async () => {
                          await linkMeetingToCompany(meeting.id, v);
                        });
                      }}
                      placeholder="+ Link company…"
                      nullable={false}
                      disabled={linking}
                    />
                  )}
                  {unlinkableContacts.length > 0 && (
                    <AdminCombobox
                      value={null}
                      options={unlinkableContacts.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }))}
                      onChange={(v) => {
                        if (!v) return;
                        startLink(async () => {
                          await linkMeetingToContact(meeting.id, v);
                        });
                      }}
                      placeholder="+ Link contact…"
                      nullable={false}
                      disabled={linking}
                    />
                  )}
                </div>
              )}
            </div>

            {/* ── Meeting link ── */}
            {meeting.meeting_url && (
              <div>
                <label className="text-admin-sm text-admin-text-placeholder uppercase tracking-wider font-medium">
                  Meeting Link
                </label>
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-1.5 text-sm text-admin-info hover:text-sky-300 transition-colors truncate"
                >
                  <ExternalLink size={12} className="flex-shrink-0" />
                  <span className="truncate">{meeting.meeting_url}</span>
                </a>
              </div>
            )}

            {/* ── Attendees ── */}
            <div>
              <label className="text-admin-sm text-admin-text-placeholder uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Users size={12} />
                Attendees ({meeting.meeting_attendees.length})
              </label>
              <div className="mt-2 space-y-1.5">
                {meeting.meeting_attendees.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-lg bg-admin-bg-hover border border-admin-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-admin-text-primary truncate block">
                        {att.display_name || att.email}
                      </span>
                      {att.display_name && (
                        <span className="text-admin-text-placeholder text-xs">
                          {att.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {att.is_organizer && (
                        <span className="text-[10px] text-admin-text-placeholder uppercase">
                          organizer
                        </span>
                      )}
                      {att.response_status && (
                        <StatusBadge status={att.response_status} config={MEETING_STATUSES} />
                      )}
                    </div>
                  </div>
                ))}
                {meeting.meeting_attendees.length === 0 && (
                  <p className="text-sm text-admin-text-placeholder">
                    No attendees
                  </p>
                )}
              </div>
            </div>

            {/* ── Description ── */}
            {meeting.description && (
              <div>
                <label className="text-admin-sm text-admin-text-placeholder uppercase tracking-wider font-medium">
                  Description
                </label>
                <p className="mt-1.5 text-sm text-admin-text-ghost whitespace-pre-wrap leading-relaxed break-words">
                  {meeting.description}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'transcript' && (
          <TranscriptViewer
            segments={transcriptSegments}
            formattedText={transcript?.formatted_text}
            attendees={meeting.meeting_attendees}
          />
        )}

        {tab === 'insights' && (
          <MeetingInsights
            meetingId={meeting.id}
            transcript={transcript}
          />
        )}
      </div>
    </PanelDrawer>
  );
}
