'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Save, Download } from 'lucide-react';
import { AdminPageHeader } from '../../_components/AdminPageHeader';
import { ColorsSection } from './sections/ColorsSection';
import { TypographySection } from './sections/TypographySection';
import { ButtonsSection } from './sections/ButtonsSection';
import { InputsSection } from './sections/InputsSection';
import { StatusSection } from './sections/StatusSection';
import { SurfacesSection } from './sections/SurfacesSection';
import { RadiusSection } from './sections/RadiusSection';
import { PatternsSection } from './sections/PatternsSection';

const STORAGE_KEY = 'fna-admin-custom-tokens';

const SECTIONS = [
  { id: 'colors',     label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'radius',     label: 'Radius' },
  { id: 'buttons',    label: 'Buttons' },
  { id: 'inputs',     label: 'Inputs' },
  { id: 'status',     label: 'Status' },
  { id: 'surfaces',   label: 'Surfaces' },
  { id: 'patterns',   label: 'Patterns' },
];

// All CSS variables we manage
const ALL_TOKEN_VARS = [
  // Backgrounds
  '--admin-bg-base', '--admin-bg-inset', '--admin-bg-sidebar', '--admin-bg-sidebar-hover',
  '--admin-bg-raised', '--admin-bg-overlay', '--admin-bg-wash', '--admin-bg-subtle',
  '--admin-bg-selected', '--admin-bg-hover', '--admin-bg-hover-strong', '--admin-bg-active',
  // Borders
  '--admin-border-subtle', '--admin-border', '--admin-border-muted', '--admin-border-emphasis', '--admin-border-focus',
  // Text
  '--admin-text-primary', '--admin-text-secondary', '--admin-text-muted', '--admin-text-dim',
  '--admin-text-faint', '--admin-text-ghost', '--admin-text-placeholder',
  // Status
  '--admin-danger', '--admin-danger-bg', '--admin-danger-bg-strong', '--admin-danger-border',
  '--admin-success', '--admin-success-bg', '--admin-success-bg-strong', '--admin-success-border',
  '--admin-warning', '--admin-warning-bg', '--admin-warning-bg-strong', '--admin-warning-border',
  '--admin-info', '--admin-info-bg', '--admin-info-bg-strong', '--admin-info-border',
  // Accent
  '--admin-accent', '--admin-accent-hover', '--admin-accent-bg', '--admin-accent-border',
  // Toolbar (ROYGBIV)
  '--admin-toolbar-red', '--admin-toolbar-orange', '--admin-toolbar-yellow',
  '--admin-toolbar-green', '--admin-toolbar-blue', '--admin-toolbar-indigo', '--admin-toolbar-violet',
  // Typography
  '--admin-font-display', '--admin-font-body', '--admin-font-mono',
  '--admin-font-size-xs', '--admin-font-size-sm', '--admin-font-size-base',
  '--admin-font-size-lg', '--admin-font-size-xl', '--admin-font-size-2xl',
  '--admin-font-weight-normal', '--admin-font-weight-medium', '--admin-font-weight-semibold', '--admin-font-weight-bold',
  '--admin-line-height-tight', '--admin-line-height-normal', '--admin-line-height-relaxed',
  '--admin-letter-spacing-tight', '--admin-letter-spacing-normal', '--admin-letter-spacing-wide',
  // Radius
  '--admin-radius-sm', '--admin-radius-md', '--admin-radius-lg', '--admin-radius-xl', '--admin-radius-full',
];

function readTokensFromDOM(): Record<string, string> {
  const computed = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};
  for (const v of ALL_TOKEN_VARS) {
    tokens[v] = computed.getPropertyValue(v).trim();
  }
  return tokens;
}

