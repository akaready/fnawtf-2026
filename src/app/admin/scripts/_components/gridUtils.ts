import type { ScriptColumnConfig } from '@/types/scripts';

const KEYS = ['audio', 'visual', 'notes', 'reference', 'storyboard'] as const;

export const DEFAULT_FRACTIONS: Record<string, number> = {
  audio: 2, visual: 2, notes: 1, reference: 1, storyboard: 1,
};

/** Compute CSS grid-template-columns from column config (fixed ratios) */
export function getGridTemplate(config: ScriptColumnConfig): string {
  const parts: string[] = [];
  if (config.audio) parts.push('2fr');
  if (config.visual) parts.push('2fr');
  if (config.notes) parts.push('1fr');
  if (config.reference) parts.push('1fr');
  if (config.storyboard) parts.push('1fr');

  if (parts.length === 0) return '1fr';
  return parts.join(' ');
}

/** Compute CSS grid-template-columns from column config + custom fractions */
export function getGridTemplateFromFractions(
  config: ScriptColumnConfig,
  fractions: Record<string, number>,
): string {
  const parts: string[] = [];
  for (const key of KEYS) {
    if (config[key]) {
      parts.push(`${fractions[key] ?? 1}fr`);
    }
  }
  return parts.length === 0 ? '1fr' : parts.join(' ');
}

/** Ordered list of currently visible column keys */
export function getVisibleColumnKeys(config: ScriptColumnConfig): string[] {
  return KEYS.filter(k => config[k]);
}

/** Column header definitions for visible columns */
export function getVisibleColumns(config: ScriptColumnConfig) {
  const cols: { key: string; label: string; color: string; borderColor: string }[] = [];
  if (config.audio) cols.push({ key: 'audio', label: 'AUDIO', color: 'text-[var(--admin-accent)]', borderColor: 'border-l-[var(--admin-accent)]' });
  if (config.visual) cols.push({ key: 'visual', label: 'VISUAL', color: 'text-[var(--admin-info)]', borderColor: 'border-l-[var(--admin-info)]' });
  if (config.notes) cols.push({ key: 'notes', label: 'NOTES', color: 'text-[var(--admin-warning)]', borderColor: 'border-l-[var(--admin-warning)]' });
  if (config.reference) cols.push({ key: 'reference', label: 'REFERENCE', color: 'text-[var(--admin-danger)]', borderColor: 'border-l-[var(--admin-danger)]' });
  if (config.storyboard) cols.push({ key: 'storyboard', label: 'STORYBOARD', color: 'text-[var(--admin-success)]', borderColor: 'border-l-[var(--admin-success)]' });
  return cols;
}
