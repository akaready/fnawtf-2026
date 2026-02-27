/**
 * Shared types and utilities for company views (Clients, Leads, Partners).
 */

import type { ClientRow } from '../actions';
import type { ContactRow } from '@/types/proposal';

export type { ClientRow, ContactRow };

export type ClientProject = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  client_id: string | null;
  category: string | null;
};

export type ClientTestimonial = {
  id: string;
  quote: string;
  person_name: string | null;
  person_title: string | null;
  client_id: string | null;
};

export type CompanyType = 'client' | 'lead' | 'partner';
export type CompanyStatus = 'active' | 'prospect' | 'on hold' | 'past';

export const ALL_STATUSES: CompanyStatus[] = ['active', 'prospect', 'on hold', 'past'];

export const STATUS_CONFIG: Record<CompanyStatus, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',   color: 'text-emerald-400',            dot: 'bg-emerald-500' },
  prospect:  { label: 'Prospect', color: 'text-amber-400',              dot: 'bg-amber-500' },
  'on hold': { label: 'On Hold',  color: 'text-slate-400',              dot: 'bg-slate-500' },
  past:      { label: 'Past',     color: 'text-muted-foreground/40',    dot: 'bg-white/20' },
};

import { Building2, Target, Link2 } from 'lucide-react';

export const TYPE_CONFIG: Record<CompanyType, {
  label: string;
  Icon: React.ElementType;
  dotBg: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  filterActiveBg: string;
  filterActiveBorder: string;
  filterActiveText: string;
}> = {
  client: {
    label: 'Client', Icon: Building2,
    dotBg: 'bg-emerald-500',
    activeBg: 'bg-emerald-500/15', activeText: 'text-emerald-400', activeBorder: 'border-emerald-500/30',
    filterActiveBg: 'bg-emerald-500/10', filterActiveBorder: 'border-emerald-500/40', filterActiveText: 'text-emerald-400',
  },
  lead: {
    label: 'Lead', Icon: Target,
    dotBg: 'bg-amber-500',
    activeBg: 'bg-amber-500/15', activeText: 'text-amber-400', activeBorder: 'border-amber-500/30',
    filterActiveBg: 'bg-amber-500/10', filterActiveBorder: 'border-amber-500/40', filterActiveText: 'text-amber-400',
  },
  partner: {
    label: 'Partner', Icon: Link2,
    dotBg: 'bg-sky-500',
    activeBg: 'bg-sky-500/15', activeText: 'text-sky-400', activeBorder: 'border-sky-500/30',
    filterActiveBg: 'bg-sky-500/10', filterActiveBorder: 'border-sky-500/40', filterActiveText: 'text-sky-400',
  },
};

export const ALL_TYPES: CompanyType[] = ['client', 'lead', 'partner'];

/**
 * Returns a Tailwind bg class for the 1px gradient-border wrapper.
 * All class strings are explicit so Tailwind's scanner picks them up.
 */
export function getCardBorderBg(types: CompanyType[], focused: boolean): string {
  const c = types.includes('client');
  const l = types.includes('lead');
  const p = types.includes('partner');

  if (!c && !l && !p) return focused ? 'bg-white/20' : 'bg-white/[0.08]';

  if (c && !l && !p) return focused ? 'bg-emerald-600/70' : 'bg-emerald-800/50';
  if (!c && l && !p) return focused ? 'bg-amber-600/70'   : 'bg-amber-800/50';
  if (!c && !l && p) return focused ? 'bg-sky-600/70'     : 'bg-sky-800/50';

  if (c && l && !p) return focused
    ? 'bg-gradient-to-br from-emerald-600/70 to-amber-600/70'
    : 'bg-gradient-to-br from-emerald-800/50 to-amber-800/50';
  if (c && !l && p) return focused
    ? 'bg-gradient-to-br from-emerald-600/70 to-sky-600/70'
    : 'bg-gradient-to-br from-emerald-800/50 to-sky-800/50';
  if (!c && l && p) return focused
    ? 'bg-gradient-to-br from-amber-600/70 to-sky-600/70'
    : 'bg-gradient-to-br from-amber-800/50 to-sky-800/50';

  return focused
    ? 'bg-gradient-to-br from-emerald-600/70 via-amber-600/70 to-sky-600/70'
    : 'bg-gradient-to-br from-emerald-800/50 via-amber-800/50 to-sky-800/50';
}
