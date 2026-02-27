'use client';

import { useState, useRef, useEffect, useTransition, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, RefreshCw, Link2 } from 'lucide-react';
import { ChipInput } from './ChipInput';
import { updateProject, createProject, updateTestimonial, createClientRecord } from '../actions';
import type { TagSuggestions, TestimonialOption } from './ProjectForm';

type ProjectRow = Record<string, unknown> & {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  client_name: string;
  client_quote: string | null;
  client_id: string | null;
  type: 'video' | 'design';
  category: string | null;
  thumbnail_url: string | null;
  preview_gif_url: string | null;
  style_tags: string[] | null;
  premium_addons: string[] | null;
  camera_techniques: string[] | null;
  assets_delivered: string[] | null;
  production_days: number | null;
  crew_count: number | null;
  talent_count: number | null;
  location_count: number | null;
  published: boolean;
};

export type ClientOption = { id: string; name: string };

interface Props {
  project: ProjectRow | null;
  tagSuggestions?: TagSuggestions;
  testimonials?: TestimonialOption[];
  clients?: ClientOption[];
  onSaved?: () => void;
  onCreated?: (newId: string) => void;
  /** Which sections to show: 'project' = core + visibility, 'metadata' = tags + scope + testimonial, undefined = all */
  visibleSections?: 'project' | 'metadata';
  /** Hide the inline save button (use when parent provides a universal footer save) */
  hideInlineSave?: boolean;
}

export type MetadataTabHandle = {
  save: () => Promise<void>;
  isDirty: boolean;
};

const inputClass =
  'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-40';

