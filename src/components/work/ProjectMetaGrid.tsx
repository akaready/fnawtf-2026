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

  const visibleCount = [styleTags.length > 0, premiumAddons.length > 0, cameraTechniques.length > 0, scopeTags.length > 0].filter(Boolean).length;

  if (visibleCount === 0) return null;

  const gridCols =
    visibleCount === 1 ? 'grid-cols-1' :
    visibleCount === 2 ? 'sm:grid-cols-2' :
    visibleCount === 3 ? 'sm:grid-cols-3' :
    'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="py-10 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className={`grid grid-cols-1 ${gridCols} gap-10`}>
          {styleTags.length > 0 && <LinkedTagZone label="Style" items={styleTags} param="tags" />}
          {premiumAddons.length > 0 && <LinkedTagZone label="Add-Ons" items={premiumAddons} param="addons" />}
          {cameraTechniques.length > 0 && <LinkedTagZone label="Techniques" items={cameraTechniques} param="techniques" />}
          {scopeTags.length > 0 && (
            <div>
              <p className="text-xs tracking-[0.4em] uppercase font-mono text-white/30 mb-6">
                Scope
              </p>
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
            </div>
          )}
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
