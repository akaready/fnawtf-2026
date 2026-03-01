'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Building2, Users, Rocket, Tag, MessageSquare, FileText, BookOpen, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: TypeKey;
  primary: string;
  secondary?: string;
  href: string;
}

type TypeKey = 'companies' | 'people' | 'projects' | 'tags' | 'testimonials' | 'proposals' | 'snippets';

const TYPE_META: Record<TypeKey, { label: string; plural: string; color: string }> = {
  companies:    { label: 'Company',     plural: 'Companies',    color: 'bg-blue-500' },
  people:       { label: 'Person',      plural: 'People',       color: 'bg-emerald-500' },
  projects:     { label: 'Project',     plural: 'Projects',     color: 'bg-violet-500' },
  tags:         { label: 'Tag',         plural: 'Tags',         color: 'bg-yellow-500' },
  testimonials: { label: 'Testimonial', plural: 'Testimonials', color: 'bg-pink-500' },
  proposals:    { label: 'Proposal',    plural: 'Proposals',    color: 'bg-orange-500' },
  snippets:     { label: 'Snippet',     plural: 'Snippets',     color: 'bg-teal-500' },
};

const TYPE_ICON: Record<TypeKey, LucideIcon> = {
  companies:    Building2,
  people:       Users,
  projects:     Rocket,
  tags:         Tag,
  testimonials: MessageSquare,
  proposals:    FileText,
  snippets:     BookOpen,
};

const ALL_TYPES = Object.keys(TYPE_META) as TypeKey[];

