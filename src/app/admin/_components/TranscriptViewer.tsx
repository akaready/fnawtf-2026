'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import type { TranscriptSegment, MeetingAttendeeRow } from '@/types/meetings';

const SPEAKER_COLORS = [
  'text-sky-400',
  'text-amber-400',
  'text-emerald-400',
  'text-violet-400',
  'text-rose-400',
  'text-teal-400',
  'text-orange-400',
  'text-indigo-400',
];

const FNA_NAME = "Friends 'n Allies";

interface Props {
  segments: TranscriptSegment[];
  formattedText?: string | null;
  attendees?: MeetingAttendeeRow[];
}

function getSpeaker(seg: TranscriptSegment): string {
  return seg.participant?.name || seg.speaker || 'Speaker';
}

function getStartTime(seg: TranscriptSegment): number {
  const firstWord = seg.words[0];
  if (!firstWord) return 0;
  return firstWord.start_timestamp?.relative ?? firstWord.start_time ?? 0;
}

function isReady(att: MeetingAttendeeRow): boolean {
  const name = (att.display_name || '').toLowerCase();
  const email = (att.email || '').toLowerCase();
  return name.includes('ready') || email.includes('ready');
}

function isRichie(att: MeetingAttendeeRow): boolean {
  const name = (att.display_name || '').toLowerCase();
  const email = (att.email || '').toLowerCase();
  return name.includes('richie') || name.includes('richard') || email.includes('richie');
}

