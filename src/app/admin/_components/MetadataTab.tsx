'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, RefreshCw, Link2, MessageSquare } from 'lucide-react';
import { SaveButton } from './SaveButton';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
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
  /** Hide the inline save button (use when parent provides a universal footer save) */
  hideInlineSave?: boolean;
}

export type MetadataTabHandle = {
  save: () => Promise<void>;
  isDirty: boolean;
};

const inputClass =
  'w-full px-3 py-2.5 bg-admin-bg-base border border-border rounded-lg text-sm text-admin-text-primary placeholder:text-admin-text-ghost focus:outline-none focus:border-admin-border-focus transition-colors disabled:opacity-40';

const textareaClass =
  'w-full px-3 py-2.5 bg-admin-bg-base border border-border rounded-lg text-sm text-admin-text-primary placeholder:text-admin-text-ghost focus:outline-none focus:border-admin-border-focus transition-colors resize-none disabled:opacity-40';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-admin-text-muted mb-1.5 uppercase tracking-wider">
      {children}
    </label>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
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
        <Link2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-success/70" />
      )}
      {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-admin-bg-raised border border-admin-border rounded-lg shadow-xl">
          {filtered.slice(0, 20).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors truncate ${
                opt.id === clientId ? 'text-admin-text-primary bg-admin-bg-selected' : 'text-admin-text-muted'
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
              className="w-full text-left px-3 py-2 text-sm text-admin-info hover:bg-white/[0.06] transition-colors border-t border-admin-border"
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
  { project, tagSuggestions, testimonials, clients: initialClients, onSaved, onCreated, hideInlineSave },
  ref
) {
  const router = useRouter();
  const { saving: isPending, saved: isSaved, wrap: wrapSave } = useSaveState(2500);
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

      setIsDirty(false);
      onSaved?.();
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

  const handleSave = () => wrapSave(async () => {
    try {
      await doSave();
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      throw err;
    }
  });

  useImperativeHandle(ref, () => ({ save: doSave, isDirty }));

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Client + Slug */}
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
              className="h-[42px] w-[42px] flex items-center justify-center text-admin-text-faint border border-border rounded-lg hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
              title="Regenerate from title"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </Field>
      </div>

      {/* Title + Subtitle */}
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

      {/* Testimonial */}
      <Field>
        <Label>Testimonial</Label>
        {testimonials && testimonials.length > 0 ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
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
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-ghost pointer-events-none" />
              </div>
              <a
                href="/admin/testimonials"
                className="h-[42px] flex items-center gap-1.5 px-3 text-xs text-admin-text-faint border border-border rounded-lg hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <MessageSquare size={13} />
                Testimonials
              </a>
            </div>
            {linkedTestimonialId && (
              <p className="text-xs text-admin-text-faint italic">
                &ldquo;{testimonials.find((t) => t.id === linkedTestimonialId)?.quote.slice(0, 120)}…&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-xs text-admin-text-ghost flex-1">No testimonials available.</p>
            <a
              href="/admin/testimonials"
              title="Manage testimonials"
              className="w-10 h-10 flex items-center justify-center text-admin-text-faint border border-border rounded-lg hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
            >
              <MessageSquare size={14} />
            </a>
          </div>
        )}
      </Field>

      {/* Description — fills remaining vertical space */}
      <div className="flex flex-col flex-1 min-h-0 space-y-1">
        <Label>Description</Label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Project description…"
          rows={2}
          className={`${textareaClass} flex-1 min-h-[42px] overflow-y-auto admin-scrollbar-auto`}
        />
      </div>

      {/* Type + Deliverables */}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label>Type</Label>
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
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-ghost pointer-events-none" />
          </div>
        </Field>
        <Field>
          <Label>Deliverables</Label>
          <ChipInput value={form.assets_delivered} onChange={(v) => set('assets_delivered', v)} placeholder="Add deliverable…" suggestions={tagSuggestions?.assets_delivered} />
        </Field>
      </div>

      {/* Style / Add-Ons / Techniques */}
      <div className="grid grid-cols-3 gap-4">
        <Field>
          <Label>Style</Label>
          <ChipInput value={form.style_tags} onChange={(v) => set('style_tags', v)} placeholder="Add style…" suggestions={tagSuggestions?.style_tags} />
        </Field>
        <Field>
          <Label>Add-Ons</Label>
          <ChipInput value={form.premium_addons} onChange={(v) => set('premium_addons', v)} placeholder="Add add-on…" suggestions={tagSuggestions?.premium_addons} />
        </Field>
        <Field>
          <Label>Techniques</Label>
          <ChipInput value={form.camera_techniques} onChange={(v) => set('camera_techniques', v)} placeholder="Add technique…" suggestions={tagSuggestions?.camera_techniques} />
        </Field>
      </div>

      {/* Scope */}
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

      {/* Save — only shown for new projects or when parent doesn't own the save */}
      {!hideInlineSave && (
        <div className="flex items-center gap-3 pt-2">
          <SaveButton
            saving={isPending}
            saved={isSaved}
            onClick={handleSave}
            label={project ? 'Save' : 'Create Project'}
            className="px-5 py-2.5 text-sm"
          />
          {errorMsg && <span className="text-sm text-admin-danger">{errorMsg}</span>}
        </div>
      )}
      {hideInlineSave && errorMsg && (
        <p className="text-sm text-admin-danger pt-2">{errorMsg}</p>
      )}
    </div>
  );
});
