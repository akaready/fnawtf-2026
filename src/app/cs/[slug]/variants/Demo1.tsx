'use client';

/**
 * Demo1 — "Block"
 * Closest to StudioBinder: square corners, strong grid lines, bold dividers,
 * larger icons, chunky badges. Structured and institutional.
 */

import type { CallSheetData } from '@/components/callsheet/types';
import Image from 'next/image';

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function SunIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-14 h-14 text-amber-400" fill="currentColor">
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

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ParkingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 6v12M6 12h12" />
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M16 2l-4 4-6 2-2 2 5 5-5 7 7-5 5 5 2-2 2-6 4-4-8-8z" />
    </svg>
  );
}

export function Demo1({ data }: { data: CallSheetData }) {
  const { production, weather, schedule } = data;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ═══ HEADER ═══ */}
        <div className="border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

            {/* Left: Production */}
            <div className="p-6 order-3 md:order-1">
              {production.companyLogo && (
                <Image src={production.companyLogo} alt={production.companyName} width={160} height={56} className="h-12 w-auto object-contain brightness-0 invert mb-4" />
              )}
              <p className="font-[family-name:var(--font-display)] font-bold text-sm">{production.companyName}</p>
              {production.companyAddress && <p className="text-xs text-[var(--muted-foreground)] mt-1">{production.companyAddress}</p>}
              {production.companyPhone && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Office: <a href={`tel:${production.companyPhone}`} className="hover:text-[var(--foreground)]">{production.companyPhone}</a>
                </p>
              )}
              {production.keyCrew.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5">
                  {production.keyCrew.map((kc) => (
                    <div key={kc.role} className="flex justify-between text-xs">
                      <span className="text-[var(--muted-foreground)] font-semibold">{kc.role}:</span>
                      <span>{kc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Center: Title + Call Time */}
            <div className="p-6 text-center order-1 md:order-2 flex flex-col items-center justify-center">
              <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold tracking-tight">
                {data.projectTitle}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-[0.15em] mt-1">{data.projectType}</p>
              <div className="mt-6 mb-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted-foreground)] font-bold">General Crew Call</p>
                <p className="font-[family-name:var(--font-display)] text-6xl md:text-7xl font-bold tracking-tighter mt-1">{data.callTime}</p>
              </div>
              {data.safetyNote && (
                <p className="text-[11px] text-[var(--muted-foreground)] mt-4 max-w-[300px] leading-relaxed">{data.safetyNote}</p>
              )}
            </div>

            {/* Right: Day + Weather + Schedule */}
            <div className="p-6 order-2 md:order-3">
              <div className="bg-[var(--muted)] px-3 py-1.5 inline-block mb-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)]">
                  Day {data.shootDay} of {data.totalDays}
                </p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold">{formatDate(data.date)}</p>

              {weather && (
                <div className="mt-4 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <SunIcon />
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-3xl font-bold">
                        {weather.tempHigh}°<span className="text-lg font-normal text-[var(--muted-foreground)]"> / {weather.tempLow}°</span>
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">{weather.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                    <span><span className="font-semibold text-[var(--foreground)]">Sunrise</span> {weather.sunrise}</span>
                    <span><span className="font-semibold text-[var(--foreground)]">Sunset</span> {weather.sunset}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
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
          </div>
        </div>

        {/* ═══ BULLETINS ═══ */}
        {data.bulletins.map(b => (
          <div key={b.id} className="border border-[var(--border)] bg-[var(--surface-elevated)] px-6 py-4 flex gap-4 items-start">
            <div className="shrink-0 w-10 h-10 bg-[var(--accent)] flex items-center justify-center text-white">
              <PinIcon />
            </div>
            <p className="text-sm leading-relaxed">{b.text}</p>
          </div>
        ))}

        {/* ═══ LOCATIONS ═══ */}
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] mb-3 pb-2 border-b-2 border-[var(--accent)]">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[var(--border)] divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
            {[
              { icon: <MapPinIcon />, label: 'Set Location', loc: data.locations.set },
              { icon: <ParkingIcon />, label: 'Parking', loc: data.locations.parking },
              { icon: <HospitalIcon />, label: 'Nearest Hospital', loc: data.locations.hospital },
            ].filter(l => l.loc).map(({ icon, label, loc }) => (
              <div key={label} className="bg-[var(--surface-elevated)] p-5">
                <div className="flex items-center gap-2 mb-3 text-[var(--accent)]">
                  {icon}
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)]">{label}</span>
                </div>
                <p className="font-[family-name:var(--font-display)] font-semibold text-sm text-[var(--accent)]">
                  {loc!.mapsUrl ? <a href={loc!.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{loc!.name}</a> : loc!.name}
                </p>
                {loc!.address && <p className="text-xs text-[var(--muted-foreground)] mt-1">{loc!.address}</p>}
                {loc!.phone && <p className="text-xs mt-1"><a href={`tel:${loc!.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{loc!.phone}</a></p>}
                {loc!.note && <p className="text-[11px] text-[var(--muted-foreground)] mt-3 pt-3 border-t border-[var(--border)] leading-relaxed">{loc!.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CAST ═══ */}
        {data.cast.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] pb-2 border-b-2 border-[var(--accent)]">Cast</h2>
              <span className="text-xs text-[var(--muted-foreground)]">{data.cast.length} Total</span>
            </div>
            {/* Desktop */}
            <div className="hidden md:block border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--muted)] text-[10px] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3 text-left font-bold w-12">ID</th>
                    <th className="px-4 py-3 text-left font-bold">Name</th>
                    <th className="px-4 py-3 text-left font-bold">Role</th>
                    <th className="px-4 py-3 text-center font-bold w-16">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Pickup</th>
                    <th className="px-4 py-3 text-right font-bold">Call</th>
                    <th className="px-4 py-3 text-right font-bold">H/MU</th>
                    <th className="px-4 py-3 text-right font-bold">On Set</th>
                    <th className="px-4 py-3 text-right font-bold">Wrap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.cast.map(c => (
                    <tr key={c.id} className="bg-[var(--surface-elevated)]">
                      <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 bg-[var(--muted)] text-xs font-bold">{c.id}</span></td>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">&ldquo;{c.role}&rdquo;</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-[var(--muted-foreground)]">{c.status}</td>
                      <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">{c.pickup || '—'}</td>
                      <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">{c.callTime}</td>
                      <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">{c.hmua || '—'}</td>
                      <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">{c.onSet || '—'}</td>
                      <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs">{c.wrap || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {data.cast.map(c => (
                <div key={c.id} className="border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-[family-name:var(--font-display)] font-bold">{c.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">&ldquo;{c.role}&rdquo;</p>
                    </div>
                    <span className="bg-[var(--muted)] px-2 py-1 text-[10px] font-bold">#{c.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[{ l: 'Call', t: c.callTime }, { l: 'On Set', t: c.onSet }, { l: 'Wrap', t: c.wrap }].filter(x => x.t).map(x => (
                      <div key={x.l}><p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider">{x.l}</p><p className="font-[family-name:var(--font-mono)] font-medium">{x.t}</p></div>
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
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] pb-2 border-b-2 border-[var(--accent)]">Crew</h2>
              <span className="text-xs text-[var(--muted-foreground)]">{data.crew.length} Crew</span>
            </div>
            {/* Desktop */}
            <div className="hidden md:block border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--muted)] text-[10px] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                    <th className="px-4 py-3 text-left font-bold">Name</th>
                    <th className="px-4 py-3 text-left font-bold">Title</th>
                    <th className="px-4 py-3 text-left font-bold">Phone</th>
                    <th className="px-4 py-3 text-left font-bold">Email</th>
                    <th className="px-4 py-3 text-right font-bold">Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.crew.map((c, i) => (
                    <tr key={i} className="bg-[var(--surface-elevated)]">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.title}</td>
                      <td className="px-4 py-3">{c.phone ? <a href={`tel:${c.phone}`} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-[family-name:var(--font-mono)] text-xs">{c.phone}</a> : '—'}</td>
                      <td className="px-4 py-3">{c.email ? <a href={`mailto:${c.email}`} className="text-[var(--accent)] hover:underline text-xs">{c.email}</a> : '—'}</td>
                      <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] text-xs font-medium">{c.callTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {data.crew.map((c, i) => (
                <div key={i} className="border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div><p className="font-[family-name:var(--font-display)] font-bold">{c.name}</p><p className="text-sm text-[var(--muted-foreground)]">{c.title}</p></div>
                    <span className="font-[family-name:var(--font-mono)] text-sm font-medium shrink-0">{c.callTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-xs mt-1">
                    {c.phone && <a href={`tel:${c.phone}`} className="text-[var(--muted-foreground)]">{c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} className="text-[var(--accent)]">{c.email}</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SPECIAL INSTRUCTIONS ═══ */}
        {data.specialInstructions.length > 0 && (
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--muted-foreground)] mb-3 pb-2 border-b-2 border-[var(--accent)]">Special Instructions</h2>
            <div className="border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
              {data.specialInstructions.map((inst, i) => (
                <div key={i} className="bg-[var(--surface-elevated)] p-5 md:grid md:grid-cols-[180px_1fr] md:gap-6">
                  <p className="font-[family-name:var(--font-display)] font-bold text-xs uppercase tracking-wider mb-2 md:mb-0">{inst.category}</p>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{inst.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <footer className="flex items-center justify-center gap-3 py-8 border-t border-[var(--border)] opacity-40">
          <Image src="/images/logo/fna-logo.svg" alt="Friends 'n Allies" width={24} height={24} className="invert" />
          <span className="text-xs tracking-wide text-[var(--muted-foreground)]">Produced by Friends &apos;n Allies</span>
        </footer>
      </div>
    </div>
  );
}