async function queryType(supabase: ReturnType<typeof createClient>, type: TypeKey, q: string): Promise<SearchResult[]> {
  const like = `%${q}%`;

  switch (type) {
    case 'companies': {
      const { data } = await supabase
        .from('clients')
        .select('id, name, notes')
        .or(`name.ilike.${like},notes.ilike.${like}`)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.name, secondary: r.notes ?? undefined, href: `/admin/clients?open=${r.id}`,
      }));
    }
    case 'people': {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company, role, type')
        .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},company.ilike.${like},role.ilike.${like}`)
        .limit(8);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type: 'people' as TypeKey,
        primary: [r.first_name, r.last_name].filter(Boolean).join(' '),
        secondary: [r.type, r.role, r.company].filter(Boolean).join(' · ') || r.email || undefined,
        href: `/admin/contacts?open=${r.id}`,
      }));
    }
    case 'projects': {
      const { data } = await supabase
        .from('projects')
        .select('id, title, client_name')
        .or(`title.ilike.${like},client_name.ilike.${like}`)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.title, secondary: r.client_name ?? undefined, href: `/admin/projects?open=${r.id}`,
      }));
    }
    case 'tags': {
      const { data } = await supabase
        .from('tags')
        .select('id, name, category')
        .ilike('name', like)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.name, secondary: r.category ?? undefined, href: '/admin/tags',
      }));
    }
    case 'testimonials': {
      const { data } = await supabase
        .from('testimonials')
        .select('id, person_name, company, quote')
        .or(`person_name.ilike.${like},company.ilike.${like},quote.ilike.${like}`)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.person_name,
        secondary: r.company ?? (r.quote ? `"${r.quote.slice(0, 60)}…"` : undefined),
        href: '/admin/testimonials',
      }));
    }
    case 'proposals': {
      const { data } = await supabase
        .from('proposals')
        .select('id, title, contact_name, contact_company')
        .or(`title.ilike.${like},contact_name.ilike.${like},contact_company.ilike.${like}`)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.title,
        secondary: [r.contact_name, r.contact_company].filter(Boolean).join(' · ') || undefined,
        href: `/admin/proposals?open=${r.id}`,
      }));
    }
    case 'snippets': {
      const { data } = await supabase
        .from('content_snippets')
        .select('id, title, category')
        .ilike('title', like)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.title, secondary: r.category ?? undefined, href: '/admin/snippets',
      }));
    }
    default:
      return [];
  }
}

/** Fetch the 10 most recently updated records, optionally filtered to a single type */
async function fetchRecent(supabase: ReturnType<typeof createClient>, filter: TypeKey | 'all' = 'all'): Promise<SearchResult[]> {
  const items: (SearchResult & { ts: string })[] = [];
  const limit = filter === 'all' ? 3 : 10;

  const shouldFetch = (t: TypeKey) => filter === 'all' || filter === t;

  const promises: PromiseLike<void>[] = [];

  if (shouldFetch('companies')) {
    promises.push(
      supabase.from('clients').select('id, name, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'companies', primary: r.name, href: `/admin/clients?open=${r.id}`, ts: r.updated_at }); })
    );
  }
  if (shouldFetch('people')) {
    promises.push(
      supabase.from('contacts').select('id, first_name, last_name, type, company, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'people', primary: [r.first_name, r.last_name].filter(Boolean).join(' '), secondary: [r.type, r.company].filter(Boolean).join(' · ') || undefined, href: `/admin/contacts?open=${r.id}`, ts: r.updated_at }); })
    );
  }
  if (shouldFetch('projects')) {
    promises.push(
      supabase.from('projects').select('id, title, client_name, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'projects', primary: r.title, secondary: r.client_name ?? undefined, href: `/admin/projects?open=${r.id}`, ts: r.updated_at }); })
    );
  }
  if (shouldFetch('proposals')) {
    promises.push(
      supabase.from('proposals').select('id, title, contact_name, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'proposals', primary: r.title, secondary: r.contact_name ?? undefined, href: `/admin/proposals?open=${r.id}`, ts: r.updated_at }); })
    );
  }
  if (shouldFetch('tags')) {
    promises.push(
      supabase.from('tags').select('id, name, category, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'tags', primary: r.name, secondary: r.category ?? undefined, href: '/admin/tags', ts: r.updated_at }); })
    );
  }
  if (shouldFetch('testimonials')) {
    promises.push(
      supabase.from('testimonials').select('id, person_name, company, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'testimonials', primary: r.person_name, secondary: r.company ?? undefined, href: '/admin/testimonials', ts: r.updated_at }); })
    );
  }
  if (shouldFetch('snippets')) {
    promises.push(
      supabase.from('content_snippets').select('id, title, category, updated_at').order('updated_at', { ascending: false }).limit(limit)
        .then(({ data }) => { for (const r of (data ?? []) as any[]) items.push({ id: r.id, type: 'snippets', primary: r.title, secondary: r.category ?? undefined, href: '/admin/snippets', ts: r.updated_at }); })
    );
  }

  await Promise.all(promises);
  items.sort((a, b) => (b.ts > a.ts ? 1 : -1));
  return items.slice(0, 10);
}

export function AdminSearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<TypeKey | 'all'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  // Mount/unmount with exit animation
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  // Stagger animation plays at most once per hour
  const [shouldStagger, setShouldStagger] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      // Check if we should play the stagger animation (once per hour)
      const STAGGER_KEY = 'admin-search-last-stagger';
      const ONE_HOUR = 60 * 60 * 1000;
      const last = Number(localStorage.getItem(STAGGER_KEY) || '0');
      if (Date.now() - last > ONE_HOUR) {
        setShouldStagger(true);
        localStorage.setItem(STAGGER_KEY, String(Date.now()));
      } else {
        setShouldStagger(false);
      }
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      setClosing(false);
      onClose();
    }, 150); // matches exit animation duration
  }, [onClose]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open + load recents
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setHighlighted(0);
      setActiveType('all');
      setTimeout(() => inputRef.current?.focus(), 30);
      const supabase = createClient();
      fetchRecent(supabase, 'all').then(setRecents).catch(() => {});
    }
  }, [open]);

  // Re-fetch recents when type filter changes
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    fetchRecent(supabase, activeType).then((r) => {
      setRecents(r);
      setHighlighted(0);
    }).catch(() => {});
  }, [activeType, open]);

  const runSearch = useCallback(async (q: string, type: TypeKey | 'all') => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const types = type === 'all' ? ALL_TYPES : [type];
    const settled = await Promise.all(types.map((t) => queryType(supabase, t, q).catch(() => [] as SearchResult[])));
    setResults(settled.flat());
    setHighlighted(0);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, activeType), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeType, runSearch]);

  const displayedResults = query.trim() ? results : recents;

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, displayedResults.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
      if (e.key === 'Enter' && displayedResults[highlighted]) { navigate(displayedResults[highlighted]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, displayedResults, highlighted, handleClose]);

  // Scroll highlighted into view
  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  function navigate(result: SearchResult) {
    router.push(result.href);
    handleClose();
  }

  if (!mounted) return null;

  const typedQuery = query.trim();
  const showRecents = !typedQuery && recents.length > 0;

  function renderResultRow(result: SearchResult, i: number, stagger: boolean) {
    return (
      <button
        key={`${result.type}-${result.id}`}
        onMouseEnter={() => setHighlighted(i)}
        onClick={() => navigate(result)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          i === highlighted ? 'bg-admin-bg-hover' : 'hover:bg-admin-bg-subtle'
        } ${stagger ? 'animate-search-results-in' : ''}`}
        style={stagger ? { animationDelay: `${60 + i * 30}ms` } : undefined}
      >
        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${TYPE_META[result.type].color}`} />
        <span className="flex-shrink-0 w-[76px] text-[10px] text-admin-text-faint uppercase tracking-wide">
          {TYPE_META[result.type].label}
        </span>
        <span className="flex-1 min-w-0">
          <span className="text-sm text-admin-text-primary truncate block">{result.primary}</span>
          {result.secondary && (
            <span className="text-xs text-admin-text-primary/35 truncate block">{result.secondary}</span>
          )}
        </span>
        <ArrowRight size={12} className="flex-shrink-0 text-admin-text-ghost" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop — click to close */}
      <div
        className={`absolute inset-0 bg-admin-bg-base backdrop-blur-[1px] ${closing ? 'animate-search-fade-out' : 'animate-search-fade-in'}`}
        onClick={handleClose}
      />

      {/* Modal — w-fit so it's exactly the width of the pills row */}
      <div className={`relative w-fit mx-4 bg-admin-bg-raised border border-admin-border rounded-xl shadow-2xl overflow-hidden ${closing ? 'animate-search-slide-up' : 'animate-search-slide-down'}`}>

        {/* Raycast-style search row — the input IS the row */}
        <div className="relative border-b border-admin-border bg-admin-bg-base">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-faint pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent px-12 py-3.5 text-[15px] text-admin-text-primary placeholder:text-admin-text-faint outline-none"
          />
          <button onClick={handleClose} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-admin-text-ghost hover:text-admin-text-secondary transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Type filter pills — this row determines the modal width */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-admin-border bg-admin-bg-wash">
          {(['all', ...ALL_TYPES] as const).map((t) => {
            const Icon = t !== 'all' ? TYPE_ICON[t] : null;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                  activeType === t
                    ? 'bg-admin-bg-active text-admin-text-primary'
                    : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
                }`}
              >
                {Icon && <Icon size={12} />}
                {t === 'all' ? 'All' : TYPE_META[t].plural}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-[400px]" style={{ scrollbarWidth: 'none' }}>
          {loading && (
            <div className="px-4 py-8 text-center text-xs text-admin-text-faint">Searching…</div>
          )}

          {!loading && showRecents && (
            <>
              <div className={`px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-wider text-admin-text-ghost ${shouldStagger ? 'animate-search-results-in' : ''}`}
                style={shouldStagger ? { animationDelay: '40ms' } : undefined}>Recent</div>
              {recents.map((result, i) => renderResultRow(result, i, shouldStagger))}
            </>
          )}

          {!loading && !typedQuery && recents.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-admin-text-faint">Type to search across all content</div>
          )}

          {!loading && typedQuery && results.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-admin-text-faint">No results for &ldquo;{typedQuery}&rdquo;</div>
          )}

          {!loading && typedQuery && results.length > 0 && results.map((result, i) => renderResultRow(result, i, false))}
        </div>

      </div>
    </div>
  );
}
