'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { X, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { SaveDot } from './SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { useChatContext } from '@/app/admin/_components/chat/ChatContext';
import { PanelDrawer } from './PanelDrawer';
import { PanelFooter } from './PanelFooter';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { MetadataTab } from './MetadataTab';
import type { MetadataTabHandle } from './MetadataTab';
import { VideosTab } from './VideosTab';
import { CreditsTab } from './CreditsTab';
import type { CreditsTabHandle } from './CreditsTab';
import { BTSTab } from './BTSTab';
import type { BTSTabHandle } from './BTSTab';
import { AIVisionTab } from './AIVisionTab';
import {
  getProjectById,
  getProjectVideos,
  getProjectCredits,
  getProjectBTSImages,
  deleteProject,
  updateProject,
  getAllRoles,
  getContacts,
  getTagSuggestions,
  getTestimonials,
  getVideoSections,
} from '../actions';
import type { TagSuggestions, TestimonialOption } from './ProjectForm';

type ProjectRow = Record<string, unknown> & { id: string };

type Tab = 'project' | 'videos' | 'credits' | 'bts' | 'ai-vision';

const TABS: { id: Tab; label: string }[] = [
  { id: 'project', label: 'Project' },
  { id: 'videos', label: 'Videos' },
  { id: 'credits', label: 'Credits' },
  { id: 'bts', label: 'BTS' },
  { id: 'ai-vision', label: 'AI Vision' },
];

interface ProjectPanelProps {
  project: ProjectRow | null;
  open: boolean;
  onClose: () => void;
  onProjectUpdated: (updated: ProjectRow) => void;
  onProjectDeleted: (id: string) => void;
  onProjectCreated: (newProject: ProjectRow) => void;
  tagSuggestions?: Record<string, string[]>;
  testimonials?: TestimonialOption[];
  clients?: Array<{ id: string; name: string }>;
}

