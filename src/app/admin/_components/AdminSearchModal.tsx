'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
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

type TypeKey = 'companies' | 'contacts' | 'projects' | 'tags' | 'testimonials' | 'proposals' | 'snippets';

const TYPE_META: Record<TypeKey, { label: string; color: string }> = {
  companies:    { label: 'Company',     color: 'bg-blue-500' },
  contacts:     { label: 'Contact',     color: 'bg-emerald-500' },
  projects:     { label: 'Project',     color: 'bg-violet-500' },
  tags:         { label: 'Tag',         color: 'bg-yellow-500' },
  testimonials: { label: 'Testimonial', color: 'bg-pink-500' },
  proposals:    { label: 'Proposal',    color: 'bg-orange-500' },
  snippets:     { label: 'Snippet',     color: 'bg-teal-500' },
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
        id: r.id, type, primary: r.name, secondary: r.notes ?? undefined, href: '/admin/companies',
      }));
    }
    case 'contacts': {
      const { data } = await supabase
        .from('contacts')
        .select('id, name, email, company, role')
        .or(`name.ilike.${like},email.ilike.${like},company.ilike.${like},role.ilike.${like}`)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.name,
        secondary: [r.role, r.company].filter(Boolean).join(' · ') || r.email || undefined,
        href: '/admin/contacts',
      }));
    }
    case 'projects': {
      const { data } = await supabase
        .from('projects')
        .select('id, title, client_name')
        .or(`title.ilike.${like},client_name.ilike.${like}`)
        .limit(5);
      return ((data ?? []) as any[]).map((r) => ({
        id: r.id, type, primary: r.title, secondary: r.client_name ?? undefined, href: '/admin/projects',
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
        href: `/admin/proposals/${r.id}`,
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
  }
}

export function AdminSearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<TypeKey | 'all'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

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

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
      if (e.key === 'Enter' && results[highlighted]) { navigate(results[highlighted]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, highlighted]);

  // Scroll highlighted into view
  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  function navigate(result: SearchResult) {
    router.push(result.href);
    onClose();
  }

  if (!open) return null;

  const typedQuery = query.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl mx-4 bg-[#111] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">

        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
          <Search size={15} className="flex-shrink-0 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-white/30 outline-none"
          />
          <span className="text-[10px] text-white/20 tracking-wide flex-shrink-0">⌘+K</span>
          <button onClick={onClose} className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/[0.07] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {(['all', ...ALL_TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors ${
                activeType === t
                  ? 'bg-white/10 text-foreground'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {t === 'all' ? 'All' : TYPE_META[t].label + 's'}
            </button>
          ))}
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-[400px]" style={{ scrollbarWidth: 'none' }}>
          {loading && (
            <div className="px-4 py-8 text-center text-xs text-white/30">Searching…</div>
          )}

          {!loading && !typedQuery && (
            <div className="px-4 py-8 text-center text-xs text-white/30">Type to search across all content</div>
          )}

          {!loading && typedQuery && results.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-white/30">No results for &ldquo;{typedQuery}&rdquo;</div>
          )}

          {!loading && results.length > 0 && results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}`}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => navigate(result)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === highlighted ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              }`}
            >
              <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${TYPE_META[result.type].color}`} />
              <span className="flex-shrink-0 w-[76px] text-[10px] text-white/30 uppercase tracking-wide">
                {TYPE_META[result.type].label}
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-sm text-foreground truncate block">{result.primary}</span>
                {result.secondary && (
                  <span className="text-xs text-white/35 truncate block">{result.secondary}</span>
                )}
              </span>
              <ArrowRight size={12} className="flex-shrink-0 text-white/20" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
