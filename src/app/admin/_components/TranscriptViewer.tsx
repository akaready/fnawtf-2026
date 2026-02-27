'use client';

import { useState, useMemo } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import type { TranscriptSegment } from '@/types/meetings';

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

interface Props {
  segments: TranscriptSegment[];
  formattedText?: string | null;
}

export function TranscriptViewer({ segments, formattedText }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const speakers = [...new Set(segments.map((s) => s.speaker))];
    speakers.forEach((s, i) => {
      map.set(s, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
    });
    return map;
  }, [segments]);

  // Group consecutive segments by speaker
  const grouped = useMemo(() => {
    const groups: { speaker: string; text: string; startTime: number }[] = [];
    for (const seg of segments) {
      const text = seg.words.map((w) => w.text).join(' ');
      const startTime = seg.words[0]?.start_time ?? 0;
      if (groups.length > 0 && groups[groups.length - 1].speaker === seg.speaker) {
        groups[groups.length - 1].text += ' ' + text;
      } else {
        groups.push({ speaker: seg.speaker, text, startTime });
      }
    }
    return groups;
  }, [segments]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    return grouped.filter(
      (g) =>
        g.text.toLowerCase().includes(q) ||
        g.speaker.toLowerCase().includes(q),
    );
  }, [grouped, searchQuery]);

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

  function highlightMatch(text: string) {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  }

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/30 text-sm">
        No transcript available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a]">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript…"
            className="admin-input w-full pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Transcript body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {filtered.map((group, i) => (
          <div key={i} className="group">
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={`text-xs font-semibold ${speakerColorMap.get(group.speaker) || 'text-white/60'}`}
              >
                {group.speaker}
              </span>
              <span className="text-[10px] text-white/20">
                {formatTime(group.startTime)}
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {highlightMatch(group.text)}
            </p>
          </div>
        ))}
        {filtered.length === 0 && searchQuery && (
          <div className="text-center text-white/30 text-sm py-8">
            No matches found
          </div>
        )}
      </div>
    </div>
  );
}
