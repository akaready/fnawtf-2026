'use client';

/**
 * Demo2 — "Editorial"
 * Typography-forward. Giant section titles, hairline dividers, generous whitespace,
 * monospace times are the star. Minimal boxes — content breathes.
 */

import type { CallSheetData } from '@/components/callsheet/types';
import Image from 'next/image';

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function Demo2({ data }: { data: CallSheetData }) {
  const { production, weather, schedule } = data;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ═══ HERO ═══ */}
        <header className="text-center space-y-2">
          {production.companyLogo && (
            <Image src={production.companyLogo} alt={production.companyName} width={120} height={40} className="h-8 w-auto object-contain brightness-0 invert mx-auto mb-6" />
          )}
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-semibold">
            Day {data.shootDay} of {data.totalDays} — {formatDate(data.date)}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold tracking-tight">
            {data.projectTitle} <span className="font-normal text-[var(--muted-foreground)]">{data.projectType}</span>
          </h1>
          <div className="pt-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-semibold">Call Time</p>
            <p className="font-[family-name:var(--font-mono)] text-7xl md:text-8xl font-bold tracking-tighter">{data.callTime}</p>
          </div>
          {data.safetyNote && (
            <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto pt-2">{data.safetyNote}</p>
          )}
        </header>

        {/* ═══ WEATHER + SCHEDULE side by side ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[var(--border)]">
          {/* Weather */}
          {weather && (
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-4">Weather</h2>
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-mono)] text-5xl font-bold">{weather.tempHigh}°</span>
                <span className="text-2xl text-[var(--muted-foreground)]">/ {weather.tempLow}°</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{weather.description}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-3">
                Sunrise {weather.sunrise} · Sunset {weather.sunset}
              </p>
            </div>
          )}
          {/* Schedule */}
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-4">Schedule</h2>
            <div className="space-y-3">
              {[
                { label: 'Crew Call', time: schedule.crewCall },
                { label: 'Talent Call', time: schedule.talentCall },
                { label: 'Shooting Call', time: schedule.shootingCall },
                { label: 'Lunch', time: schedule.lunch },
                { label: 'Est. Wrap', time: schedule.estimatedWrap },
              ].filter(s => s.time).map(s => (
                <div key={s.label} className="flex justify-between items-baseline border-b border-[var(--border)] pb-2">
                  <span className="text-sm text-[var(--muted-foreground)]">{s.label}</span>
                  <span className="font-[family-name:var(--font-mono)] text-lg font-bold">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ PRODUCTION ═══ */}
        <div className="pt-4 border-t border-[var(--border)]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-4">Production</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <div>
              <p className="font-medium">{production.companyName}</p>
              {production.companyAddress && <p className="text-[var(--muted-foreground)]">{production.companyAddress}</p>}
              {production.companyPhone && <p className="text-[var(--muted-foreground)]"><a href={`tel:${production.companyPhone}`} className="hover:text-[var(--foreground)]">{production.companyPhone}</a></p>}
            </div>
            <div className="space-y-1.5">
              {production.keyCrew.map(kc => (
                <div key={kc.role} className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">{kc.role}</span>
                  <span className="font-medium">{kc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ BULLETINS ═══ */}
        {data.bulletins.length > 0 && (
          <div className="border-l-4 border-[var(--accent)] pl-6 py-2">
            {data.bulletins.map(b => (
              <p key={b.id} className="text-sm leading-relaxed">{b.text}</p>
            ))}
          </div>
        )}

        {/* ═══ LOCATIONS ═══ */}
        <div className="pt-4 border-t border-[var(--border)]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Set', loc: data.locations.set },
              { label: 'Parking', loc: data.locations.parking },
              { label: 'Hospital', loc: data.locations.hospital },
            ].filter(l => l.loc).map(({ label, loc }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-semibold mb-2">{label}</p>
                <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--accent)]">
                  {loc!.mapsUrl ? <a href={loc!.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{loc!.name}</a> : loc!.name}
                </p>
                {loc!.address && <p className="text-xs text-[var(--muted-foreground)] mt-1">{loc!.address}</p>}
                {loc!.phone && <p className="text-xs text-[var(--muted-foreground)]"><a href={`tel:${loc!.phone}`} className="hover:text-[var(--foreground)]">{loc!.phone}</a></p>}
                {loc!.note && <p className="text-[11px] text-[var(--muted-foreground)] mt-2 leading-relaxed">{loc!.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CAST ═══ */}
        {data.cast.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">Cast</h2>
            <div className="space-y-4">
              {data.cast.map(c => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-4">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)] w-6 text-center">{c.id}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">&ldquo;{c.role}&rdquo; · {c.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-xs font-[family-name:var(--font-mono)] pl-10 sm:pl-0">
                    {c.pickup && <span><span className="text-[var(--muted-foreground)] font-[family-name:var(--font-body)]">PU </span>{c.pickup}</span>}
                    <span><span className="text-[var(--muted-foreground)] font-[family-name:var(--font-body)]">Call </span>{c.callTime}</span>
                    {c.onSet && <span><span className="text-[var(--muted-foreground)] font-[family-name:var(--font-body)]">Set </span>{c.onSet}</span>}
                    {c.wrap && <span><span className="text-[var(--muted-foreground)] font-[family-name:var(--font-body)]">Wrap </span>{c.wrap}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CREW ═══ */}
        {data.crew.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">Crew</h2>
            <div className="space-y-3">
              {data.crew.map((c, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[var(--border)]">
                  <div>
                    <p className="font-medium">{c.name} <span className="text-[var(--muted-foreground)] font-normal">· {c.title}</span></p>
                    <div className="flex gap-4 text-xs mt-0.5">
                      {c.phone && <a href={`tel:${c.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{c.phone}</a>}
                      {c.email && <a href={`mailto:${c.email}`} className="text-[var(--accent)] hover:underline">{c.email}</a>}
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-lg font-bold shrink-0">{c.callTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SPECIAL INSTRUCTIONS ═══ */}
        {data.specialInstructions.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">Notes</h2>
            <div className="space-y-4">
              {data.specialInstructions.map((inst, i) => (
                <div key={i}>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--accent)] mb-1">{inst.category}</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{inst.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <footer className="flex items-center justify-center gap-3 py-10 opacity-30">
          <Image src="/images/logo/fna-logo.svg" alt="Friends 'n Allies" width={20} height={20} className="invert" />
          <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted-foreground)]">Friends &apos;n Allies</span>
        </footer>
      </div>
    </div>
  );
}
