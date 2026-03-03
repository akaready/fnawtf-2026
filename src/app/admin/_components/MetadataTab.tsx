'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { AdminCombobox } from './AdminCombobox';
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

const inputClass = 'admin-input w-full';

const textareaClass = 'admin-input w-full resize-none';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-admin-sm text-admin-text-muted mb-1.5 uppercase tracking-wider">
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
          <AdminCombobox
            value={form.client_id}
            options={clients.map((c) => ({ id: c.id, label: c.name }))}
            onChange={(id) => {
              const c = id ? clients.find((cl) => cl.id === id) : null;
              setForm((f) => ({ ...f, client_name: c?.name ?? '', client_id: id }));
              setIsDirty(true);
            }}
            placeholder="Search clients…"
            createLabel="Add Client"
            onCreate={async (name) => {
              const id = await createClientRecord({ name, email: '' });
              setClients((prev) => [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name)));
              setForm((f) => ({ ...f, client_name: name, client_id: id }));
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
              className="h-[42px] w-[42px] flex items-center justify-center text-admin-text-faint border border-admin-border-subtle rounded-lg hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
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
              <div className="flex-1 min-w-0">
                <AdminCombobox
                  value={linkedTestimonialId || null}
                  options={testimonials
                    .filter((t) => {
                      if (t.project_id === project?.id) return true;
                      if (t.project_id) return false;
                      if (project?.client_id && t.client_id) return t.client_id === project.client_id;
                      return true;
                    })
                    .map((t) => ({
                      id: t.id,
                      label: `${t.person_name ? `${t.person_name}: ` : ''}"${t.quote.slice(0, 60)}${t.quote.length > 60 ? '…' : ''}"`,
                    }))}
                  onChange={(id) => { setLinkedTestimonialId(id ?? ''); setIsDirty(true); }}
                  placeholder="Search testimonials…"
                />
              </div>
              <a
                href="/admin/testimonials"
                className="h-[42px] flex items-center gap-1.5 px-3 text-xs text-admin-text-faint border border-admin-border-subtle rounded-lg hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <MessageSquare size={13} />
                Testimonials
              </a>
            </div>
            {linkedTestimonialId && (
              <p className="text-xs text-admin-text-faint">
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
              className="w-10 h-10 flex items-center justify-center text-admin-text-faint border border-admin-border-subtle rounded-lg hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
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
          <AdminCombobox
            value={form.category || null}
            options={(tagSuggestions?.project_type ?? []).map((pt) => ({ id: pt, label: pt }))}
            onChange={(v) => set('category', v ?? '')}
            placeholder="Select type…"
          />
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
