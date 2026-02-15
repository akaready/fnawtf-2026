/**
 * Props for the LocationsRow component
 */
interface LocationsRowProps {
  locations: string[];
}

/**
 * LocationsRow component displaying a row of location names.
 * Simple, static component with bullet separators.
 */
export function LocationsRow({ locations }: LocationsRowProps) {
  return (
    <section
      className="py-6 border-y border-border/50"
      data-locations-row
      data-reveal-group
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <p className="text-center text-sm text-muted-foreground font-mono tracking-wider" data-reveal-group-nested>
          {locations.map((location, index) => (
            <span key={location}>
              <span className="text-accent">{location}</span>
              {index < locations.length - 1 && (
                <span className="mx-3 text-border">•</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
