'use client';

import { useState } from 'react';
import { Globe, Home, Play, ClipboardList, DollarSign, Info, EyeOff } from 'lucide-react';
import { SaveButton } from './SaveButton';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { type SeoRow, updateSeoSetting } from '../actions';
import { AdminTabBar } from './AdminTabBar';

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
  const { saving, saved, wrap: wrapSave } = useSaveState(2000);

  const handleChange = (id: string, field: keyof SeoRow, value: string | boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = (row: SeoRow) => wrapSave(async () => {
    await updateSeoSetting(row.id, {
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      og_title: row.og_title,
      og_description: row.og_description,
      og_image_url: row.og_image_url,
      canonical_url: row.canonical_url,
      no_index: row.no_index,
    });
  });

  const sorted = [...settings].sort((a, b) => {
    const ai = PAGE_ORDER.indexOf(a.page_slug);
    const bi = PAGE_ORDER.indexOf(b.page_slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const activeRow = sorted.find((r) => r.page_slug === activeSlug) ?? sorted[0];

  return (
    <>
      <AdminTabBar
        tabs={sorted.map((row) => {
          const meta = PAGE_META[row.page_slug] ?? { label: row.page_slug, icon: Globe };
          const Icon = meta.icon;
          return {
            value: row.page_slug,
            label: meta.label,
            icon: <Icon size={13} className="flex-shrink-0" />,
            badge: row.no_index ? <EyeOff size={10} className="text-red-400 flex-shrink-0" /> : undefined,
          };
        })}
        activeTab={activeSlug}
        onTabChange={setActiveSlug}
        dividerAfter="_global"
      />

      {/* Active page form */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-8 pt-4 pb-8">
        {activeRow && (
          <div className="space-y-4">
            <p className="text-xs text-[#515155]">
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
                  className="rounded border-border-subtle bg-transparent"
                />
                <span className="text-muted-foreground">
                  No Index <span className="text-[#404044]">(hide from search engines)</span>
                </span>
              </label>

              <SaveButton saving={saving} saved={saved} onClick={() => handleSave(activeRow)} className="px-4 py-2 text-sm" />
            </div>
          </div>
        )}
      </div>
    </>
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
              overLimit ? 'text-red-400' : nearLimit ? 'text-yellow-400' : 'text-[#303033]'
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
          className="w-full rounded-lg admin-input px-3 py-2 text-sm resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg admin-input px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
