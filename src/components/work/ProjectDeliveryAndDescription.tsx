'use client';

import Link from 'next/link';

interface ProjectDeliveryAndDescriptionProps {
  assetsDelivered: string[];
  description: string;
}

export function ProjectDeliveryAndDescription({
  assetsDelivered,
  description,
}: ProjectDeliveryAndDescriptionProps) {
  const hasDeliverables = assetsDelivered.length > 0;
  const hasDescription = description?.trim().length > 0;

  if (!hasDeliverables && !hasDescription) return null;

  return (
    <section className="py-10 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className={`grid grid-cols-1 gap-10 items-start ${hasDeliverables && hasDescription ? 'lg:grid-cols-[1fr_2fr]' : ''}`}>
          {/* Left — Assets Delivered */}
          {hasDeliverables && (
            <div>
              <p className="text-xs tracking-[0.4em] uppercase font-mono text-white/30 mb-6">
                Deliverables
              </p>
              <div className="flex flex-wrap gap-2">
                {assetsDelivered.map((asset) => (
                  <Link
                    key={asset}
                    href={`/work?deliverables=${encodeURIComponent(asset)}`}
                    className="bg-white/5 border border-white/10 rounded px-3 py-1 text-base text-white/70 hover:border-white/50 hover:text-white active:border-accent active:text-accent active:bg-accent/10 transition-colors"
                  >
                    {asset}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Right — Description */}
          {hasDescription && (
            <div>
              <p className="text-xs tracking-[0.4em] uppercase font-mono text-white/30 mb-6">
                Description
              </p>
              {description.split('\n\n').map((para, i) => (
                <p key={i} className="text-white/70 leading-relaxed text-lg [&+p]:mt-4">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
