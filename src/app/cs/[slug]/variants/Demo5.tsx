'use client';

/**
 * Demo5 — "Modern Departure"
 * Furthest from StudioBinder. Full-bleed hero with gradient accent,
 * large weather visualization, crew as horizontal cards with initials avatar,
 * floating schedule strip at top. Feels more like a modern app than a document.
 */

import type { CallSheetData } from '@/components/callsheet/types';
import Image from 'next/image';

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function Demo5({ data }: { data: CallSheetData }) {
  const { production, weather, schedule } = data;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      {/* ═══ FLOATING SCHEDULE STRIP ═══ */}
      <div className="sticky top-0 z-10 bg-[var(--surface-elevated)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-3 shrink-0">
            {production.companyLogo && (
              <Image src={production.companyLogo} alt={production.companyName} width={80} height={28} className="h-5 w-auto object-contain brightness-0 invert" />
            )}
            <span className="font-[family-name:var(--font-display)] font-bold text-sm">{data.projectTitle}</span>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0">
            {[
              { label: 'Crew', time: schedule.crewCall },
              { label: 'Talent', time: schedule.talentCall },
              { label: 'Lunch', time: schedule.lunch },
              { label: 'Wrap', time: schedule.estimatedWrap },
            ].filter(s => s.time).map(s => (
              <span key={s.label} className="text-[var(--muted-foreground)]">
                {s.label} <span className="font-[family-name:var(--font-mono)] text-[var(--foreground)] font-medium">{s.time}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══ HERO ═══ */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--accent)]/20 via-[var(--surface-elevated)] to-[var(--surface-elevated)] border border-[var(--border)] p-8 md:p-12">
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-3 py-1 rounded-full">
                Day {data.shootDay} of {data.totalDays}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">{formatDate(data.date)}</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold tracking-tight">
              {data.projectTitle}
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1">{data.projectType} · {production.companyName}</p>

            <div className="mt-8 inline-flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-semibold">General Crew Call</p>
              <p className="font-[family-name:var(--font-mono)] text-7xl md:text-8xl font-bold tracking-tighter mt-1">{data.callTime}</p>
            </div>

            {/* Weather inline */}
            {weather && (
              <div className="mt-8 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 48 48" className="w-8 h-8 text-amber-400" fill="currentColor">
                    <circle cx="24" cy="24" r="10" />
                    <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="24" y1="4" x2="24" y2="9" /><line x1="24" y1="39" x2="24" y2="44" />
                      <line x1="7.5" y1="7.5" x2="11" y2="11" /><line x1="37" y1="37" x2="40.5" y2="40.5" />
                      <line x1="4" y1="24" x2="9" y2="24" /><line x1="39" y1="24" x2="44" y2="24" />
                      <line x1="7.5" y1="40.5" x2="11" y2="37" /><line x1="37" y1="11" x2="40.5" y2="7.5" />
                    </g>
                  </svg>
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold">{weather.tempHigh}°</span>
                  <span className="text-[var(--muted-foreground)]">/ {weather.tempLow}°</span>
                </div>
                <span className="text-[var(--muted-foreground)]">{weather.description}</span>
                <span className="text-[var(--muted-foreground)] text-xs">↑ {weather.sunrise} · ↓ {weather.sunset}</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ BULLETINS ═══ */}
        {data.bulletins.map(b => (
          <div key={b.id} className="rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-6 py-4 flex gap-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" fill="currentColor">
              <path d="M16 2l-4 4-6 2-2 2 5 5-5 7 7-5 5 5 2-2 2-6 4-4-8-8z" />
            </svg>
            <p className="text-sm leading-relaxed">{b.text}</p>
          </div>
        ))}

        {/* ═══ KEY CREW + LOCATIONS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Crew */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--muted-foreground)] mb-4">Key Crew</h2>
            <div className="space-y-2">
              {production.keyCrew.map(kc => (
                <div key={kc.role} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                    {initials(kc.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{kc.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{kc.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--muted-foreground)] mb-4">Locations</h2>
            <div className="space-y-3">
              {[
                { label: 'Set', loc: data.locations.set },
                { label: 'Parking', loc: data.locations.parking },
                { label: 'Hospital', loc: data.locations.hospital },
              ].filter(l => l.loc).map(({ label, loc }) => (
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs text-[var(--muted-foreground)] shrink-0">
                    {label === 'Set' ? '📍' : label === 'Parking' ? 'P' : '+'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--accent)]">
                      {loc!.mapsUrl ? <a href={loc!.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{loc!.name}</a> : loc!.name}
                    </p>
                    {loc!.address && <p className="text-xs text-[var(--muted-foreground)]">{loc!.address}</p>}
                    {loc!.phone && <p className="text-xs"><a href={`tel:${loc!.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{loc!.phone}</a></p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CAST ═══ */}
        {data.cast.length > 0 && (
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--muted-foreground)] mb-4">Cast</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.cast.map(c => (
                <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 flex items-center justify-center text-xs font-bold shrink-0">
                    {c.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">&ldquo;{c.role}&rdquo;</p>
                    <div className="flex gap-3 mt-2 text-[11px] font-[family-name:var(--font-mono)]">
                      <span>Call {c.callTime}</span>
                      {c.onSet && <span className="text-[var(--muted-foreground)]">Set {c.onSet}</span>}
                      {c.wrap && <span className="text-[var(--muted-foreground)]">Wrap {c.wrap}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CREW ═══ */}
        {data.crew.length > 0 && (
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--muted-foreground)] mb-4">Crew</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.crew.map((c, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-[11px] font-bold text-[var(--muted-foreground)] shrink-0">
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{c.title}</p>
                      </div>
                      <span className="font-[family-name:var(--font-mono)] text-sm font-bold shrink-0">{c.callTime}</span>
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[11px]">
                      {c.phone && <a href={`tel:${c.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{c.phone}</a>}
                      {c.email && <a href={`mailto:${c.email}`} className="text-[var(--accent)] hover:underline truncate">{c.email}</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ NOTES ═══ */}
        {data.specialInstructions.length > 0 && (
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--muted-foreground)] mb-4">Department Notes</h2>
            <div className="space-y-3">
              {data.specialInstructions.map((inst, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1.5">{inst.category}</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{inst.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <footer className="flex items-center justify-center gap-3 py-10 opacity-25">
          <Image src="/images/logo/fna-logo.svg" alt="Friends 'n Allies" width={24} height={24} className="invert" />
          <span className="text-xs tracking-wide text-[var(--muted-foreground)]">Friends &apos;n Allies</span>
        </footer>
      </div>
    </div>
  );
}
