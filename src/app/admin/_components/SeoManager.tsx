'use client';

import React, { useState, useTransition } from 'react';
import { Save, Globe, Home, Play, ClipboardList, DollarSign, Info, Check, Loader2, EyeOff } from 'lucide-react';
import { type SeoRow, updateSeoSetting } from '../actions';

const PAGE_META: Record<string, { label: string; icon: typeof Globe; description: string }> = {
  _global: { label: 'Global', icon: Globe, description: 'Fallback meta used when a page doesn\'t define its own' },
  '/': { label: 'Home', icon: Home, description: 'Homepage — fna.wtf' },
  '/work': { label: 'Work', icon: Play, description: 'Portfolio page — fna.wtf/work' },
  '/services': { label: 'Services', icon: ClipboardList, description: 'Services page — fna.wtf/services' },
  '/pricing': { label: 'Pricing', icon: DollarSign, description: 'Pricing page — fna.wtf/pricing' },
  '/about': { label: 'About', icon: Info, description: 'About page — fna.wtf/about' },
};

const PAGE_ORDER = ['_global', '/', '/work', '/services', '/pricing', '/about'];

interface Props {
  initialSettings: SeoRow[];
}

export function SeoManager({ initialSettings }: Props) {
  const [settings, setSettings] = useState<SeoRow[]>(initialSettings);
  const [activeSlug, setActiveSlug] = useState<string>('_global');
  const [saving, startSave] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleChange = (id: string, field: keyof SeoRow, value: string | boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = (row: SeoRow) => {
    startSave(async () => {
      await updateSeoSetting(row.id, {
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        og_title: row.og_title,
        og_description: row.og_description,
        og_image_url: row.og_image_url,
        canonical_url: row.canonical_url,
        no_index: row.no_index,
      });
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
    });
  };

  const sorted = [...settings].sort((a, b) => {
    const ai = PAGE_ORDER.indexOf(a.page_slug);
    const bi = PAGE_ORDER.indexOf(b.page_slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const activeRow = sorted.find((r) => r.page_slug === activeSlug) ?? sorted[0];

  return (
    <div>
      {/* Tab bar */}
      <div className="inline-flex flex-wrap gap-1.5 mb-6 bg-white/[0.04] rounded-xl p-2">
        {sorted.map((row) => {
          const meta = PAGE_META[row.page_slug] ?? { label: row.page_slug, icon: Globe };
          const Icon = meta.icon;
          const isActive = activeSlug === row.page_slug;

          return (
            <React.Fragment key={row.id}>
              <button
                onClick={() => setActiveSlug(row.page_slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground/80'
                }`}
              >
                <Icon size={13} className="flex-shrink-0" />
                {meta.label}
                {row.no_index && (
                  <EyeOff size={10} className="text-red-400 flex-shrink-0" />
                )}
              </button>
              {row.page_slug === '_global' && (
                <div className="w-px bg-white/10 mx-0.5 my-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active page form */}
      {activeRow && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground/50">
            {PAGE_META[activeRow.page_slug]?.description ?? activeRow.page_slug}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Meta Title"
              value={activeRow.meta_title ?? ''}
              onChange={(v) => handleChange(activeRow.id, 'meta_title', v)}
              placeholder="Page title for search engines"
              maxLength={70}
            />
            <Field
              label="OG Title"
              value={activeRow.og_title ?? ''}
              onChange={(v) => handleChange(activeRow.id, 'og_title', v)}
              placeholder="Title for social sharing (falls back to meta title)"
              maxLength={70}
            />
          </div>
          <Field
            label="Meta Description"
            value={activeRow.meta_description ?? ''}
            onChange={(v) => handleChange(activeRow.id, 'meta_description', v)}
            placeholder="Description for search engines"
            maxLength={160}
            multiline
          />
          <Field
            label="OG Description"
            value={activeRow.og_description ?? ''}
            onChange={(v) => handleChange(activeRow.id, 'og_description', v)}
            placeholder="Description for social sharing (falls back to meta description)"
            maxLength={200}
            multiline
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="OG Image URL"
              value={activeRow.og_image_url ?? ''}
              onChange={(v) => handleChange(activeRow.id, 'og_image_url', v)}
              placeholder="https://..."
            />
            <Field
              label="Canonical URL"
              value={activeRow.canonical_url ?? ''}
              onChange={(v) => handleChange(activeRow.id, 'canonical_url', v)}
              placeholder="Override canonical URL (optional)"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={activeRow.no_index}
                onChange={(e) => handleChange(activeRow.id, 'no_index', e.target.checked)}
                className="rounded border-border/60 bg-transparent"
              />
              <span className="text-muted-foreground">
                No Index <span className="text-muted-foreground/40">(hide from search engines)</span>
              </span>
            </label>

            <button
              onClick={() => handleSave(activeRow)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving && savedId !== activeRow.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : savedId === activeRow.id ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <Save size={14} />
              )}
              {savedId === activeRow.id ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable field ──────────────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}) {
  const len = value.length;
  const nearLimit = maxLength && len > maxLength * 0.85;
  const overLimit = maxLength && len > maxLength;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {maxLength && (
          <span
            className={`text-[10px] ${
              overLimit ? 'text-red-400' : nearLimit ? 'text-yellow-400' : 'text-muted-foreground/30'
            }`}
          >
            {len}/{maxLength}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border/40 bg-black/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      )}
    </div>
  );
}
