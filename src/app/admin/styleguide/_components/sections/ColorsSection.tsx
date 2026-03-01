'use client';

import { ColorSwatch } from '../ColorSwatch';

interface ColorsSectionProps {
  tokens: Record<string, string>;
  onChange: (variable: string, value: string) => void;
}

const TOKEN_GROUPS = [
  {
    title: 'Backgrounds — Solid',
    tokens: [
      { var: '--admin-bg-base',          label: 'Base',           tw: 'bg-admin-bg-base' },
      { var: '--admin-bg-inset',         label: 'Inset',          tw: 'bg-admin-bg-inset' },
      { var: '--admin-bg-sidebar',       label: 'Sidebar',        tw: 'bg-admin-bg-sidebar' },
      { var: '--admin-bg-sidebar-hover', label: 'Sidebar Hover',  tw: 'bg-admin-bg-sidebar-hover' },
      { var: '--admin-bg-raised',        label: 'Raised',         tw: 'bg-admin-bg-raised' },
      { var: '--admin-bg-overlay',       label: 'Overlay',        tw: 'bg-admin-bg-overlay' },
    ],
  },
  {
    title: 'Backgrounds — Alpha',
    tokens: [
      { var: '--admin-bg-wash',         label: 'Wash (2%)',       tw: 'bg-admin-bg-wash' },
      { var: '--admin-bg-subtle',       label: 'Subtle (3%)',     tw: 'bg-admin-bg-subtle' },
      { var: '--admin-bg-selected',     label: 'Selected (4%)',   tw: 'bg-admin-bg-selected' },
      { var: '--admin-bg-hover',        label: 'Hover (5%)',      tw: 'bg-admin-bg-hover' },
      { var: '--admin-bg-hover-strong', label: 'Hover Strong (10%)', tw: 'bg-admin-bg-hover-strong' },
      { var: '--admin-bg-active',       label: 'Active (10%)',    tw: 'bg-admin-bg-active' },
    ],
  },
  {
    title: 'Borders',
    tokens: [
      { var: '--admin-border-subtle',   label: 'Subtle',    tw: 'border-admin-border-subtle' },
      { var: '--admin-border',          label: 'Default',   tw: 'border-admin-border' },
      { var: '--admin-border-muted',    label: 'Muted',     tw: 'border-admin-border-muted' },
      { var: '--admin-border-emphasis', label: 'Emphasis',  tw: 'border-admin-border-emphasis' },
      { var: '--admin-border-focus',    label: 'Focus',     tw: 'border-admin-border-focus' },
    ],
  },
  {
    title: 'Text',
    tokens: [
      { var: '--admin-text-primary',     label: 'Primary',     tw: 'text-admin-text-primary' },
      { var: '--admin-text-secondary',   label: 'Secondary',   tw: 'text-admin-text-secondary' },
      { var: '--admin-text-muted',       label: 'Muted',       tw: 'text-admin-text-muted' },
      { var: '--admin-text-dim',         label: 'Dim',         tw: 'text-admin-text-dim' },
      { var: '--admin-text-faint',       label: 'Faint',       tw: 'text-admin-text-faint' },
      { var: '--admin-text-ghost',       label: 'Ghost',       tw: 'text-admin-text-ghost' },
      { var: '--admin-text-placeholder', label: 'Placeholder', tw: 'text-admin-text-placeholder' },
    ],
  },
  {
    title: 'Status — Danger',
    tokens: [
      { var: '--admin-danger',           label: 'Text',       tw: 'text-admin-danger' },
      { var: '--admin-danger-bg',        label: 'Background', tw: 'bg-admin-danger-bg' },
      { var: '--admin-danger-bg-strong', label: 'Bg Strong',  tw: 'bg-admin-danger-bg-strong' },
      { var: '--admin-danger-border',    label: 'Border',     tw: 'border-admin-danger-border' },
    ],
  },
  {
    title: 'Status — Success',
    tokens: [
      { var: '--admin-success',           label: 'Text',       tw: 'text-admin-success' },
      { var: '--admin-success-bg',        label: 'Background', tw: 'bg-admin-success-bg' },
      { var: '--admin-success-bg-strong', label: 'Bg Strong',  tw: 'bg-admin-success-bg-strong' },
      { var: '--admin-success-border',    label: 'Border',     tw: 'border-admin-success-border' },
    ],
  },
  {
    title: 'Status — Warning',
    tokens: [
      { var: '--admin-warning',           label: 'Text',       tw: 'text-admin-warning' },
      { var: '--admin-warning-bg',        label: 'Background', tw: 'bg-admin-warning-bg' },
      { var: '--admin-warning-bg-strong', label: 'Bg Strong',  tw: 'bg-admin-warning-bg-strong' },
      { var: '--admin-warning-border',    label: 'Border',     tw: 'border-admin-warning-border' },
    ],
  },
  {
    title: 'Status — Info',
    tokens: [
      { var: '--admin-info',           label: 'Text',       tw: 'text-admin-info' },
      { var: '--admin-info-bg',        label: 'Background', tw: 'bg-admin-info-bg' },
      { var: '--admin-info-bg-strong', label: 'Bg Strong',  tw: 'bg-admin-info-bg-strong' },
      { var: '--admin-info-border',    label: 'Border',     tw: 'border-admin-info-border' },
    ],
  },
  {
    title: 'Accent / Brand',
    tokens: [
      { var: '--admin-accent',        label: 'Accent',       tw: 'text-admin-accent' },
      { var: '--admin-accent-hover',  label: 'Accent Hover', tw: 'text-admin-accent-hover' },
      { var: '--admin-accent-bg',     label: 'Accent Bg',    tw: 'bg-admin-accent-bg' },
      { var: '--admin-accent-border', label: 'Accent Border', tw: 'border-admin-accent-border' },
    ],
  },
  {
    title: 'Toolbar Accents (ROYGBIV)',
    tokens: [
      { var: '--admin-toolbar-red',    label: 'Red',    tw: 'text-admin-toolbar-red' },
      { var: '--admin-toolbar-orange', label: 'Orange', tw: 'text-admin-toolbar-orange' },
      { var: '--admin-toolbar-yellow', label: 'Yellow', tw: 'text-admin-toolbar-yellow' },
      { var: '--admin-toolbar-green',  label: 'Green',  tw: 'text-admin-toolbar-green' },
      { var: '--admin-toolbar-blue',   label: 'Blue',   tw: 'text-admin-toolbar-blue' },
      { var: '--admin-toolbar-indigo', label: 'Indigo', tw: 'text-admin-toolbar-indigo' },
      { var: '--admin-toolbar-violet', label: 'Violet', tw: 'text-admin-toolbar-violet' },
    ],
  },
];

export function ColorsSection({ tokens, onChange }: ColorsSectionProps) {
  return (
    <section id="colors" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Colors</h2>
      {TOKEN_GROUPS.map((group) => (
        <div key={group.title}>
          <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">{group.title}</h3>
          <div className="border border-admin-border rounded-xl overflow-hidden divide-y divide-admin-border-subtle">
            {group.tokens.map((t) => (
              <ColorSwatch
                key={t.var}
                variable={t.var}
                label={t.label}
                tailwindClass={t.tw}
                value={tokens[t.var] || ''}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
