'use client';

interface RadiusSectionProps {
  tokens: Record<string, string>;
  onChange: (variable: string, value: string) => void;
}

const RADIUS_TOKENS = [
  { var: '--admin-radius-sm',   label: 'Small',    default: '0.375rem' },
  { var: '--admin-radius-md',   label: 'Medium',   default: '0.5rem' },
  { var: '--admin-radius-lg',   label: 'Large',    default: '0.75rem' },
  { var: '--admin-radius-xl',   label: 'X-Large',  default: '1rem' },
  { var: '--admin-radius-full', label: 'Full',     default: '9999px' },
];

function remToPx(val: string): number {
  if (val.endsWith('px')) return parseFloat(val);
  if (val.endsWith('rem')) return parseFloat(val) * 16;
  return parseFloat(val) || 0;
}

function pxToRem(px: number): string {
  return `${(px / 16).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}rem`;
}

export function RadiusSection({ tokens, onChange }: RadiusSectionProps) {
  return (
    <section id="radius" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Border Radius</h2>

      {/* Controls */}
      <div className="border border-admin-border rounded-xl overflow-hidden divide-y divide-admin-border-subtle">
        {RADIUS_TOKENS.map((t) => {
          const current = tokens[t.var] || t.default;
          const px = remToPx(current);
          const isFull = t.var === '--admin-radius-full';

          return (
            <div key={t.var} className="py-3 px-4 hover:bg-admin-bg-hover transition-colors group">
              <div className="flex items-center gap-4">
                {/* Preview swatch */}
                <div
                  className="w-12 h-12 border-2 border-admin-text-muted flex-shrink-0"
                  style={{ borderRadius: current }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-admin-text-primary text-admin-sm font-medium">{t.label}</div>
                  <div className="text-admin-text-ghost font-admin-mono text-admin-xs">{t.var}</div>
                </div>

                {/* Tailwind class */}
                <div className="hidden group-hover:block text-admin-text-faint font-admin-mono text-admin-xs">
                  rounded-admin-{t.var.replace('--admin-radius-', '')}
                </div>

                {/* Slider + value */}
                {!isFull ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={1}
                      value={px}
                      onChange={(e) => onChange(t.var, pxToRem(Number(e.target.value)))}
                      className="w-24 h-1.5 accent-white appearance-none rounded-full cursor-pointer bg-admin-bg-hover-strong"
                    />
                    <span className="w-14 text-right text-admin-xs text-admin-text-dim font-admin-mono">
                      {px}px
                    </span>
                  </div>
                ) : (
                  <span className="text-admin-xs text-admin-text-dim font-admin-mono">9999px</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Live Preview</h3>
        <div className="flex flex-wrap gap-4 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <button className="btn-primary px-4 py-2.5 text-sm">Primary Button</button>
          <button className="btn-secondary px-4 py-2.5 text-sm">Secondary Button</button>
          <button className="btn-danger px-4 py-2 text-sm">Danger Button</button>
          <input
            type="text"
            placeholder="Text input..."
            className="admin-input px-3 py-2.5 text-sm w-48"
          />
          <span
            className="inline-flex items-center px-3 py-1 text-admin-xs font-medium bg-admin-bg-active text-admin-text-secondary"
            style={{ borderRadius: 'var(--admin-radius-full)' }}
          >
            Pill Badge
          </span>
        </div>
      </div>
    </section>
  );
}
