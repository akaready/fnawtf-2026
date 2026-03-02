import type { MergeFieldDef } from '@/types/contracts';

export interface MergeContext {
  client?: Record<string, unknown> | null;
  contact?: Record<string, unknown> | null;
  proposal?: Record<string, unknown> | null;
  quote?: Record<string, unknown> | null;
  manualFields?: Record<string, string>;
  mergeFieldDefs: MergeFieldDef[];
}

/**
 * Resolve a dot-path like "first_name" or "address.city" from an object.
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, key) => {
    if (o && typeof o === 'object' && key in (o as Record<string, unknown>)) {
      return (o as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Format a value for display in a contract body.
 */
function formatValue(value: unknown, key: string): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (key.includes('amount') || key.includes('price') || key.includes('cost') || key.includes('budget')) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
    }
    return String(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return String(value);
}

/**
 * Render a template body by substituting {{variable_name}} tokens
 * with resolved values from the merge context.
 */
export function renderTemplate(body: string, context: MergeContext): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const def = context.mergeFieldDefs.find((f) => f.key === key);
    if (!def) return `{{${key}}}`;

    if (def.source === 'manual') {
      return context.manualFields?.[key] ?? '';
    }

    const sourceObj = context[def.source];
    if (!sourceObj || !def.db_path) return '';

    const value = resolvePath(sourceObj as Record<string, unknown>, def.db_path);
    return formatValue(value, key);
  });
}

/**
 * Extract all {{variable_name}} tokens from a template body.
 */
export function extractTokens(body: string): string[] {
  const tokens: string[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    if (!tokens.includes(match[1])) tokens.push(match[1]);
  }
  return tokens;
}

/**
 * Check which tokens in the body are defined vs undefined.
 */
export function validateTokens(
  body: string,
  mergeFieldDefs: MergeFieldDef[]
): { defined: string[]; undefined: string[] } {
  const tokens = extractTokens(body);
  const knownKeys = new Set(mergeFieldDefs.map((f) => f.key));
  return {
    defined: tokens.filter((t) => knownKeys.has(t)),
    undefined: tokens.filter((t) => !knownKeys.has(t)),
  };
}
