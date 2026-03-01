'use client';

const SURFACE_TIERS = [
  { name: 'Base',          tw: 'bg-admin-bg-base',          var: '--admin-bg-base' },
  { name: 'Inset',         tw: 'bg-admin-bg-inset',         var: '--admin-bg-inset' },
  { name: 'Sidebar',       tw: 'bg-admin-bg-sidebar',       var: '--admin-bg-sidebar' },
  { name: 'Sidebar Hover', tw: 'bg-admin-bg-sidebar-hover', var: '--admin-bg-sidebar-hover' },
  { name: 'Raised',        tw: 'bg-admin-bg-raised',        var: '--admin-bg-raised' },
  { name: 'Overlay',       tw: 'bg-admin-bg-overlay',       var: '--admin-bg-overlay' },
];

const ALPHA_TIERS = [
  { name: 'Wash (2%)',          tw: 'bg-admin-bg-wash' },
  { name: 'Subtle (3%)',        tw: 'bg-admin-bg-subtle' },
  { name: 'Selected (4%)',      tw: 'bg-admin-bg-selected' },
  { name: 'Hover (5%)',         tw: 'bg-admin-bg-hover' },
  { name: 'Hover Strong (10%)', tw: 'bg-admin-bg-hover-strong' },
  { name: 'Active (10%)',       tw: 'bg-admin-bg-active' },
];

export function SurfacesSection() {
  return (
    <section id="surfaces" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Surfaces & Elevation</h2>

      {/* Solid Background Tiers */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Solid Background Tiers</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {SURFACE_TIERS.map((tier) => (
            <div
              key={tier.var}
              className={`${tier.tw} border border-admin-border rounded-xl p-5 flex flex-col gap-1`}
            >
              <span className="text-admin-text-primary text-admin-sm font-medium">{tier.name}</span>
              <span className="text-admin-text-ghost font-admin-mono text-admin-xs">{tier.tw}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alpha Overlay Tiers */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Alpha Overlay Tiers</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ALPHA_TIERS.map((tier) => (
            <div
              key={tier.tw}
              className={`${tier.tw} border border-admin-border rounded-xl p-5 flex flex-col gap-1`}
            >
              <span className="text-admin-text-primary text-admin-sm font-medium">{tier.name}</span>
              <span className="text-admin-text-ghost font-admin-mono text-admin-xs">{tier.tw}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked elevation demo */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Stacked Elevation</h3>
        <div className="bg-admin-bg-base border border-admin-border rounded-xl p-6">
          <div className="text-admin-text-faint text-admin-xs mb-2">bg-base</div>
          <div className="bg-admin-bg-sidebar border border-admin-border rounded-lg p-5">
            <div className="text-admin-text-faint text-admin-xs mb-2">bg-sidebar</div>
            <div className="bg-admin-bg-raised border border-admin-border rounded-lg p-4">
              <div className="text-admin-text-faint text-admin-xs mb-2">bg-raised</div>
              <div className="bg-admin-bg-overlay border border-admin-border rounded-lg p-4">
                <div className="text-admin-text-faint text-admin-xs mb-2">bg-overlay</div>
                <div className="bg-admin-bg-active border border-admin-border-muted rounded-lg p-3 text-admin-text-primary text-admin-sm">
                  Content at highest elevation (bg-active)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
