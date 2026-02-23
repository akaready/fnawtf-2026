'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { ChipInput } from './ChipInput';
import { updateProject, createProject, updateTestimonial } from '../actions';
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
  featured: boolean;
  published: boolean;
  full_width: boolean;
  hidden_from_work: boolean;
  featured_services_build: boolean;
  featured_services_launch: boolean;
  featured_services_scale: boolean;
  featured_services_crowdfunding: boolean;
  featured_services_fundraising: boolean;
};

interface Props {
  project: ProjectRow | null;
  tagSuggestions?: TagSuggestions;
  testimonials?: TestimonialOption[];
}

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
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked ? 'bg-white border-white' : 'border-border group-hover:border-white/40'
        }`}
        onClick={() => onChange(!checked)}
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
    </label>
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

export function MetadataTab({ project, tagSuggestions, testimonials }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Find the testimonial currently linked to this project
  const initialTestimonialId = testimonials?.find((t) => t.project_id === project?.id)?.id ?? '';
  const [linkedTestimonialId, setLinkedTestimonialId] = useState(initialTestimonialId);

  const [form, setForm] = useState({
    title: project?.title ?? '',
    subtitle: project?.subtitle ?? '',
    slug: project?.slug ?? '',
    description: project?.description ?? '',
    client_name: project?.client_name ?? '',
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
    featured: project?.featured ?? false,
    published: project?.published ?? false,
    full_width: project?.full_width ?? false,
    hidden_from_work: project?.hidden_from_work ?? false,
    featured_services_build: project?.featured_services_build ?? false,
    featured_services_launch: project?.featured_services_launch ?? false,
    featured_services_scale: project?.featured_services_scale ?? false,
    featured_services_crowdfunding: project?.featured_services_crowdfunding ?? false,
    featured_services_fundraising: project?.featured_services_fundraising ?? false,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (status !== 'idle') setStatus('idle');
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
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
          setTimeout(() => setStatus('idle'), 2500);
        } else {
          const newId = await createProject(data);

          // Link testimonial to new project
          if (linkedTestimonialId) {
            await updateTestimonial(linkedTestimonialId, { project_id: newId });
          }

          router.push(`/admin/projects/${newId}`);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Save failed');
        setStatus('error');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Core */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Core
        </h3>
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
                className="px-3 py-2 text-xs text-muted-foreground border border-border rounded-lg hover:text-foreground hover:border-border/80 transition-colors whitespace-nowrap"
              >
                Generate
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
            <Label>Client Name</Label>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              placeholder="Acme Corp"
              className={inputClass}
            />
          </Field>
          <Field>
            <Label>Category</Label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="e.g. Brand Film"
              className={inputClass}
            />
          </Field>
        </div>
        <Field>
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Project description…"
            rows={4}
            className={textareaClass}
          />
        </Field>
        <Field>
          <Label>Testimonial</Label>
          {testimonials && testimonials.length > 0 ? (
            <div className="space-y-2">
              <div className="relative">
                <select
                  value={linkedTestimonialId}
                  onChange={(e) => setLinkedTestimonialId(e.target.value)}
                  className={`${inputClass} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="">No testimonial linked</option>
                  {testimonials
                    .filter((t) => {
                      // Show testimonials already linked to this project
                      if (t.project_id === project?.id) return true;
                      // Hide testimonials linked to other projects
                      if (t.project_id) return false;
                      // Filter by client match if the project has a client_id
                      if (project?.client_id && t.client_id) return t.client_id === project.client_id;
                      // Show unlinked testimonials
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
      </section>

      {/* Media */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Media
        </h3>
        <Field>
          <Label>Thumbnail URL</Label>
          <input
            type="url"
            value={form.thumbnail_url}
            onChange={(e) => set('thumbnail_url', e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1">Or use the Thumbnail tab to pick a frame from video</p>
        </Field>
        {form.thumbnail_url && (
          <div className="w-40 h-24 rounded-lg overflow-hidden border border-border/40">
            <img src={form.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
          </div>
        )}
      </section>

      {/* Tags */}
      <section className="space-y-4">
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

      {/* Flags */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Display Flags
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <CheckField label="Published" checked={form.published} onChange={(v) => set('published', v)} />
          <CheckField label="Show on Homepage" checked={form.featured} onChange={(v) => set('featured', v)} />
          <CheckField label="Full Width" checked={form.full_width} onChange={(v) => set('full_width', v)} />
          <CheckField label="Hide from Work Page" checked={form.hidden_from_work} onChange={(v) => set('hidden_from_work', v)} />
        </div>
      </section>

      {/* Services */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/30 pb-2">
          Featured on Services Pages
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <CheckField label="Build" checked={form.featured_services_build} onChange={(v) => set('featured_services_build', v)} />
          <CheckField label="Launch" checked={form.featured_services_launch} onChange={(v) => set('featured_services_launch', v)} />
          <CheckField label="Scale" checked={form.featured_services_scale} onChange={(v) => set('featured_services_scale', v)} />
          <CheckField label="Crowdfunding" checked={form.featured_services_crowdfunding} onChange={(v) => set('featured_services_crowdfunding', v)} />
          <CheckField label="Fundraising" checked={form.featured_services_fundraising} onChange={(v) => set('featured_services_fundraising', v)} />
        </div>
      </section>

      {/* Save */}
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
    </div>
  );
}
