'use client';

/**
 * Demo4 — Refined v6
 * Sidebar: call time, weather, schedule, FNA team w/ headshots, vendors, hospital w/ map.
 * Main: bulletin (info, no icon), location+parking, scenes, cast, crew (w/ wrap), dept notes.
 * No safety card. Hospital only on sidebar with embedded map.
 */

import { useState } from 'react';
import type { CallSheetData } from '@/components/callsheet/types';
import Image from 'next/image';
import { CallSheetLightbox } from './CallSheetLightbox';
import {
  Sun,
  Sunrise,
  Sunset,
  MapPin,
  Phone,
  Mail,
  Navigation,
  Users,
  UserCheck,
  FileText,
  Clapperboard,
  Truck,
  Clock,
  UtensilsCrossed,
  Flag,
} from 'lucide-react';

/* ── Helpers ───────────────────────────────────────────────── */

/** Parse "8:00 AM" → minutes since midnight for sorting */
function parseTime(t: string): number {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDay(iso: string) {
  return new Date(iso + 'T12:00:00').getDate().toString();
}

function formatMonth(iso: string) {
  return new Date(iso + 'T12:00:00')
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
}

/* ── Small map for sidebar ─────────────────────────────────── */

function MapPlaceholderSmall({ address }: { address: string }) {
  const q = encodeURIComponent(address);
  return (
    <a
      href={`https://maps.google.com/?q=${q}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border border-admin-border-subtle bg-admin-bg-inset relative group"
    >
      <div className="h-24 bg-admin-bg-hover flex items-center justify-center relative">
        <MapPin className="w-6 h-6 text-admin-text-dim" strokeWidth={1.5} />
        <span className="absolute bottom-2 right-2 text-admin-text-dim text-sm group-hover:text-admin-text-secondary transition-colors">
          Maps
        </span>
      </div>
    </a>
  );
}

/* ── Headshot (uses <img> for external URLs, <Image> for local) ── */

function Headshot({ src, alt, size }: { src: string | null; alt: string; size: number }) {
  const cls = `rounded-full object-cover shrink-0`;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={size} height={size} className={cls} style={{ width: size, height: size }} />;
  }
  return (
    <div className={`rounded-full bg-admin-bg-hover flex items-center justify-center text-sm font-bold text-admin-text-dim shrink-0`} style={{ width: size, height: size }}>
      {alt.split(' ').map(n => n[0]).join('')}
    </div>
  );
}

/* ── Section header (right side only) ──────────────────────── */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-admin-text-dim">{icon}</span>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-admin-text-primary">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-base text-admin-text-dim font-medium">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */

const locationImages = [
  { url: 'https://ipzfnpjkslormhbkkiys.supabase.co/storage/v1/object/public/location-images/6118bbf4-3a36-4334-a6cf-0decdac218c8/000.webp', alt: 'Treehouse living room with wooden beams' },
  { url: 'https://ipzfnpjkslormhbkkiys.supabase.co/storage/v1/object/public/location-images/6118bbf4-3a36-4334-a6cf-0decdac218c8/001.webp', alt: 'Living room with green sofa and brick fireplace' },
  { url: 'https://ipzfnpjkslormhbkkiys.supabase.co/storage/v1/object/public/location-images/6118bbf4-3a36-4334-a6cf-0decdac218c8/002.webp', alt: 'Living room with fireplace and deck view' },
  { url: 'https://ipzfnpjkslormhbkkiys.supabase.co/storage/v1/object/public/location-images/6118bbf4-3a36-4334-a6cf-0decdac218c8/003.webp', alt: 'Fireplace with record player and wooden beams' },
];

export function Demo4({ data }: { data: CallSheetData }) {
  const { production, weather, schedule } = data;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-admin-bg-base text-admin-text-primary">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-10 space-y-8">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between pb-8 border-b border-admin-border">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex items-center gap-4">
              {production.companyLogo && (
                <Image
                  src={production.companyLogo}
                  alt={production.companyName}
                  width={140}
                  height={48}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              )}
              <span className="text-admin-text-dim text-sm">&times;</span>
              <Image
                src="/images/logo/fna-logo.svg"
                alt="Friends 'n Allies"
                width={140}
                height={48}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="hidden sm:block h-10 w-px bg-admin-border" />
            <div className="text-center sm:text-left">
              <p className="font-[family-name:var(--font-display)] font-bold text-xl sm:text-2xl tracking-tight">
                {data.projectTitle}
              </p>
              <p className="text-sm sm:text-base text-admin-text-muted">
                {data.projectType}
                <span className="font-[family-name:var(--font-mono)] ml-3 text-admin-text-dim">{data.jobId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="text-center sm:text-right">
              <p className="text-sm sm:text-base font-bold">Day {data.shootDay} of {data.totalDays}</p>
              <p className="text-sm sm:text-base text-admin-text-muted">{formatDate(data.date)}</p>
            </div>
            <div className="rounded-xl bg-admin-bg-raised border border-admin-border flex flex-col items-center justify-center px-4 py-2.5 sm:px-5 sm:py-3">
              <span className="text-xs sm:text-sm uppercase tracking-wider font-bold text-admin-text-muted leading-none">
                {formatMonth(data.date)}
              </span>
              <span className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold leading-none mt-0.5">
                {formatDay(data.date)}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ MAIN GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

          {/* ── SIDEBAR ──────────────────────────────────── */}
          <div className="space-y-5">

            {/* Call Time */}
            <div className="rounded-xl bg-white p-8 text-center">
              <p className="text-base uppercase tracking-[0.25em] font-extrabold text-neutral-800">
                General Call
              </p>
              <p className="font-[family-name:var(--font-display)] text-6xl font-bold tracking-tighter text-black mt-2 whitespace-nowrap">
                {data.callTime}
              </p>
              <p className="text-xs uppercase tracking-wider text-neutral-400 mt-2 font-semibold">
                See specific times below
              </p>
            </div>

            {/* Weather */}
            {weather && (
              <div className="rounded-xl border border-admin-border bg-admin-bg-raised p-6">
                <div className="flex items-center gap-4">
                  <Sun className="w-12 h-12 text-amber-400 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-4xl font-bold">
                      {weather.tempHigh}°
                      <span className="text-xl font-normal text-admin-text-muted"> / {weather.tempLow}°</span>
                    </p>
                    <p className="text-base text-admin-text-muted mt-0.5">{weather.description}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-admin-text-muted mt-5 pt-4 border-t border-admin-border">
                  <span className="flex items-center gap-2"><Sunrise className="w-4 h-4" /> {weather.sunrise}</span>
                  <span className="flex items-center gap-2"><Sunset className="w-4 h-4" /> {weather.sunset}</span>
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="rounded-xl border border-admin-border bg-admin-bg-raised p-6 space-y-4">
              {[
                { label: 'Crew Call', time: schedule.crewCall },
                { label: 'Talent Call', time: schedule.talentCall },
                { label: 'Shooting Call', time: schedule.shootingCall },
                { label: 'Lunch', time: schedule.lunch },
                { label: 'Est. Wrap', time: schedule.estimatedWrap },
              ].filter((s) => s.time).map((s) => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-base text-admin-text-muted">{s.label}</span>
                  <span className="font-[family-name:var(--font-mono)] text-base font-semibold">{s.time}</span>
                </div>
              ))}
            </div>

            {/* Nearest Hospital — danger tones with embedded map */}
            {data.locations.hospital && (
              <div className="rounded-xl border border-admin-danger-border bg-admin-danger-bg p-6">
                <p className="text-sm uppercase tracking-wider font-bold text-admin-danger mb-3">
                  Nearest Hospital
                </p>
                <p className="font-[family-name:var(--font-display)] font-bold text-base">
                  {data.locations.hospital.name}
                </p>
                {data.locations.hospital.address && (
                  <p className="text-sm text-admin-text-muted mt-1">{data.locations.hospital.address}</p>
                )}
                {data.locations.hospital.phone && (
                  <p className="text-base mt-1">
                    <a href={`tel:${data.locations.hospital.phone}`} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
                      {data.locations.hospital.phone}
                    </a>
                  </p>
                )}
                {data.locations.hospital.address && (
                  <div className="mt-4">
                    <MapPlaceholderSmall address={data.locations.hospital.address} />
                  </div>
                )}
              </div>
            )}

            {/* Set Contact — accent purple, matches hospital card style */}
            <div className="rounded-xl border border-[var(--admin-accent)] p-6" style={{ backgroundColor: 'rgba(161, 77, 253, 0.15)' }}>
              <p className="text-sm uppercase tracking-wider font-bold text-[var(--admin-accent)] mb-3">
                Set Contact
              </p>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-display)] font-bold text-base">
                    Ol&apos; Richie
                  </p>
                  <div className="flex flex-col gap-1.5 mt-3">
                    <a href="tel:+13105550102" className="flex items-center gap-2 text-base hover:text-[var(--admin-accent)] transition-colors">
                      <Phone className="w-4 h-4 text-[var(--admin-accent)]" />
                      <span>(310) 555-0102</span>
                    </a>
                    <a href="mailto:hi@fna.wtf" className="flex items-center gap-2 text-base hover:text-[var(--admin-accent)] transition-colors">
                      <Mail className="w-4 h-4 text-[var(--admin-accent)]" />
                      <span>hi@fna.wtf</span>
                    </a>
                  </div>
                </div>
                <Image
                  src="/images/about/richie.jpg"
                  alt="Richie"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ─────────────────────────────── */}
          <div className="flex flex-col gap-10">

            {/* Bulletins — info tones, no icon */}
            {data.bulletins.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-admin-info-border bg-admin-info-bg px-7 py-6"
              >
                <p className="text-base leading-relaxed">{b.text}</p>
              </div>
            ))}

            {/* Lunch Order CTA — bold yellow bar */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-7 py-5 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-base font-[family-name:var(--font-display)] font-bold text-amber-200 uppercase tracking-wider">
                Please put your lunch order in before call!
              </p>
              <a
                href="https://www.doordash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-800 hover:bg-red-700 text-white hover:!text-white font-bold text-sm uppercase tracking-wider transition-colors shrink-0"
              >
                Order on DoorDash
              </a>
            </div>

            {/* Locations — stretches to fill sidebar height */}
            <section className="flex-1 flex flex-col">
              <SectionHeader icon={<Navigation className="w-6 h-6" />} title="Locations" count={data.locations.set ? 1 : 0} />
              {data.locations.set && (
                <div className="rounded-xl border border-admin-border bg-admin-bg-raised p-6 flex flex-col flex-1">
                  <p className="font-[family-name:var(--font-display)] font-bold text-lg">
                    {data.locations.set.name}
                  </p>
                  {data.locations.set.address && (
                    <p className="text-base text-admin-text-muted mt-1">{data.locations.set.address}</p>
                  )}
                  {data.locations.set.phone && (
                    <p className="text-base mt-1">
                      <a href={`tel:${data.locations.set.phone}`} className="text-admin-text-muted hover:text-admin-text-primary transition-colors">
                        {data.locations.set.phone}
                      </a>
                    </p>
                  )}
                  {data.locations.set.note && (
                    <p className="text-sm text-admin-text-dim mt-3 leading-relaxed">{data.locations.set.note}</p>
                  )}

                  {/* Parking inline */}
                  {data.locations.parking && data.locations.parking.note && (
                    <div className="mt-4 pt-4 border-t border-admin-border">
                      <p className="text-sm uppercase tracking-wider font-bold text-admin-text-muted mb-1">Parking</p>
                      <p className="text-sm text-admin-text-dim leading-relaxed">{data.locations.parking.note}</p>
                    </div>
                  )}

                  {data.locations.set.address && (
                    <div className="mt-5 flex-1 min-h-[9rem]">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(data.locations.set.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-admin-border-subtle bg-admin-bg-inset relative group h-full"
                      >
                        <div className="h-full min-h-[9rem] bg-admin-bg-hover flex items-center justify-center relative">
                          <MapPin className="w-8 h-8 text-admin-text-dim" strokeWidth={1.5} />
                          <span className="absolute bottom-3 right-3 text-admin-text-dim text-sm group-hover:text-admin-text-secondary transition-colors">
                            Open in Maps
                          </span>
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Location photo gallery */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {locationImages.map((img, idx) => (
                      <button
                        key={img.url}
                        type="button"
                        className="aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxIndex(idx)}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt}
                          width={120}
                          height={120}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>

        {/* ═══ CAST — full width ═══ */}
        {data.cast.length > 0 && (
          <section>
            <SectionHeader icon={<UserCheck className="w-6 h-6" />} title="Cast" count={data.cast.length} />
            <div className="rounded-xl border border-admin-border overflow-hidden">
              <table className="w-full hidden sm:table table-fixed">
                <colgroup>
                  <col className="w-[76px]" />
                  <col />
                  <col />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                </colgroup>
                <thead>
                  <tr className="bg-admin-bg-hover text-sm uppercase tracking-wider text-admin-text-dim">
                    <th className="px-4 py-4" />
                    <th className="px-4 py-4 text-left font-bold">Name</th>
                    <th className="px-4 py-4 text-left font-bold">Role</th>
                    <th className="px-4 py-4 text-right font-bold">Call</th>
                    <th className="px-4 py-4 text-right font-bold">Wrap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {data.cast.map((c) => (
                    <tr key={c.id} className="bg-admin-bg-raised hover:bg-admin-bg-hover transition-colors">
                      <td className="pl-6 pr-2 py-5">
                        <div className="flex justify-center">
                          <Headshot src={c.headshot} alt={c.name} size={44} />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-base">{c.name}</td>
                      <td className="px-4 py-4 text-base text-admin-text-muted">{c.role}</td>
                      <td className="px-4 py-4 text-right font-[family-name:var(--font-mono)] text-base font-semibold whitespace-nowrap">{c.callTime}</td>
                      <td className="px-4 py-4 text-right font-[family-name:var(--font-mono)] text-base text-admin-text-muted whitespace-nowrap">{c.wrap || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sm:hidden divide-y divide-admin-border">
                {data.cast.map((c) => (
                  <div key={c.id} className="bg-admin-bg-raised px-5 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{c.name}</p>
                      <p className="text-sm text-admin-text-muted truncate">{c.role}</p>
                      <div className="flex items-center gap-5 mt-2">
                        <div>
                          <span className="text-xs uppercase tracking-wider text-admin-text-dim">Call</span>
                          <p className="font-[family-name:var(--font-mono)] text-sm font-semibold">{c.callTime}</p>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-wider text-admin-text-dim">Wrap</span>
                          <p className="font-[family-name:var(--font-mono)] text-sm text-admin-text-muted">{c.wrap || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <Headshot src={c.headshot} alt={c.name} size={44} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ CREW — full width, contact icons in first column ═══ */}
        {data.crew.length > 0 && (
          <section>
            <SectionHeader icon={<Users className="w-6 h-6" />} title="Crew" count={data.crew.length} />
            <div className="rounded-xl border border-admin-border overflow-hidden">
              <table className="w-full hidden sm:table table-fixed">
                <colgroup>
                  <col className="w-[76px]" />
                  <col />
                  <col />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                </colgroup>
                <thead>
                  <tr className="bg-admin-bg-hover text-sm uppercase tracking-wider text-admin-text-dim">
                    <th className="px-4 py-4" />
                    <th className="px-4 py-4 text-left font-bold">Name</th>
                    <th className="px-4 py-4 text-left font-bold">Role</th>
                    <th className="px-4 py-4 text-right font-bold">Call</th>
                    <th className="px-4 py-4 text-right font-bold">Wrap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {data.crew.map((c, i) => (
                    <tr key={i} className="bg-admin-bg-raised hover:bg-admin-bg-hover transition-colors">
                      <td className="pl-6 pr-2 py-4">
                        <div className="flex items-center justify-center gap-4">
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="text-admin-text-dim hover:text-admin-text-primary transition-colors" title={c.phone}>
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="text-admin-text-dim hover:text-admin-text-primary transition-colors" title={c.email}>
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-base">{c.name}</td>
                      <td className="px-4 py-4 text-base text-admin-text-muted">{c.title}</td>
                      <td className="px-4 py-4 text-right font-[family-name:var(--font-mono)] text-base font-semibold whitespace-nowrap">
                        {c.callTime}
                      </td>
                      <td className="px-4 py-4 text-right font-[family-name:var(--font-mono)] text-base text-admin-text-muted whitespace-nowrap">
                        {c.wrap || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sm:hidden divide-y divide-admin-border">
                {data.crew.map((c, i) => (
                  <div key={i} className="bg-admin-bg-raised px-5 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{c.name}</p>
                      <p className="text-sm text-admin-text-muted truncate">{c.title}</p>
                      <div className="flex items-center gap-5 mt-2">
                        <div>
                          <span className="text-xs uppercase tracking-wider text-admin-text-dim">Call</span>
                          <p className="font-[family-name:var(--font-mono)] text-sm font-semibold">{c.callTime}</p>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-wider text-admin-text-dim">Wrap</span>
                          <p className="font-[family-name:var(--font-mono)] text-sm text-admin-text-muted">{c.wrap || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0 pt-1">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-admin-text-dim hover:text-admin-text-primary" title={c.phone}>
                          <Phone className="w-5 h-5" />
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-admin-text-dim hover:text-admin-text-primary" title={c.email}>
                          <Mail className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ SCENE SCHEDULE — full width with milestone rows ═══ */}
        {data.scenes && data.scenes.length > 0 && (() => {
          // Build interleaved timeline: scenes + milestone markers
          type TimelineRow =
            | { kind: 'scene'; scene: (typeof data.scenes)[number] }
            | { kind: 'milestone'; label: string; time: string; color: 'success' | 'warning' | 'danger'; endTime: string | null };

          const milestones: TimelineRow[] = [];
          if (schedule.crewCall) milestones.push({ kind: 'milestone', label: 'General Call', time: schedule.crewCall, color: 'success', endTime: null });
          if (schedule.lunch) {
            // Lunch gets a 1-hour duration by default; endTime = lunch + 1hr
            const lunchMin = parseTime(schedule.lunch);
            const endMin = lunchMin + 60;
            const endH = Math.floor(endMin / 60);
            const endM = endMin % 60;
            const period = endH >= 12 ? 'PM' : 'AM';
            const h12 = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
            const endStr = `${h12}:${endM.toString().padStart(2, '0')} ${period}`;
            milestones.push({ kind: 'milestone', label: 'Lunch', time: schedule.lunch, color: 'warning', endTime: endStr });
          }
          if (schedule.estimatedWrap) milestones.push({ kind: 'milestone', label: 'Wrap', time: schedule.estimatedWrap, color: 'danger', endTime: null });

          const rows: TimelineRow[] = [
            ...data.scenes.map((s) => ({ kind: 'scene' as const, scene: s })),
            ...milestones,
          ].sort((a, b) => {
            const tA = a.kind === 'scene' ? parseTime(a.scene.estimatedStart) : parseTime(a.time);
            const tB = b.kind === 'scene' ? parseTime(b.scene.estimatedStart) : parseTime(b.time);
            if (tA !== tB) return tA - tB;
            // Milestones before scenes at the same time
            return a.kind === 'milestone' ? -1 : 1;
          });

          return (
            <section>
              <SectionHeader icon={<Clapperboard className="w-6 h-6" />} title="Scene Schedule" count={data.scenes.length} />
              <div className="rounded-xl border border-admin-border overflow-hidden divide-y divide-admin-border">
                {/* Header row — aligned with cast/crew tables */}
                <div className="bg-admin-bg-hover py-4 hidden sm:flex items-center text-sm uppercase tracking-wider text-admin-text-dim font-bold">
                  <div className="w-[76px] shrink-0 pl-6 pr-2" />
                  <div className="flex-1 px-4">Description</div>
                  <div className="w-[160px] shrink-0 text-right px-4">Start</div>
                  <div className="w-[160px] shrink-0 text-right px-4">End</div>
                </div>
                {rows.map((row) => {
                  if (row.kind === 'milestone') {
                    const colorMap = {
                      success: { bg: 'bg-emerald-900/40 text-emerald-300', icon: <Clock className="w-5 h-5" /> },
                      warning: { bg: 'bg-amber-900/40 text-amber-300', icon: <UtensilsCrossed className="w-5 h-5" /> },
                      danger: { bg: 'bg-red-900/40 text-red-300', icon: <Flag className="w-5 h-5" /> },
                    };
                    const { bg, icon } = colorMap[row.color];
                    return (
                      <div key={`ms-${row.label}`} className={`${bg} py-3 sm:py-4 flex items-center`}>
                        {/* Icon in ID column */}
                        <div className="w-[52px] sm:w-[76px] shrink-0 pl-4 sm:pl-6 pr-2 flex justify-center">
                          {icon}
                        </div>
                        {/* Label aligned with Description */}
                        <div className="flex-1 px-3 sm:px-4">
                          <span className="font-[family-name:var(--font-display)] font-bold text-sm sm:text-base uppercase tracking-wider">
                            {row.label}
                          </span>
                        </div>
                        {/* Mobile: single compact time */}
                        <div className="sm:hidden shrink-0 pr-4">
                          <span className="font-[family-name:var(--font-mono)] text-sm font-semibold">
                            {row.color === 'warning' && row.endTime ? `${row.time} – ${row.endTime}` : row.time}
                          </span>
                        </div>
                        {/* Desktop: Start column */}
                        <div className="hidden sm:block w-[160px] shrink-0 text-right px-4">
                          {(row.color === 'success' || row.color === 'warning') && (
                            <span className="font-[family-name:var(--font-mono)] text-base font-semibold">{row.time}</span>
                          )}
                          {row.color === 'danger' && (
                            <span className="font-[family-name:var(--font-mono)] text-base font-semibold opacity-30">—</span>
                          )}
                        </div>
                        {/* Desktop: End column */}
                        <div className="hidden sm:block w-[160px] shrink-0 text-right px-4">
                          {row.color === 'danger' && (
                            <span className="font-[family-name:var(--font-mono)] text-base font-semibold">{row.time}</span>
                          )}
                          {row.color === 'warning' && row.endTime && (
                            <span className="font-[family-name:var(--font-mono)] text-base font-semibold">{row.endTime}</span>
                          )}
                          {row.color === 'success' && (
                            <span className="font-[family-name:var(--font-mono)] text-base font-semibold opacity-30">—</span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const s = row.scene;
                  const castMembers = s.cast.map(id => data.cast.find(c => c.id === id)).filter(Boolean);
                  return (
                    <div key={s.sceneId} className="bg-admin-bg-raised py-5 sm:py-7 flex flex-col sm:flex-row sm:items-start">
                      {/* Scene ID — same 76px as cast/crew first column */}
                      <div className="sm:w-[76px] shrink-0 pl-5 sm:pl-6 pr-2">
                        <span className="font-[family-name:var(--font-mono)] text-xl sm:text-2xl font-bold">{s.sceneId}</span>
                      </div>
                      {/* Description + location + notes */}
                      <div className="flex-1 min-w-0 px-4 mt-2 sm:mt-0">
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-admin-text-muted">
                          {s.intExt}. {s.location} — {s.timeOfDay}
                        </p>
                        <p className="text-sm sm:text-base font-medium mt-1.5">{s.description}</p>
                        {s.notes && <p className="text-xs sm:text-sm text-admin-text-dim mt-2">{s.notes}</p>}
                        {/* Mobile times — inline */}
                        <div className="flex items-center gap-3 mt-3 sm:hidden">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-admin-text-dim">Start</span>
                            <p className="font-[family-name:var(--font-mono)] text-sm font-semibold">{s.estimatedStart}</p>
                          </div>
                          <span className="text-admin-text-dim">—</span>
                          <div>
                            <span className="text-xs uppercase tracking-wider text-admin-text-dim">End</span>
                            <p className="font-[family-name:var(--font-mono)] text-sm text-admin-text-muted">{s.estimatedEnd}</p>
                          </div>
                        </div>
                        {/* Cast headshots */}
                        {castMembers.length > 0 && (
                          <div className="flex items-center gap-3 mt-4 flex-wrap">
                            {castMembers.map((c) => c && (
                              <div key={c.id} className="flex items-center gap-2">
                                <Headshot src={c.headshot} alt={c.name} size={28} />
                                <span className="text-sm text-admin-text-muted">{c.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Desktop: Start */}
                      <div className="hidden sm:block w-[160px] shrink-0 text-right px-4">
                        <p className="font-[family-name:var(--font-mono)] text-base font-semibold whitespace-nowrap">{s.estimatedStart}</p>
                      </div>
                      {/* Desktop: End */}
                      <div className="hidden sm:block w-[160px] shrink-0 text-right px-4">
                        <p className="font-[family-name:var(--font-mono)] text-base text-admin-text-muted whitespace-nowrap">{s.estimatedEnd}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* ═══ VENDORS 1/3 + DEPT NOTES 2/3 — full width ═══ */}
        {(data.specialInstructions.length > 0 || (data.vendors && data.vendors.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            {/* Vendors */}
            {data.vendors && data.vendors.length > 0 && (
              <section>
                <SectionHeader icon={<Truck className="w-6 h-6" />} title="Vendors" count={data.vendors.length} />
                <div className="rounded-xl border border-admin-border overflow-hidden divide-y divide-admin-border">
                  {data.vendors.map((v) => (
                    <div key={v.name} className="bg-admin-bg-raised px-6 py-5">
                      <p className="font-[family-name:var(--font-display)] font-bold text-lg uppercase tracking-wider mb-0.5">{v.name}</p>
                      <p className="text-sm text-admin-text-dim">{v.role}</p>
                      {v.contact && <p className="text-lg text-admin-text-muted mt-3">{v.contact}</p>}
                      {v.phone && (
                        <a href={`tel:${v.phone}`} className={`text-base text-admin-text-muted hover:text-admin-text-primary transition-colors inline-block ${v.contact ? 'mt-1' : 'mt-3'}`}>
                          {v.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Department Notes */}
            {data.specialInstructions.length > 0 && (
              <section>
                <SectionHeader icon={<FileText className="w-6 h-6" />} title="Department Notes" count={data.specialInstructions.length} />
                <div className="rounded-xl border border-admin-border overflow-hidden divide-y divide-admin-border">
                  {data.specialInstructions.map((inst, i) => (
                    <div key={i} className="bg-admin-bg-raised px-6 py-5">
                      <p className="font-[family-name:var(--font-display)] font-bold text-lg uppercase tracking-wider mb-1.5">
                        {inst.category}
                      </p>
                      <p className="text-base text-admin-text-muted leading-relaxed">{inst.notes}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <footer className="pt-10 pb-12 border-t border-admin-border">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-10">
              {[
                { name: "Ol' Richie", headshot: '/images/about/richie.jpg' },
                { name: 'Ready', headshot: '/images/about/ready.jpg' },
              ].map((person) => (
                <div key={person.name} className="flex flex-col items-center gap-2">
                  <Image
                    src={person.headshot}
                    alt={person.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="text-center">
                    <p className="text-base font-medium">{person.name}</p>
                    <p className="text-sm text-admin-text-muted">Co-Founder</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-base text-admin-text-muted text-center max-w-md leading-relaxed">
              Thank you for being part of this project. We appreciate every single one of you. Let&apos;s make something great together.
            </p>
          </div>
        </footer>
      </div>

      {/* Lightbox for location photos */}
      {lightboxIndex !== null && (
        <CallSheetLightbox
          images={locationImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