export function StyleGuideClient() {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('colors');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Read initial values from DOM on mount
  useEffect(() => {
    setTokens(readTokensFromDOM());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        setOverrides(parsed);
      }
    } catch {}
  }, []);

  const handleChange = useCallback((variable: string, value: string) => {
    document.documentElement.style.setProperty(variable, value);
    setTokens((prev) => ({ ...prev, [variable]: value }));
    setOverrides((prev) => ({ ...prev, [variable]: value }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [overrides]);

  const handleReset = useCallback(() => {
    for (const v of Object.keys(overrides)) {
      document.documentElement.style.removeProperty(v);
    }
    localStorage.removeItem(STORAGE_KEY);
    setOverrides({});
    setTokens(readTokensFromDOM());
    setSaved(false);
  }, [overrides]);

  const handleExport = useCallback(() => {
    const lines = Object.entries(overrides)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    const css = `:root {\n${lines}\n}`;
    navigator.clipboard.writeText(css);
  }, [overrides]);

  // Track active section on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { root: el, rootMargin: '-20% 0px -70% 0px' }
    );
    for (const s of SECTIONS) {
      const target = el.querySelector(`#${s.id}`);
      if (target) observer.observe(target);
    }
    return () => observer.disconnect();
  }, [tokens]);

  const overrideCount = Object.keys(overrides).length;
  const searchLower = search.toLowerCase();

  const subtitle = overrideCount > 0
    ? `${ALL_TOKEN_VARS.length} tokens · ${overrideCount} override${overrideCount !== 1 ? 's' : ''}`
    : `${ALL_TOKEN_VARS.length} tokens`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with search + actions */}
      <AdminPageHeader
        title="Style Guide"
        subtitle={subtitle}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter tokens..."
        actions={
          <>
            <button
              onClick={handleReset}
              disabled={overrideCount === 0}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={handleExport}
              disabled={overrideCount === 0}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              <Download size={14} /> Export CSS
            </button>
            <button
              onClick={handleSave}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              <Save size={14} /> {saved ? 'Saved!' : 'Save'}
            </button>
          </>
        }
        mobileActions={
          <>
            <button onClick={handleReset} disabled={overrideCount === 0} className="btn-secondary p-2.5">
              <RotateCcw size={14} />
            </button>
            <button onClick={handleExport} disabled={overrideCount === 0} className="btn-secondary p-2.5">
              <Download size={14} />
            </button>
            <button onClick={handleSave} className="btn-primary p-2.5">
              <Save size={14} />
            </button>
          </>
        }
      />

      {/* Section nav — matches canonical toolbar: h-[3rem] bg-admin-bg-inset */}
      <div className="@container relative z-20 flex items-center gap-1 px-6 @md:px-8 h-[3rem] border-b border-admin-border flex-shrink-0 bg-admin-bg-inset overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              scrollRef.current?.querySelector(`#${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
              setActiveSection(s.id);
            }}
            className={`flex items-center px-[15px] py-[7px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap border ${
              activeSection === s.id
                ? 'bg-admin-bg-active text-admin-text-primary border-white/15'
                : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scrollable content — only this area scrolls */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto admin-scrollbar p-6 pb-12 space-y-12">
        {(!search || 'colors'.includes(searchLower) || ALL_TOKEN_VARS.some(v => v.includes(searchLower) && (
          v.startsWith('--admin-bg') || v.startsWith('--admin-border') || v.startsWith('--admin-text') ||
          v.startsWith('--admin-danger') || v.startsWith('--admin-success') || v.startsWith('--admin-warning') ||
          v.startsWith('--admin-info') || v.startsWith('--admin-accent') || v.startsWith('--admin-toolbar')
        ))) && (
          <ColorsSection tokens={tokens} onChange={handleChange} />
        )}
        {(!search || 'typography'.includes(searchLower) || ALL_TOKEN_VARS.some(v => v.includes(searchLower) && v.includes('font'))) && (
          <TypographySection tokens={tokens} onChange={handleChange} />
        )}
        {(!search || 'radius'.includes(searchLower) || ALL_TOKEN_VARS.some(v => v.includes(searchLower) && v.includes('radius'))) && (
          <RadiusSection tokens={tokens} onChange={handleChange} />
        )}
        {(!search || 'buttons'.includes(searchLower)) && (
          <ButtonsSection />
        )}
        {(!search || 'inputs'.includes(searchLower) || 'select'.includes(searchLower) || 'forms'.includes(searchLower)) && (
          <InputsSection />
        )}
        {(!search || 'status'.includes(searchLower)) && (
          <StatusSection />
        )}
        {(!search || 'surfaces'.includes(searchLower)) && (
          <SurfacesSection />
        )}
        {(!search || 'patterns'.includes(searchLower) || 'progressive'.includes(searchLower) || 'delete'.includes(searchLower) || 'inline'.includes(searchLower)) && (
          <PatternsSection />
        )}
      </div>
    </div>
  );
}