export function ProjectPanel({
  project,
  open,
  onClose,
  onProjectUpdated,
  onProjectDeleted,
  onProjectCreated,
  tagSuggestions,
  testimonials,
  clients,
}: ProjectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('project');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videos, setVideos] = useState<any[]>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string; sort_order: number }>>([]);
  const [credits, setCredits] = useState<Array<{ id?: string; role: string; name: string; sort_order: number; role_id: string | null; contact_id: string | null }>>([]);
  const [btsImages, setBtsImages] = useState<Array<{ id?: string; image_url: string; caption: string | null; sort_order: number }>>([]);
  const [allRoles, setAllRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [allPeople, setAllPeople] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [localTagSuggestions, setLocalTagSuggestions] = useState<Record<string, string[]> | undefined>(tagSuggestions);
  const [localTestimonials, setLocalTestimonials] = useState<TestimonialOption[] | undefined>(testimonials);
  const [confirmClose, setConfirmClose] = useState(false);
  const [published, setPublished] = useState(!!project?.published);
  const [statusOpen, setStatusOpen] = useState(false);
  const [, startDelete] = useTransition();
  const [, startStatusTransition] = useTransition();
  const autoSave = useAutoSave(async () => {
    const saves: Promise<void>[] = [];
    if (projectTabRef.current?.isDirty) saves.push(projectTabRef.current.save());
    if (!loadingRelated && creditsRef.current?.isDirty) saves.push(creditsRef.current.save());
    if (!loadingRelated && btsRef.current?.isDirty) saves.push(btsRef.current.save());
    await Promise.all(saves);
  });
  const handleDirty = useCallback(() => autoSave.trigger(), [autoSave]);
  const statusRef = useRef<HTMLDivElement>(null);

  // Refs for tabs that expose save/isDirty
  const projectTabRef = useRef<MetadataTabHandle>(null);
  const creditsRef = useRef<CreditsTabHandle>(null);
  const btsRef = useRef<BTSTabHandle>(null);

  const { setPanelContext } = useChatContext();

  const isNew = !project;
  const projectId = project?.id;

  // Reset state when panel opens with a different project
  useEffect(() => {
    setActiveTab('project');
    setVideos([]);
    setSections([]);
    setCredits([]);
    setBtsImages([]);
    setConfirmClose(false);
    setPublished(!!project?.published);
    setStatusOpen(false);
    autoSave.reset();

    if (projectId) {
      setLoadingRelated(true);
      Promise.all([
        getProjectVideos(projectId),
        getProjectCredits(projectId),
        getProjectBTSImages(projectId),
        getAllRoles(),
        getContacts(),
        !tagSuggestions ? getTagSuggestions() : Promise.resolve(null),
        !testimonials ? getTestimonials() : Promise.resolve(null),
        getVideoSections(projectId),
      ])
        .then(([v, c, b, roles, contacts, tags, tests, secs]) => {
          setVideos(v);
          setSections(secs);
          setCredits(c);
          setBtsImages(b);
          setAllRoles(roles);
          setAllPeople(contacts.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}`.trim() })));
          if (tags) setLocalTagSuggestions(tags);
          if (tests) setLocalTestimonials(tests.map((t: any) => ({ id: t.id, person_name: t.person_name, company: t.company, quote: t.quote ?? null, project_id: t.project_id ?? null, client_id: t.client_id ?? null })));
        })
        .finally(() => setLoadingRelated(false));
    }
  }, [projectId]);

  const handleDelete = useCallback(() => {
    if (!projectId) return;
    startDelete(async () => {
      await deleteProject(projectId);
      onProjectDeleted(projectId);
    });
  }, [projectId, onProjectDeleted]);

  // Called by MetadataTab after a successful save (existing project)
  const handleSaved = useCallback(async () => {
    if (!projectId) return;
    const updated = await getProjectById(projectId);
    onProjectUpdated(updated);
  }, [projectId, onProjectUpdated]);

  // Called by MetadataTab after creating a new project
  const handleCreated = useCallback(async (newId: string) => {
    const newProject = await getProjectById(newId);
    onProjectCreated(newProject);
  }, [onProjectCreated]);

  // Save button: flush pending auto-save then close
  const handleSaveAll = async () => {
    await autoSave.flush();
    onClose();
  };

  // Close guard — warn if unsaved changes exist
  // Check refs at call-time (not render-time) because ref changes don't trigger re-renders
  const handleClose = useCallback(() => {
    const dirty = autoSave.hasPending || [
      projectTabRef.current?.isDirty,
      creditsRef.current?.isDirty,
      btsRef.current?.isDirty,
    ].some(Boolean);

    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [onClose, autoSave.hasPending]);

  const handleStatusChange = useCallback((newPublished: boolean) => {
    if (!projectId) return;
    setPublished(newPublished);
    setStatusOpen(false);
    startStatusTransition(async () => {
      await updateProject(projectId, { published: newPublished });
      const updated = await getProjectById(projectId);
      onProjectUpdated(updated);
    });
  }, [projectId, onProjectUpdated]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  // Chat panel context
  useEffect(() => {
    if (!projectId) return;
    const lines: string[] = [];
    lines.push(`Title: ${String(project?.title || 'Untitled')}`);
    if (project?.slug) lines.push(`Slug: ${String(project.slug)}`);
    if (project?.client_name) lines.push(`Client: ${String(project.client_name)}`);
    lines.push(`Status: ${published ? 'Published' : 'Draft'}`);
    if (project?.description) lines.push(`Description: ${String(project.description)}`);
    if (project?.category) lines.push(`Category: ${String(project.category)}`);
    if (project?.thumbnail_url) lines.push(`Thumbnail URL: ${String(project.thumbnail_url)}`);
    if (project?.vimeo_id) lines.push(`Vimeo ID: ${String(project.vimeo_id)}`);
    if (project?.days != null) lines.push(`Days: ${String(project.days)}`);
    if (project?.crew != null) lines.push(`Crew: ${String(project.crew)}`);
    if (project?.talent != null) lines.push(`Talent: ${String(project.talent)}`);
    if (credits.length > 0) {
      lines.push(`Credits:`);
      credits.forEach((c) => lines.push(`  - ${c.name} (${c.role})`));
    }
    if ((project as Record<string, unknown>)?.tags && Array.isArray((project as Record<string, unknown>).tags)) {
      const tags = (project as Record<string, unknown>).tags as string[];
      if (tags.length > 0) lines.push(`Tags: ${tags.join(', ')}`);
    }
    setPanelContext({
      recordType: 'project',
      recordId: projectId,
      recordLabel: String(project?.title || 'Untitled'),
      summary: lines.join('\n'),
    });
    return () => setPanelContext(null);
  }, [project, projectId, published, credits, setPanelContext]);

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[640px]">
      <DiscardChangesDialog
        open={confirmClose}
        onKeepEditing={() => setConfirmClose(false)}
        onDiscard={() => { setConfirmClose(false); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-admin-border flex-shrink-0 bg-admin-bg-sidebar">
        {project?.thumbnail_url ? (
          <div className="w-14 h-9 rounded overflow-hidden bg-admin-bg-hover flex-shrink-0">
            <img src={String(project.thumbnail_url)} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-admin-text-primary truncate">
            {isNew ? 'New Project' : String(project?.title || 'Untitled')}
          </h2>
          {!isNew && project?.client_name ? (
            <p className="text-sm text-admin-text-muted truncate">{String(project.client_name)}</p>
          ) : null}
        </div>
        <div className="flex items-center flex-shrink-0">
          <SaveDot status={autoSave.status} />
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-admin-border px-6 py-2 flex-shrink-0 bg-admin-bg-wash">
        {TABS.map((tab) => {
          const disabled = isNew && tab.id !== 'project';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={`px-3 py-1.5 text-admin-base font-medium rounded-lg transition-colors ${
                disabled
                  ? 'text-admin-text-muted/25 cursor-not-allowed'
                  : activeTab === tab.id
                  ? 'bg-admin-bg-active text-admin-text-primary'
                  : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className={`flex-1 min-h-0 px-6 py-5 ${activeTab === 'project' ? 'flex flex-col' : 'overflow-y-auto admin-scrollbar'}`}>
        {/* Project tab: always mounted (hidden when inactive) to preserve state */}
        <div key={projectId} className={activeTab === 'project' ? 'flex-1 min-h-0 flex flex-col' : 'hidden'}>
          <MetadataTab
            ref={projectTabRef}
            project={project as Parameters<typeof MetadataTab>[0]['project']}
            tagSuggestions={localTagSuggestions as TagSuggestions | undefined}
            testimonials={localTestimonials}
            clients={clients}
            onSaved={handleSaved}
            onCreated={handleCreated}
            hideInlineSave={!isNew}
            onDirty={handleDirty}
          />
        </div>

        {/* Videos tab */}
        {activeTab === 'videos' && projectId && (
          loadingRelated ? <LoadingSkeleton /> : <VideosTab projectId={projectId} initialVideos={videos} initialSections={sections} currentThumbnailUrl={String(project?.thumbnail_url ?? '')} currentThumbnailTime={project?.thumbnail_time != null ? Number(project.thumbnail_time) : null} />
        )}

        {/* Credits tab: always mounted after load to preserve edits */}
        {activeTab === 'credits' && loadingRelated && <LoadingSkeleton />}
        {!loadingRelated && projectId && (
          <div key={`${projectId}-credits`} className={activeTab === 'credits' ? '' : 'hidden'}>
            <CreditsTab ref={creditsRef} projectId={projectId} initialCredits={credits} roles={allRoles} people={allPeople} onDirty={handleDirty} />
          </div>
        )}

        {/* BTS tab: always mounted after load to preserve edits */}
        {activeTab === 'bts' && loadingRelated && <LoadingSkeleton />}
        {!loadingRelated && projectId && (
          <div key={`${projectId}-bts`} className={activeTab === 'bts' ? '' : 'hidden'}>
            <BTSTab ref={btsRef} projectId={projectId} initialImages={btsImages} onDirty={handleDirty} />
          </div>
        )}

        {/* AI Vision tab */}
        {activeTab === 'ai-vision' && projectId && (
          loadingRelated ? <LoadingSkeleton /> : (
            <AIVisionTab
              projectId={projectId}
              flagshipVideoId={videos.find((v: Record<string, unknown>) => v.video_type === 'flagship')?.id as string ?? null}
              aiDescription={(project?.ai_description as string) ?? null}
              aiDescriptionJson={(project?.ai_description_json as import('./AIVisionTab').AIVisionJson) ?? null}
            />
          )
        )}
      </div>

      {/* Footer: save + status + delete */}
      {!isNew && projectId && (
        <PanelFooter
          onSave={() => void handleSaveAll()}
          onDelete={handleDelete}
          secondaryActions={
            <div ref={statusRef} className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusOpen((o) => !o)}
                className={`${published ? 'btn-success' : 'btn-secondary'} gap-1.5 px-4 py-2.5 text-sm font-medium`}
              >
                {published ? 'Published' : 'Draft'}
                <ChevronDown size={12} className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                  <div className="absolute bottom-full mb-1 left-0 min-w-[160px] bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 z-50">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(true)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        published ? 'text-admin-success bg-admin-success-bg/30' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-admin-success" />
                        Published
                      </span>
                      {published && <Check size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(false)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        !published ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-admin-text-faint" />
                        Draft
                      </span>
                      {!published && <Check size={12} />}
                    </button>
                  </div>
                </>
              )}
              {typeof project?.slug === 'string' && (
                <a
                  href={`/work/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
                >
                  View
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          }
        />
      )}
    </PanelDrawer>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-admin-bg-hover rounded w-1/3" />
      <div className="h-10 bg-admin-bg-hover rounded" />
      <div className="h-4 bg-admin-bg-hover rounded w-1/4" />
      <div className="h-10 bg-admin-bg-hover rounded" />
    </div>
  );
}
