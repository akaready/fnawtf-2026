'use client';

import Link from 'next/link';

interface ProjectMetaGridProps {
  styleTags: string[];
  premiumAddons: string[];
  cameraTechniques: string[];
  productionDays: number | null;
  crewCount: number | null;
  talentCount: number | null;
  locationCount: number | null;
}

export function ProjectMetaGrid({
  styleTags,
  premiumAddons,
  cameraTechniques,
  productionDays,
  crewCount,
  talentCount,
  locationCount,
}: ProjectMetaGridProps) {
  const scopeTags = [
    productionDays != null && `Days: ${productionDays}`,
    crewCount != null && `Crew: ${crewCount}`,
    talentCount != null && `Talent: ${talentCount}`,
    locationCount != null && `Locations: ${locationCount}`,
  ].filter(Boolean) as string[];

  const hasAnyData =
    styleTags.length > 0 ||
    premiumAddons.length > 0 ||
    cameraTechniques.length > 0 ||
    scopeTags.length > 0;

  if (!hasAnyData) return null;

  return (
    <section className="py-10 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Style */}
          <LinkedTagZone label="Style" items={styleTags} param="tags" />

          {/* Add-Ons */}
          <LinkedTagZone label="Add-Ons" items={premiumAddons} param="addons" />

          {/* Techniques */}
          <LinkedTagZone label="Techniques" items={cameraTechniques} param="techniques" />

          {/* Scope */}
          <div>
            <p className="text-xs tracking-[0.4em] uppercase font-mono text-white/30 mb-6">
              Scope
            </p>
            {scopeTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {scopeTags.map((tag) => (
                  <Link
                    key={tag}
                    href="/work"
                    className="bg-white/5 border border-white/10 rounded px-3 py-1 text-base text-white/70 hover:border-white/50 hover:text-white active:border-accent active:text-accent active:bg-accent/10 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/20 text-base italic">—</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function LinkedTagZone({
  label,
  items,
  param,
}: {
  label: string;
  items: string[];
  param: string;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.4em] uppercase font-mono text-white/30 mb-6">{label}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item}
              href={`/work?${param}=${encodeURIComponent(item)}`}
              className="bg-white/5 border border-white/10 rounded px-3 py-1 text-base text-white/70 hover:border-white/50 hover:text-white active:border-accent active:text-accent active:bg-accent/10 transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-white/20 text-base italic">—</p>
      )}
    </div>
  );
}
