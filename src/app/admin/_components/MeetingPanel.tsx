'use client';

import { useState, useTransition } from 'react';
import {
  X,
  ExternalLink,
  Users,
  Building2,
  User,
  Unlink,
  Bot,
} from 'lucide-react';
import { PanelDrawer } from './PanelDrawer';
import { AdminTabBar } from './AdminTabBar';
import { StatusBadge } from './AdminTable';
import { TranscriptViewer } from './TranscriptViewer';
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

const inputCls =
  'w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2 text-sm text-muted-foreground placeholder:text-[#303033] focus:outline-none focus:ring-1 focus:ring-white/20';

export function MeetingPanel({
  meeting,
  open,
  onClose,
  clients,
  contacts,
}: Props) {
  const [tab, setTab] = useState('details');
  const [linking, startLink] = useTransition();

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
    {
      value: 'transcript',
      label: 'Transcript',
      badge: transcript ? (
        <span className="ml-1 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5">
          ready
        </span>
      ) : undefined,
    },
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
      <div className="flex items-center gap-4 px-6 pt-5 pb-4 border-b border-[#2a2a2a]">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-medium truncate">{meeting.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 text-sm text-[#515155]">
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
            <StatusBadge value={meeting.status} />
            {meeting.recall_bot_status && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#303033]">
                <Bot size={10} />
                {meeting.recall_bot_status}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#404044] hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <X size={18} />
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
              <label className="text-xs text-[#303033] uppercase tracking-wider font-medium">
                Relationships
              </label>
              {meeting.meeting_relationships.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {meeting.meeting_relationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2.5 rounded-lg bg-white/5 border border-[#2a2a2a] px-3 py-2.5 group"
                    >
                      {rel.clients ? (
                        <>
                          <Building2
                            size={14}
                            className="text-amber-400 flex-shrink-0"
                          />
                          <span className="text-sm text-foreground truncate">
                            {rel.clients.name}
                          </span>
                        </>
                      ) : rel.contacts ? (
                        <>
                          <User
                            size={14}
                            className="text-sky-400 flex-shrink-0"
                          />
                          <span className="text-sm text-foreground truncate">
                            {rel.contacts.first_name} {rel.contacts.last_name}
                          </span>
                        </>
                      ) : null}
                      <span
                        className={`ml-auto text-[10px] rounded-full px-1.5 py-0.5 flex-shrink-0 ${
                          rel.match_type === 'auto'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-white/10 text-[#515155]'
                        }`}
                      >
                        {rel.match_type}
                      </span>
                      {rel.matched_email && (
                        <span className="text-[10px] text-[#202022] flex-shrink-0 hidden group-hover:inline">
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
                        className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/0 group-hover:text-[#303033] hover:!text-red-400 hover:!bg-red-500/10 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <Unlink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#202022]">
                  No relationships detected yet.
                </p>
              )}

              {/* Link dropdowns */}
              {(unlinkableClients.length > 0 ||
                unlinkableContacts.length > 0) && (
                <div className="mt-3 flex gap-2">
                  {unlinkableClients.length > 0 && (
                    <select
                      className={inputCls}
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        startLink(async () => {
                          await linkMeetingToCompany(
                            meeting.id,
                            e.target.value,
                          );
                        });
                        e.target.value = '';
                      }}
                      disabled={linking}
                    >
                      <option value="" disabled>
                        + Link company…
                      </option>
                      {unlinkableClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {unlinkableContacts.length > 0 && (
                    <select
                      className={inputCls}
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        startLink(async () => {
                          await linkMeetingToContact(
                            meeting.id,
                            e.target.value,
                          );
                        });
                        e.target.value = '';
                      }}
                      disabled={linking}
                    >
                      <option value="" disabled>
                        + Link contact…
                      </option>
                      {unlinkableContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* ── Meeting link ── */}
            {meeting.meeting_url && (
              <div>
                <label className="text-xs text-[#303033] uppercase tracking-wider font-medium">
                  Meeting Link
                </label>
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors truncate"
                >
                  <ExternalLink size={12} className="flex-shrink-0" />
                  <span className="truncate">{meeting.meeting_url}</span>
                </a>
              </div>
            )}

            {/* ── Attendees ── */}
            <div>
              <label className="text-xs text-[#303033] uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Users size={12} />
                Attendees ({meeting.meeting_attendees.length})
              </label>
              <div className="mt-2 space-y-1.5">
                {meeting.meeting_attendees.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 border border-[#2a2a2a] px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-foreground truncate block">
                        {att.display_name || att.email}
                      </span>
                      {att.display_name && (
                        <span className="text-[#303033] text-xs">
                          {att.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {att.is_organizer && (
                        <span className="text-[10px] text-[#303033] uppercase">
                          organizer
                        </span>
                      )}
                      {att.response_status && (
                        <StatusBadge value={att.response_status} />
                      )}
                    </div>
                  </div>
                ))}
                {meeting.meeting_attendees.length === 0 && (
                  <p className="text-sm text-[#202022]">
                    No attendees
                  </p>
                )}
              </div>
            </div>

            {/* ── Description ── */}
            {meeting.description && (
              <div>
                <label className="text-xs text-[#303033] uppercase tracking-wider font-medium">
                  Description
                </label>
                <p className="mt-1.5 text-sm text-[#404044] whitespace-pre-wrap leading-relaxed break-words">
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
          />
        )}
      </div>
    </PanelDrawer>
  );
}
