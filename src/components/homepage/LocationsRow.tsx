import { RevealGroup, RevealItem } from '@/components/animations/Reveal';

interface LocationsRowProps {
  locations?: string[];
}

/**
 * LocationsRow - Small centered text showing locations
 * Appears with scroll reveal animation
 */
export function LocationsRow({
  locations = [
    'San Francisco',
    'Los Angeles',
    'Austin',
    'New York',
    'Global',
  ],
}: LocationsRowProps) {
  return (
    <div className="py-6 px-6 bg-background border-y border-border">
      <div className="max-w-7xl mx-auto">
        <RevealGroup
          className="text-sm md:text-base text-muted-foreground text-center"
          distance="1em"
          stagger={100}
        >
          {locations.map((location, index) => (
            <RevealItem key={location}>
              <span>
                {location}
                {index < locations.length - 1 && ' • '}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </div>
  );
}
