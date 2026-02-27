'use client';

import { useState, useTransition } from 'react';
import {
  X,
  ExternalLink,
  Users,
  Building2,
  User,
  Link2,
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

  const duration = meeting.start_time && meeting.end_time
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
    { value: 'transcript', label: 'Transcript', badge: transcript ? (
      <span className="ml-1 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5">
        ready
      </span>
    ) : undefined },
    { value: 'relationships', label: 'Relationships', badge: meeting.meeting_relationships.length > 0 ? (
      <span className="ml-1 text-[10px] rounded-full bg-white/10 text-white/60 px-1.5 py-0.5">
        {meeting.meeting_relationships.length}
      </span>
    ) : undefined },
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
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{meeting.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-white/40">
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
                <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
                  <Bot size={10} />
                  {meeting.recall_bot_status}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <AdminTabBar tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'details' && (
          <div className="px-6 py-4 space-y-6">
            {/* Meeting link */}
            {meeting.meeting_url && (
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider">
                  Meeting Link
                </label>
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-1 text-sm text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <ExternalLink size={12} />
                  {meeting.meeting_url.length > 50
                    ? meeting.meeting_url.slice(0, 50) + '…'
                    : meeting.meeting_url}
                </a>
              </div>
            )}

            {/* Description */}
            {meeting.description && (
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider">
                  Description
                </label>
                <p className="mt-1 text-sm text-white/60 whitespace-pre-wrap">
                  {meeting.description}
                </p>
              </div>
            )}

            {/* Attendees */}
            <div>
              <label className="text-xs text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} />
                Attendees ({meeting.meeting_attendees.length})
              </label>
              <div className="mt-2 space-y-1.5">
                {meeting.meeting_attendees.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] text-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-white/80 truncate block">
                        {att.display_name || att.email}
                      </span>
                      {att.display_name && (
                        <span className="text-white/30 text-xs">
                          {att.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {att.is_organizer && (
                        <span className="text-[10px] text-white/30 uppercase">
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
                  <p className="text-sm text-white/20">No attendees</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'transcript' && (
          <TranscriptViewer
            segments={transcriptSegments}
            formattedText={transcript?.formatted_text}
          />
        )}

        {tab === 'relationships' && (
          <div className="px-6 py-4 space-y-6">
            {/* Existing relationships */}
            {meeting.meeting_relationships.length > 0 && (
              <div className="space-y-2">
                {meeting.meeting_relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {rel.clients ? (
                        <>
                          <Building2
                            size={14}
                            className="text-amber-400 flex-shrink-0"
                          />
                          <span className="text-sm text-white/80 truncate">
                            {rel.clients.name}
                          </span>
                        </>
                      ) : rel.contacts ? (
                        <>
                          <User
                            size={14}
                            className="text-sky-400 flex-shrink-0"
                          />
                          <span className="text-sm text-white/80 truncate">
                            {rel.contacts.first_name} {rel.contacts.last_name}
                          </span>
                        </>
                      ) : null}
                      <span
                        className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                          rel.match_type === 'auto'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {rel.match_type}
                      </span>
                      {rel.matched_email && (
                        <span className="text-[10px] text-white/20">
                          {rel.matched_email}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        startLink(async () => {
                          await unlinkMeetingRelationship(rel.id);
                        })
                      }
                      disabled={linking}
                      className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Unlink size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {meeting.meeting_relationships.length === 0 && (
              <p className="text-sm text-white/20">
                No relationships detected. Link a company or contact below.
              </p>
            )}

            {/* Link company */}
            {unlinkableClients.length > 0 && (
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 size={12} />
                  Link Company
                </label>
                <select
                  className="admin-input mt-2 w-full text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    startLink(async () => {
                      await linkMeetingToCompany(meeting.id, e.target.value);
                    });
                    e.target.value = '';
                  }}
                  disabled={linking}
                >
                  <option value="" disabled>
                    Select a company…
                  </option>
                  {unlinkableClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Link contact */}
            {unlinkableContacts.length > 0 && (
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 size={12} />
                  Link Contact
                </label>
                <select
                  className="admin-input mt-2 w-full text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    startLink(async () => {
                      await linkMeetingToContact(meeting.id, e.target.value);
                    });
                    e.target.value = '';
                  }}
                  disabled={linking}
                >
                  <option value="" disabled>
                    Select a contact…
                  </option>
                  {unlinkableContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelDrawer>
  );
}
