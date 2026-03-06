import type { CallSheetLocations as LocationsType, LocationInfo } from './types';

/* ── Section label ─────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--muted-foreground)] mb-4 pb-2 border-b border-[var(--accent)] inline-block">
      {children}
    </h2>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ParkingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6v12M6 12h12" />
      <rect x="2" y="2" width="20" height="20" rx="4" />
    </svg>
  );
}

/* ── Location card ─────────────────────────────────────────── */
function LocationCard({
  icon,
  label,
  location,
}: {
  icon: React.ReactNode;
  label: string;
  location: LocationInfo | null;
}) {
  if (!location) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--accent)]">{icon}</span>
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--muted-foreground)]">
          {label}
        </h3>
      </div>

      <p className="font-[family-name:var(--font-display)] font-semibold text-sm text-[var(--accent)]">
        {location.mapsUrl ? (
          <a
            href={location.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {location.name}
          </a>
        ) : (
          location.name
        )}
      </p>

      {location.address && (
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {location.address}
        </p>
      )}

      {location.phone && (
        <p className="text-sm mt-1">
          <a
            href={`tel:${location.phone}`}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {location.phone}
          </a>
        </p>
      )}

      {location.note && (
        <p className="text-xs text-[var(--muted-foreground)] mt-3 leading-relaxed border-t border-[var(--border)] pt-3">
          {location.note}
        </p>
      )}
    </div>
  );
}

/* ── Locations section ─────────────────────────────────────── */
export function CallSheetLocations({ locations }: { locations: LocationsType }) {
  const hasAny = locations.set || locations.parking || locations.hospital;
  if (!hasAny) return null;

  return (
    <section>
      <SectionLabel>Location</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LocationCard icon={<MapPinIcon />} label="Set Location" location={locations.set} />
        <LocationCard icon={<ParkingIcon />} label="Parking" location={locations.parking} />
        <LocationCard icon={<HospitalIcon />} label="Nearest Hospital" location={locations.hospital} />
      </div>
    </section>
  );
}