const textareaClass =
  'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/30 transition-colors resize-none disabled:opacity-40';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
      {children}
    </label>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked ? 'bg-white border-white' : 'border-border group-hover:border-white/40'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function ClientCombobox({
  value,
  clientId,
  options,
  onChange,
  onCreate,
}: {
  value: string;
  clientId: string | null;
  options: ClientOption[];
  onChange: (name: string, id: string | null) => void;
  onCreate: (name: string) => Promise<{ id: string; name: string }>;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const exactMatch = options.find((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (opt: ClientOption) => {
    setQuery(opt.name);
    onChange(opt.name, opt.id);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const created = await onCreate(query.trim());
      onChange(created.name, created.id);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 150);
  };

  const linked = clientId && options.find((o) => o.id === clientId);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          if (!e.target.value.trim()) onChange('', null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="Search or create client…"
        className={`${inputClass}${linked ? ' pr-9' : ''}`}
      />
      {linked && (
        <Link2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/70" />
      )}
      {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#111] border border-white/15 rounded-lg shadow-xl">
          {filtered.slice(0, 20).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors truncate ${
                opt.id === clientId ? 'text-foreground bg-white/[0.04]' : 'text-muted-foreground'
              }`}
            >
              {opt.name}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-white/[0.06] transition-colors border-t border-white/[0.06]"
            >
              {creating ? 'Creating…' : `Create "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const MetadataTab = forwardRef<MetadataTabHandle, Props>(function MetadataTab(
  { project, tagSuggestions, testimonials, clients: initialClients, onSaved, onCreated, visibleSections, hideInlineSave },
  ref
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Local clients list (can grow if user creates a new client inline)
  const [clients, setClients] = useState<ClientOption[]>(initialClients ?? []);

  // Find the testimonial currently linked to this project
  const initialTestimonialId = testimonials?.find((t) => t.project_id === project?.id)?.id ?? '';
  const [linkedTestimonialId, setLinkedTestimonialId] = useState(initialTestimonialId);

  const [form, setForm] = useState({
    title: project?.title ?? '',
    subtitle: project?.subtitle ?? '',
    slug: project?.slug ?? '',
    description: project?.description ?? '',
    client_name: project?.client_name ?? '',
    client_id: (project?.client_id as string | null) ?? null,
    type: (project?.type ?? 'video') as 'video' | 'design',
    category: project?.category ?? '',
    thumbnail_url: project?.thumbnail_url ?? '',
    preview_gif_url: project?.preview_gif_url ?? '',
    style_tags: project?.style_tags ?? [],
    premium_addons: project?.premium_addons ?? [],
    camera_techniques: project?.camera_techniques ?? [],
    assets_delivered: project?.assets_delivered ?? [],
    production_days: project?.production_days ?? '',
    crew_count: project?.crew_count ?? '',
    talent_count: project?.talent_count ?? '',
    location_count: project?.location_count ?? '',
    published: project?.published ?? false,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
    if (status !== 'idle') setStatus('idle');
  };

  async function doSave(): Promise<void> {
    const data = {
      ...form,
      production_days: form.production_days === '' ? null : Number(form.production_days),
      crew_count: form.crew_count === '' ? null : Number(form.crew_count),
      talent_count: form.talent_count === '' ? null : Number(form.talent_count),
      location_count: form.location_count === '' ? null : Number(form.location_count),
      category: form.category || null,
      preview_gif_url: form.preview_gif_url || null,
      thumbnail_url: form.thumbnail_url || null,
      style_tags: form.style_tags.length ? form.style_tags : null,
      premium_addons: form.premium_addons.length ? form.premium_addons : null,
      camera_techniques: form.camera_techniques.length ? form.camera_techniques : null,
      assets_delivered: form.assets_delivered.length ? form.assets_delivered : null,
    };

    if (project) {
      await updateProject(project.id, data);

      // Update testimonial link: unlink previous, link new
      if (initialTestimonialId && initialTestimonialId !== linkedTestimonialId) {
        await updateTestimonial(initialTestimonialId, { project_id: null });
      }
      if (linkedTestimonialId && linkedTestimonialId !== initialTestimonialId) {
        await updateTestimonial(linkedTestimonialId, { project_id: project.id });
      }

      setStatus('saved');
      setIsDirty(false);
      onSaved?.();
      setTimeout(() => setStatus('idle'), 2500);
    } else {
      const newId = await createProject(data);

      // Link testimonial to new project
      if (linkedTestimonialId) {
        await updateTestimonial(linkedTestimonialId, { project_id: newId });
      }

      if (onCreated) {
        onCreated(newId);
      } else {
        router.push(`/admin/projects/${newId}`);
      }
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        await doSave();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Save failed');
        setStatus('error');
      }
    });
  };

  useImperativeHandle(ref, () => ({ save: doSave, isDirty }));

  const showProject = !visibleSections || visibleSections === 'project';
  const showMetadata = !visibleSections || visibleSections === 'metadata';

  return (
    <div className="space-y-8">
      {showProject && (<section className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>Title</Label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!project) set('slug', slugify(e.target.value));
              }}
              placeholder="Campaign Title"
              className={inputClass}
            />
          </Field>
          <Field>
            <Label>Subtitle</Label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="Short tagline"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>Slug</Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="url-slug"
                className={`${inputClass} flex-1 min-w-0`}
              />
              <button
                type="button"
                onClick={() => set('slug', slugify(form.title))}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground/50 border border-border rounded-lg hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
                title="Regenerate from title"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </Field>
          <Field>
            <Label>Type</Label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as 'video' | 'design')}
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                <option value="video">Video</option>
                <option value="design">Design</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>Client</Label>
            <ClientCombobox
              value={form.client_name}
              clientId={form.client_id}
              options={clients}
              onChange={(name, id) => {
                setForm((f) => ({ ...f, client_name: name, client_id: id }));
                setIsDirty(true);
                if (status !== 'idle') setStatus('idle');
              }}
              onCreate={async (name) => {
                const id = await createClientRecord({ name, email: '' });
                const opt = { id, name };
                setClients((prev) => [...prev, opt].sort((a, b) => a.name.localeCompare(b.name)));
                return opt;
              }}
            />
          </Field>
          <Field>
            <Label>Category</Label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                <option value="">Select type…</option>
                {(tagSuggestions?.project_type ?? []).map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
            </div>
          </Field>
        </div>
        <Field>
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => {
              set('description', e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            ref={(el) => {
              if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
            }}
            placeholder="Project description…"
            rows={3}
            className={`${textareaClass} overflow-hidden`}
          />
        </Field>
      </section>)}

      {/* Tags & Deliverables */}
      {showMetadata && (<><section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Tags &amp; Deliverables
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>Style Tags</Label>
            <ChipInput value={form.style_tags} onChange={(v) => set('style_tags', v)} placeholder="Add style…" suggestions={tagSuggestions?.style_tags} />
          </Field>
          <Field>
            <Label>Premium Add-ons</Label>
            <ChipInput value={form.premium_addons} onChange={(v) => set('premium_addons', v)} placeholder="Add add-on…" suggestions={tagSuggestions?.premium_addons} />
          </Field>
          <Field>
            <Label>Camera Techniques</Label>
            <ChipInput value={form.camera_techniques} onChange={(v) => set('camera_techniques', v)} placeholder="Add technique…" suggestions={tagSuggestions?.camera_techniques} />
          </Field>
          <Field>
            <Label>Assets Delivered</Label>
            <ChipInput value={form.assets_delivered} onChange={(v) => set('assets_delivered', v)} placeholder="Add asset…" suggestions={tagSuggestions?.assets_delivered} />
          </Field>
        </div>
      </section>

      {/* Scope */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Production Scope
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {(
            [
              { key: 'production_days', label: 'Days' },
              { key: 'crew_count', label: 'Crew' },
              { key: 'talent_count', label: 'Talent' },
              { key: 'location_count', label: 'Locations' },
            ] as const
          ).map(({ key, label }) => (
            <Field key={key}>
              <Label>{label}</Label>
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={(e) => set(key, e.target.value as never)}
                placeholder="—"
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Testimonial
        </h3>
        <Field>
          {testimonials && testimonials.length > 0 ? (
            <div className="space-y-2">
              <div className="relative">
                <select
                  value={linkedTestimonialId}
                  onChange={(e) => { setLinkedTestimonialId(e.target.value); setIsDirty(true); }}
                  className={`${inputClass} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="">No testimonial linked</option>
                  {testimonials
                    .filter((t) => {
                      if (t.project_id === project?.id) return true;
                      if (t.project_id) return false;
                      if (project?.client_id && t.client_id) return t.client_id === project.client_id;
                      return true;
                    })
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.person_name ? `${t.person_name}: ` : ''}&ldquo;{t.quote.slice(0, 60)}{t.quote.length > 60 ? '…' : ''}&rdquo;
                      </option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
              </div>
              {linkedTestimonialId && (
                <p className="text-xs text-muted-foreground/50 italic">
                  &ldquo;{testimonials.find((t) => t.id === linkedTestimonialId)?.quote.slice(0, 120)}…&rdquo;
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/40">
                Manage testimonials in the <a href="/admin/testimonials" className="underline hover:text-foreground">Testimonials</a> section.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/40">
              No testimonials available. <a href="/admin/testimonials" className="underline hover:text-foreground">Create one</a> first.
            </p>
          )}
        </Field>
      </section></>)}

      {/* Published */}
      {showProject && (<section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Visibility
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <CheckField label="Published" checked={form.published} onChange={(v) => set('published', v)} />
        </div>
      </section>)}

      {/* Save — only shown for new projects or when parent doesn't own the save */}
      {!hideInlineSave && (
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg border border-white hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
          </button>
          {status === 'saved' && (
            <span className="text-sm text-green-400">Saved</span>
          )}
          {status === 'error' && (
            <span className="text-sm text-red-400">{errorMsg}</span>
          )}
        </div>
      )}
      {hideInlineSave && status === 'error' && (
        <p className="text-sm text-red-400 pt-2">{errorMsg}</p>
      )}
    </div>
  );
});
