'use client';

interface TypographySectionProps {
  tokens: Record<string, string>;
  onChange: (variable: string, value: string) => void;
}

const FONT_SIZE_TOKENS = [
  { var: '--admin-font-size-xs',   label: 'XS',   tw: 'text-admin-xs' },
  { var: '--admin-font-size-sm',   label: 'SM',   tw: 'text-admin-sm' },
  { var: '--admin-font-size-base', label: 'Base', tw: 'text-admin-base' },
  { var: '--admin-font-size-lg',   label: 'LG',   tw: 'text-admin-lg' },
  { var: '--admin-font-size-xl',   label: 'XL',   tw: 'text-admin-xl' },
  { var: '--admin-font-size-2xl',  label: '2XL',  tw: 'text-admin-2xl' },
];

const FONT_WEIGHT_TOKENS = [
  { var: '--admin-font-weight-normal',    label: 'Normal (400)' },
  { var: '--admin-font-weight-medium',    label: 'Medium (500)' },
  { var: '--admin-font-weight-semibold',  label: 'Semibold (600)' },
  { var: '--admin-font-weight-bold',      label: 'Bold (700)' },
];

const LINE_HEIGHT_TOKENS = [
  { var: '--admin-line-height-tight',   label: 'Tight (1.25)' },
  { var: '--admin-line-height-normal',  label: 'Normal (1.5)' },
  { var: '--admin-line-height-relaxed', label: 'Relaxed (1.625)' },
];

const LETTER_SPACING_TOKENS = [
  { var: '--admin-letter-spacing-tight',  label: 'Tight (-0.02em)' },
  { var: '--admin-letter-spacing-normal', label: 'Normal (0)' },
  { var: '--admin-letter-spacing-wide',   label: 'Wide (0.05em)' },
];

export function TypographySection({ tokens, onChange }: TypographySectionProps) {
  return (
    <section id="typography" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Typography</h2>

      {/* Font Families */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Font Families</h3>
        <div className="space-y-4">
          {[
            { var: '--admin-font-display', label: 'Display', sample: 'The quick brown fox jumps over the lazy dog' },
            { var: '--admin-font-body',    label: 'Body',    sample: 'The quick brown fox jumps over the lazy dog' },
            { var: '--admin-font-mono',    label: 'Mono',    sample: '0123456789 ABCDEF const fn = () => {}' },
          ].map((f) => (
            <div key={f.var} className="p-4 border border-admin-border rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-admin-text-muted text-admin-sm">{f.label}</span>
                <input
                  type="text"
                  value={tokens[f.var] || ''}
                  onChange={(e) => onChange(f.var, e.target.value)}
                  className="flex-1 text-admin-xs font-admin-mono bg-transparent border border-admin-border-subtle rounded px-2 py-1 text-admin-text-secondary focus:outline-none focus:border-admin-border-focus"
                />
              </div>
              <div
                className="text-admin-xl text-admin-text-primary"
                style={{ fontFamily: tokens[f.var] || undefined }}
              >
                {f.sample}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font Sizes */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Font Sizes</h3>
        <div className="border border-admin-border rounded-xl overflow-hidden divide-y divide-admin-border-subtle">
          {FONT_SIZE_TOKENS.map((t) => (
            <div key={t.var} className="flex items-center gap-4 px-4 py-3">
              <span className="w-12 text-admin-text-muted text-admin-sm">{t.label}</span>
              <input
                type="text"
                value={tokens[t.var] || ''}
                onChange={(e) => onChange(t.var, e.target.value)}
                className="w-24 text-admin-xs font-admin-mono bg-transparent border border-admin-border-subtle rounded px-2 py-1 text-admin-text-secondary focus:outline-none focus:border-admin-border-focus"
              />
              <span
                className="flex-1 text-admin-text-primary truncate"
                style={{ fontSize: tokens[t.var] || undefined }}
              >
                The quick brown fox — {t.tw}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Font Weights</h3>
        <div className="border border-admin-border rounded-xl overflow-hidden divide-y divide-admin-border-subtle">
          {FONT_WEIGHT_TOKENS.map((t) => (
            <div key={t.var} className="flex items-center gap-4 px-4 py-3">
              <span className="w-36 text-admin-text-muted text-admin-sm">{t.label}</span>
              <input
                type="number"
                min={100}
                max={900}
                step={100}
                value={tokens[t.var] || ''}
                onChange={(e) => onChange(t.var, e.target.value)}
                className="w-20 text-admin-xs font-admin-mono bg-transparent border border-admin-border-subtle rounded px-2 py-1 text-admin-text-secondary focus:outline-none focus:border-admin-border-focus"
              />
              <span
                className="flex-1 text-admin-text-primary text-admin-lg"
                style={{ fontWeight: tokens[t.var] || undefined }}
              >
                Sample text at this weight
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Line Heights */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Line Heights</h3>
        <div className="border border-admin-border rounded-xl overflow-hidden divide-y divide-admin-border-subtle">
          {LINE_HEIGHT_TOKENS.map((t) => (
            <div key={t.var} className="flex items-start gap-4 px-4 py-3">
              <span className="w-36 text-admin-text-muted text-admin-sm pt-1">{t.label}</span>
              <input
                type="text"
                value={tokens[t.var] || ''}
                onChange={(e) => onChange(t.var, e.target.value)}
                className="w-20 text-admin-xs font-admin-mono bg-transparent border border-admin-border-subtle rounded px-2 py-1 text-admin-text-secondary focus:outline-none focus:border-admin-border-focus"
              />
              <p
                className="flex-1 text-admin-text-primary text-admin-base max-w-md"
                style={{ lineHeight: tokens[t.var] || undefined }}
              >
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Letter Spacing</h3>
        <div className="border border-admin-border rounded-xl overflow-hidden divide-y divide-admin-border-subtle">
          {LETTER_SPACING_TOKENS.map((t) => (
            <div key={t.var} className="flex items-center gap-4 px-4 py-3">
              <span className="w-36 text-admin-text-muted text-admin-sm">{t.label}</span>
              <input
                type="text"
                value={tokens[t.var] || ''}
                onChange={(e) => onChange(t.var, e.target.value)}
                className="w-24 text-admin-xs font-admin-mono bg-transparent border border-admin-border-subtle rounded px-2 py-1 text-admin-text-secondary focus:outline-none focus:border-admin-border-focus"
              />
              <span
                className="flex-1 text-admin-text-primary text-admin-lg uppercase"
                style={{ letterSpacing: tokens[t.var] || undefined }}
              >
                LETTER SPACING PREVIEW
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
