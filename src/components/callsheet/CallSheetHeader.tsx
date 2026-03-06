'use client';

import type { CallSheetData } from './types';
import Image from 'next/image';

/* ── Weather icon as inline SVG ────────────────────────────── */
function WeatherIcon({ condition }: { condition: string }) {
  switch (condition) {
    case 'sunny':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-400" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>
      );
    case 'partly-cloudy':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="8" r="4" fill="currentColor" className="text-amber-400" stroke="none" />
          <path d="M6 18h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 7 11.5V12a4 4 0 0 0-1 6z" fill="currentColor" className="text-zinc-400" stroke="none" />
        </svg>
      );
    case 'cloudy':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-zinc-400" fill="currentColor">
          <path d="M6 18h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 7 11.5V12a4 4 0 0 0-1 6z" />
        </svg>
      );
    case 'rain':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 14h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 7 7.5V8a4 4 0 0 0-1 6z" fill="currentColor" className="text-zinc-500" stroke="none" />
          <line x1="8" y1="17" x2="7" y2="20" />
          <line x1="12" y1="17" x2="11" y2="20" />
          <line x1="16" y1="17" x2="15" y2="20" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-400" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
  }
}

/* ── Format date ───────────────────────────────────────────── */
function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/* ── Header ────────────────────────────────────────────────── */
export function CallSheetHeader({ data }: { data: CallSheetData }) {
  const { production, weather, schedule } = data;

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-elevated)]">
      {/* ── Desktop: 3-column / Mobile: stacked ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1fr] divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

        {/* ── LEFT: Production Info ── */}
        <div className="p-5 md:p-6 order-3 md:order-1">
          {production.companyLogo && (
            <div className="mb-4">
              <Image
                src={production.companyLogo}
                alt={production.companyName}
                width={140}
                height={48}
                className="h-10 w-auto object-contain invert brightness-0 invert"
              />
            </div>
          )}
          <h3 className="font-[family-name:var(--font-display)] font-bold text-base">
            {production.companyName}
          </h3>
          {production.companyAddress && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {production.companyAddress}
            </p>
          )}
          {production.companyPhone && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Office:{' '}
              <a href={`tel:${production.companyPhone}`} className="hover:text-[var(--foreground)] transition-colors">
                {production.companyPhone}
              </a>
            </p>
          )}

          {production.keyCrew.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
              {production.keyCrew.map((kc) => (
                <div key={kc.role} className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-[var(--muted-foreground)] font-medium shrink-0">
                    {kc.role}:
                  </span>
                  <span className="text-sm text-[var(--foreground)] text-right">
                    {kc.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CENTER: Project Title + Call Time ── */}
        <div className="p-5 md:p-6 text-center order-1 md:order-2 flex flex-col items-center justify-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold tracking-tight">
            {data.projectTitle}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {data.projectType}
          </p>

          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] mt-6 font-semibold">
            General Crew Call
          </p>
          <p className="font-[family-name:var(--font-display)] text-5xl md:text-6xl font-bold tracking-tight mt-1">
            {data.callTime}
          </p>

          {data.safetyNote && (
            <p className="text-xs text-[var(--muted-foreground)] mt-4 max-w-[280px] leading-relaxed">
              {data.safetyNote}
            </p>
          )}
        </div>

        {/* ── RIGHT: Day/Date + Weather + Schedule ── */}
        <div className="p-5 md:p-6 order-2 md:order-3">
          {/* Day badge + date */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-semibold">
              Day {data.shootDay} of {data.totalDays}
            </p>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold mt-0.5">
              {formatDate(data.date)}
            </p>
          </div>

          {/* Weather */}
          {weather && (
            <div className="mb-5 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <WeatherIcon condition={weather.condition} />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
                    {weather.tempHigh}°
                    <span className="text-base font-normal text-[var(--muted-foreground)]">
                      {' '}/ {weather.tempLow}°
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {weather.description}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                <span className="font-semibold text-[var(--foreground)]">Sunrise</span> {weather.sunrise}
                <span className="mx-2 opacity-30">·</span>
                <span className="font-semibold text-[var(--foreground)]">Sunset</span> {weather.sunset}
              </p>
            </div>
          )}

          {/* Schedule times */}
          <div className="space-y-2">
            {[
              { label: 'Crew Call', time: schedule.crewCall },
              { label: 'Talent Call', time: schedule.talentCall },
              { label: 'Shooting Call', time: schedule.shootingCall },
              { label: 'Lunch', time: schedule.lunch },
              { label: 'Est. Wrap', time: schedule.estimatedWrap },
              ...schedule.custom,
            ]
              .filter((s) => s.time)
              .map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">{s.label}</span>
                  <span className="font-[family-name:var(--font-mono)] font-medium">
                    {s.time}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
