'use client';

import Link from 'next/link';
import type { ProjectVideo } from '@/types/project';

interface ProjectDeliveryAndDescriptionProps {
  assetsDelivered: string[];
  description: string;
  videos?: ProjectVideo[];
}

/** Round seconds to nearest 5s */
function round5(s: number): number {
  return Math.round(s / 5) * 5;
}

/** Format rounded seconds as human string: 15s, 1m, 1m15s, 2m30s */
function fmtDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m${s}s`;
}

interface DeliverableStat {
  count: number;
  label: string;
  duration?: string;
  durations?: { label: string; count: number }[];
}

function buildDeliverableStats(videos: ProjectVideo[]): DeliverableStat[] {
  const stats: DeliverableStat[] = [];
  const visible = videos.filter((v) => !v.hidden);
  const flagship = visible.filter((v) => v.video_type === 'flagship');
  const cutdowns = visible.filter((v) => v.video_type === 'cutdown');
  const bts = visible.filter((v) => v.video_type === 'bts');

  const durationsForGroup = (vids: ProjectVideo[]) => {
    const withDur = vids.filter((v) => v.duration_seconds != null && v.duration_seconds > 0);
    if (withDur.length === 0) return {};
    if (withDur.length === 1) {
      return { duration: fmtDuration(round5(withDur[0].duration_seconds!)) };
    }
    const grouped = new Map<number, number>();
    for (const v of withDur) {
      const rounded = round5(v.duration_seconds!);
      grouped.set(rounded, (grouped.get(rounded) ?? 0) + 1);
    }
    const sorted = [...grouped.entries()].sort((a, b) => a[0] - b[0]);
    return { durations: sorted.map(([d, count]) => ({ label: fmtDuration(d), count })) };
  };

  if (flagship.length > 0) {
    stats.push({ count: flagship.length, label: 'Flagship', ...durationsForGroup(flagship) });
  }
  if (cutdowns.length > 0) {
    stats.push({ count: cutdowns.length, label: 'Cutdowns', ...durationsForGroup(cutdowns) });
  }
  if (bts.length > 0) {
    stats.push({ count: bts.length, label: 'BTS', ...durationsForGroup(bts) });
  }

  return stats;
}

export function ProjectDeliveryAndDescription({
  assetsDelivered,
  description,
  videos,
}: ProjectDeliveryAndDescriptionProps) {
  const hasDeliverables = assetsDelivered.length > 0;
  const hasDescription = description?.trim().length > 0;
  const stats = buildDeliverableStats(videos ?? []);
  const hasStats = stats.length > 0;
  const hasLeft = hasDeliverables || hasStats;

  if (!hasLeft && !hasDescription) return null;

  return (
    <section className="py-10 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className={`grid grid-cols-1 gap-10 items-start ${hasLeft && hasDescription ? 'lg:grid-cols-[1fr_2fr]' : ''}`}>
          {/* Left — Deliverables */}
          {hasLeft && (
            <div className="space-y-6">
              {hasDeliverables && (
                <div>
                  <p className="section-eyebrow mb-6">
                    Deliverables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assetsDelivered.map((asset) => (
                      <Link
                        key={asset}
                        href={`/work?deliverables=${encodeURIComponent(asset)}`}
                        className="bg-white/5 border border-white/10 rounded px-3 py-1 text-base text-white/70 hover:border-white/50 hover:text-white active:border-accent active:text-accent active:bg-accent/10 transition-colors"
                      >
                        {asset}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {hasStats && (
                <div className="flex flex-wrap gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-light text-white tracking-tight font-mono">
                        {stat.count}
                      </p>
                      <p className="text-white/40 text-sm mt-0.5">{stat.label}</p>
                      {stat.duration && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm text-white/60 font-mono">{stat.duration}</span>
                        </div>
                      )}
                      {stat.durations && (
                        <div className="mt-2 space-y-1">
                          {stat.durations.map((d) => (
                            <div key={d.label} className="flex items-center gap-2">
                              <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm text-white/60 font-mono">{d.label}</span>
                              <span className="text-white/40 text-sm">× {d.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right — Description */}
          {hasDescription && (
            <div>
              <p className="section-eyebrow mb-6">
                Description
              </p>
              {description.split('\n\n').map((para, i) => (
                <p key={i} className="text-white/70 leading-relaxed text-lg [&+p]:mt-4">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
