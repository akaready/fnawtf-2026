'use client';

/**
 * Demo3 — "Card Grid"
 * Everything lives in distinct elevated cards. Icon-heavy, pill badges,
 * color-coded section accents via left borders. More visual hierarchy.
 */

import type { CallSheetData } from '@/components/callsheet/types';
import Image from 'next/image';

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function SunIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12 text-amber-400" fill="currentColor">
      <circle cx="24" cy="24" r="10" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="2" x2="24" y2="8" /><line x1="24" y1="40" x2="24" y2="46" />
        <line x1="6.1" y1="6.1" x2="10.3" y2="10.3" /><line x1="37.7" y1="37.7" x2="41.9" y2="41.9" />
        <line x1="2" y1="24" x2="8" y2="24" /><line x1="40" y1="24" x2="46" y2="24" />
        <line x1="6.1" y1="41.9" x2="10.3" y2="37.7" /><line x1="37.7" y1="10.3" x2="41.9" y2="6.1" />
      </g>
    </svg>
  );
}

export function Demo3({ data }: { data: CallSheetData }) {
  const { production, weather, schedule } = data;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ═══ TOP BAR ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {production.companyLogo && (
              <Image src={production.companyLogo} alt={production.companyName} width={100} height={36} className="h-7 w-auto object-contain brightness-0 invert" />
            )}
            <span className="text-xs text-[var(--muted-foreground)]">×</span>
            <Image src="/images/logo/fna-logo.svg" alt="FNA" width={20} height={20} className="invert opacity-50" />
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Day {data.shootDay}/{data.totalDays}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">{formatDate(data.date)}</span>
          </div>
        </div>

        {/* ═══ HERO CARD ═══ */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 md:p-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight">
            {data.projectTitle}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{data.projectType}</p>
          <div className="mt-6 inline-block bg-[var(--muted)] rounded-xl px-8 py-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted-foreground)] font-semibold">General Crew Call</p>
            <p className="font-[family-name:var(--font-display)] text-6xl font-bold tracking-tighter mt-1">{data.callTime}</p>
          </div>
          {data.safetyNote && (
            <p className="text-xs text-[var(--muted-foreground)] mt-5 max-w-sm mx-auto">{data.safetyNote}</p>
          )}
        </div>

        {/* ═══ WEATHER + SCHEDULE + PRODUCTION — 3 cards ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weather */}
          {weather && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 border-l-4 border-l-amber-400">
              <div className="flex items-center gap-3 mb-3">
                <SunIcon />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-3xl font-bold">
                    {weather.tempHigh}°<span className="text-lg font-normal text-[var(--muted-foreground)]"> / {weather.tempLow}°</span>
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{weather.description}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Sunrise {weather.sunrise} · Sunset {weather.sunset}
              </p>
            </div>
          )}

          {/* Schedule */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 border-l-4 border-l-[var(--accent)]">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] mb-3">Schedule</p>
            <div className="space-y-2">
              {[
                { label: 'Crew Call', time: schedule.crewCall },
                { label: 'Talent Call', time: schedule.talentCall },
                { label: 'Shooting Call', time: schedule.shootingCall },
                { label: 'Lunch', time: schedule.lunch },
                { label: 'Est. Wrap', time: schedule.estimatedWrap },
              ].filter(s => s.time).map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">{s.label}</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium">{s.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Production */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 border-l-4 border-l-emerald-500">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] mb-3">Production</p>
            <p className="font-medium text-sm">{production.companyName}</p>
            {production.companyPhone && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                <a href={`tel:${production.companyPhone}`} className="hover:text-[var(--foreground)]">{production.companyPhone}</a>
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1.5">
              {production.keyCrew.map(kc => (
                <div key={kc.role} className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">{kc.role}</span>
                  <span className="font-medium">{kc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ BULLETINS ═══ */}
        {data.bulletins.map(b => (
          <div key={b.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 flex gap-4 items-start">
            <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M16 2l-4 4-6 2-2 2 5 5-5 7 7-5 5 5 2-2 2-6 4-4-8-8z" />
              </svg>
            </span>
            <p className="text-sm leading-relaxed">{b.text}</p>
          </div>
        ))}

        {/* ═══ LOCATIONS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Set Location', loc: data.locations.set, icon: '📍' },
            { label: 'Parking', loc: data.locations.parking, icon: '🅿️' },
            { label: 'Hospital', loc: data.locations.hospital, icon: '🏥' },
          ].filter(l => l.loc).map(({ label, loc, icon }) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)]">{label}</span>
              </div>
              <p className="font-[family-name:var(--font-display)] font-semibold text-sm text-[var(--accent)]">
                {loc!.mapsUrl ? <a href={loc!.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{loc!.name}</a> : loc!.name}
              </p>
              {loc!.address && <p className="text-xs text-[var(--muted-foreground)] mt-1">{loc!.address}</p>}
              {loc!.phone && <p className="text-xs mt-1"><a href={`tel:${loc!.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{loc!.phone}</a></p>}
              {loc!.note && <p className="text-[11px] text-[var(--muted-foreground)] mt-3 pt-3 border-t border-[var(--border)]">{loc!.note}</p>}
            </div>
          ))}
        </div>

        {/* ═══ CAST ═══ */}
        {data.cast.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Cast</h2>
              <span className="bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] font-bold px-2.5 py-1 rounded-full">{data.cast.length}</span>
            </div>
            <div className="space-y-3">
              {data.cast.map(c => (
                <div key={c.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]">{c.id}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">&ldquo;{c.role}&rdquo;</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs font-[family-name:var(--font-mono)] pl-11 sm:pl-0">
                    {[
                      { l: 'PU', t: c.pickup }, { l: 'Call', t: c.callTime }, { l: 'H/MU', t: c.hmua },
                      { l: 'Set', t: c.onSet }, { l: 'Wrap', t: c.wrap },
                    ].filter(x => x.t).map(x => (
                      <span key={x.l} className="bg-[var(--muted)] px-2 py-1 rounded-lg">
                        <span className="text-[var(--muted-foreground)] font-[family-name:var(--font-body)] text-[10px] uppercase mr-1">{x.l}</span>
                        {x.t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CREW ═══ */}
        {data.crew.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Crew</h2>
              <span className="bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] font-bold px-2.5 py-1 rounded-full">{data.crew.length}</span>
            </div>
            <div className="space-y-2">
              {data.crew.map((c, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.name} <span className="text-[var(--muted-foreground)] font-normal text-sm">· {c.title}</span></p>
                    <div className="flex gap-4 text-xs mt-1">
                      {c.phone && <a href={`tel:${c.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{c.phone}</a>}
                      {c.email && <a href={`mailto:${c.email}`} className="text-[var(--accent)] hover:underline">{c.email}</a>}
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-sm font-bold bg-[var(--muted)] px-3 py-1.5 rounded-lg shrink-0">{c.callTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SPECIAL INSTRUCTIONS ═══ */}
        {data.specialInstructions.length > 0 && (
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-4">Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.specialInstructions.map((inst, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--accent)] mb-2">{inst.category}</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{inst.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <footer className="flex items-center justify-center gap-3 py-8 opacity-30">
          <Image src="/images/logo/fna-logo.svg" alt="FNA" width={20} height={20} className="invert" />
          <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted-foreground)]">Friends &apos;n Allies</span>
        </footer>
      </div>
    </div>
  );
}