export function TranscriptViewer({ segments, formattedText, attendees = [] }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const matchRefs = useRef<(HTMLElement | null)[]>([]);
  const totalMatches = useRef(0);

  // Detect if FNA account is a speaker
  const hasFnaSpeaker = useMemo(
    () => segments.some((s) => getSpeaker(s) === FNA_NAME),
    [segments],
  );

  const defaultSpeaker = useMemo(() => {
    const readyPresent = attendees.some(isReady);
    const richiePresent = attendees.some(isRichie);
    if (readyPresent && !richiePresent) return 'Richie';
    if (richiePresent && !readyPresent) return 'Ready';
    return 'Richie';
  }, [attendees]);

  const [fnaSpeaker, setFnaSpeaker] = useState<'Richie' | 'Ready'>(defaultSpeaker);

  const displaySpeaker = (name: string) =>
    name === FNA_NAME ? fnaSpeaker : name;

  const getGroupKey = (seg: TranscriptSegment): string =>
    seg.participant?.id != null ? String(seg.participant.id) : getSpeaker(seg);

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const speakers = [...new Set(segments.map((s) => displaySpeaker(getSpeaker(s))))];
    speakers.forEach((s, i) => {
      map.set(s, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, fnaSpeaker]);

  const hasSpeakers = useMemo(() => {
    const unique = new Set(segments.map((s) => getGroupKey(s)));
    return unique.size > 1;
  }, [segments]);

  // Group consecutive segments by participant identity
  const grouped = useMemo(() => {
    const groups: { speaker: string; text: string; startTime: number; groupKey: string }[] = [];
    for (const seg of segments) {
      const groupKey = getGroupKey(seg);
      const speaker = displaySpeaker(getSpeaker(seg));
      const text = seg.words.map((w) => w.text).join(' ');
      const startTime = getStartTime(seg);
      if (groups.length > 0 && groups[groups.length - 1].groupKey === groupKey) {
        groups[groups.length - 1].text += ' ' + text;
      } else {
        groups.push({ speaker, groupKey, text, startTime });
      }
    }
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, fnaSpeaker]);

  const handleCopy = async () => {
    const text =
      formattedText ||
      grouped.map((g) => `${g.speaker}: ${g.text}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Count total matches across all groups
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let count = 0;
    for (const g of grouped) {
      const matches = g.text.match(regex);
      count += matches ? matches.length : 0;
    }
    return count;
  }, [grouped, searchQuery]);

  // Reset match index when query changes
  useEffect(() => {
    setActiveMatchIdx(0);
    matchRefs.current = [];
    totalMatches.current = 0;
  }, [searchQuery]);

  // Scroll active match into view
  useEffect(() => {
    if (matchCount > 0 && matchRefs.current[activeMatchIdx]) {
      matchRefs.current[activeMatchIdx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeMatchIdx, matchCount]);

  const goNext = useCallback(() => {
    if (matchCount > 0) setActiveMatchIdx((prev) => (prev + 1) % matchCount);
  }, [matchCount]);

  const goPrev = useCallback(() => {
    if (matchCount > 0) setActiveMatchIdx((prev) => (prev - 1 + matchCount) % matchCount);
  }, [matchCount]);

  // Render text with highlighted search matches, tracking a global match counter
  const renderHighlighted = useCallback(
    (text: string, globalOffset: number) => {
      if (!searchQuery.trim()) return text;
      const regex = new RegExp(
        `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'gi',
      );
      const parts = text.split(regex);
      let localMatchIdx = 0;
      return parts.map((part, i) => {
        if (regex.test(part)) {
          const thisGlobalIdx = globalOffset + localMatchIdx;
          localMatchIdx++;
          const isActive = thisGlobalIdx === activeMatchIdx;
          return (
            <mark
              key={i}
              ref={(el) => {
                matchRefs.current[thisGlobalIdx] = el;
              }}
              className={`rounded px-0.5 ${
                isActive
                  ? 'bg-amber-400/50 text-amber-100 ring-1 ring-amber-400'
                  : 'bg-amber-500/20 text-amber-200'
              }`}
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    },
    [searchQuery, activeMatchIdx],
  );

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-admin-text-secondary text-sm">
        No transcript available
      </div>
    );
  }

  // Pre-compute match offsets per group for global indexing
  let runningOffset = 0;
  const groupOffsets: number[] = [];
  const regex = searchQuery.trim()
    ? new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    : null;
  for (const g of grouped) {
    groupOffsets.push(runningOffset);
    if (regex) {
      const matches = g.text.match(regex);
      runningOffset += matches ? matches.length : 0;
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-admin-border">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.shiftKey ? goPrev() : goNext();
              }
            }}
            placeholder="Search transcript…"
            className="admin-input w-full pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
        {searchQuery.trim() && matchCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-admin-text-dim tabular-nums">
              {activeMatchIdx + 1}/{matchCount}
            </span>
            <button
              onClick={goPrev}
              className="w-6 h-6 flex items-center justify-center rounded text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors cursor-pointer"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={goNext}
              className="w-6 h-6 flex items-center justify-center rounded text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors cursor-pointer"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
        {searchQuery.trim() && matchCount === 0 && (
          <span className="text-xs text-admin-text-faint">No results</span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Speaker toggle */}
      {hasFnaSpeaker && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-admin-border-subtle">
          <span className="text-xs text-admin-text-faint">FNA account was:</span>
          <div className="flex rounded-lg overflow-hidden border border-admin-border">
            {(['Richie', 'Ready'] as const).map((name) => (
              <button
                key={name}
                onClick={() => setFnaSpeaker(name)}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  fnaSpeaker === name
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript body — always shows all groups, highlights in context */}
      <div className="flex-1 overflow-y-auto admin-scrollbar px-4 py-4 space-y-4">
        {grouped.map((group, i) => (
          <div key={i}>
            <div className="flex items-baseline gap-2 mb-1">
              {hasSpeakers && (
                <span
                  className={`text-xs font-semibold ${speakerColorMap.get(group.speaker) || 'text-[#999]'}`}
                >
                  {group.speaker}
                </span>
              )}
              <span className="text-xs text-admin-text-dim">
                {formatTime(group.startTime)}
              </span>
            </div>
            <p className="text-sm text-admin-text-secondary leading-relaxed">
              {renderHighlighted(group.text, groupOffsets[i])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
