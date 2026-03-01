'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { X, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { SaveButton } from './SaveButton';
import { useSaveState } from '@/app/admin/_hooks/useSaveState';
import { PanelDrawer } from './PanelDrawer';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { MetadataTab } from './MetadataTab';
import type { MetadataTabHandle } from './MetadataTab';
import { VideosTab } from './VideosTab';
import { CreditsTab } from './CreditsTab';
import type { CreditsTabHandle } from './CreditsTab';
import { BTSTab } from './BTSTab';
import type { BTSTabHandle } from './BTSTab';
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
} from '../actions';
import type { TagSuggestions, TestimonialOption } from './ProjectForm';

type ProjectRow = Record<string, unknown> & { id: string };

type Tab = 'project' | 'videos' | 'credits' | 'bts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'project', label: 'Project' },
  { id: 'videos', label: 'Videos' },
  { id: 'credits', label: 'Credits' },
  { id: 'bts', label: 'BTS' },
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
  const [credits, setCredits] = useState<Array<{ id?: string; role: string; name: string; sort_order: number; role_id: string | null; contact_id: string | null }>>([]);
  const [btsImages, setBtsImages] = useState<Array<{ id?: string; image_url: string; caption: string | null; sort_order: number }>>([]);
  const [allRoles, setAllRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [allPeople, setAllPeople] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [localTagSuggestions, setLocalTagSuggestions] = useState<Record<string, string[]> | undefined>(tagSuggestions);
  const [localTestimonials, setLocalTestimonials] = useState<TestimonialOption[] | undefined>(testimonials);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [published, setPublished] = useState(!!project?.published);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [, startStatusTransition] = useTransition();
  const { saving: isSaving, saved: isSaved, wrap: wrapSave } = useSaveState(2500);
  const statusRef = useRef<HTMLDivElement>(null);

  // Refs for tabs that expose save/isDirty
  const projectTabRef = useRef<MetadataTabHandle>(null);
  const creditsRef = useRef<CreditsTabHandle>(null);
  const btsRef = useRef<BTSTabHandle>(null);

  const isNew = !project;
  const projectId = project?.id;

  // Reset state when panel opens with a different project
  useEffect(() => {
    setActiveTab('project');
    setVideos([]);
    setCredits([]);
    setBtsImages([]);
    setConfirmDelete(false);
    setConfirmClose(false);
    setPublished(!!project?.published);
    setStatusOpen(false);

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
      ])
        .then(([v, c, b, roles, contacts, tags, tests]) => {
          setVideos(v);
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

  // Universal save — commits all dirty tabs
  const handleSaveAll = () => wrapSave(async () => {
    const saves: Promise<void>[] = [];
    if (projectTabRef.current?.isDirty) saves.push(projectTabRef.current.save());
    if (!loadingRelated && creditsRef.current?.isDirty) saves.push(creditsRef.current.save());
    if (!loadingRelated && btsRef.current?.isDirty) saves.push(btsRef.current.save());
    await Promise.all(saves);
  });

  // Close guard — warn if unsaved changes exist
  // Check refs at call-time (not render-time) because ref changes don't trigger re-renders
  const handleClose = useCallback(() => {
    const dirty = [
      projectTabRef.current?.isDirty,
      creditsRef.current?.isDirty,
      btsRef.current?.isDirty,
    ].some(Boolean);

    if (dirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }, [onClose]);

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

  return (
    <PanelDrawer open={open} onClose={handleClose} width="w-[640px]">
      <DiscardChangesDialog
        open={confirmClose}
        onKeepEditing={() => setConfirmClose(false)}
        onDiscard={() => { setConfirmClose(false); onClose(); }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-admin-border flex-shrink-0">
        {project?.thumbnail_url ? (
          <div className="w-14 h-9 rounded overflow-hidden bg-admin-bg-hover flex-shrink-0">
            <img src={String(project.thumbnail_url)} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-admin-text-primary truncate">
            {isNew ? 'New Project' : String(project?.title || 'Untitled')}
          </h2>
          {!isNew && project?.slug ? (
            <p className="text-xs text-admin-text-faint truncate">{String(project.slug)}</p>
          ) : null}
        </div>
        {!isNew && (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
            published
              ? 'bg-admin-success-bg text-admin-success'
              : 'bg-admin-bg-hover text-admin-text-faint'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-admin-success' : 'bg-admin-text-ghost'}`} />
            {published ? 'Published' : 'Draft'}
          </span>
        )}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
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
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
          />
        </div>

        {/* Videos tab */}
        {activeTab === 'videos' && projectId && (
          loadingRelated ? <LoadingSkeleton /> : <VideosTab projectId={projectId} initialVideos={videos} currentThumbnailUrl={String(project?.thumbnail_url ?? '')} />
        )}

        {/* Credits tab: always mounted after load to preserve edits */}
        {activeTab === 'credits' && loadingRelated && <LoadingSkeleton />}
        {!loadingRelated && projectId && (
          <div key={`${projectId}-credits`} className={activeTab === 'credits' ? '' : 'hidden'}>
            <CreditsTab ref={creditsRef} projectId={projectId} initialCredits={credits} roles={allRoles} people={allPeople} />
          </div>
        )}

        {/* BTS tab: always mounted after load to preserve edits */}
        {activeTab === 'bts' && loadingRelated && <LoadingSkeleton />}
        {!loadingRelated && projectId && (
          <div key={`${projectId}-bts`} className={activeTab === 'bts' ? '' : 'hidden'}>
            <BTSTab ref={btsRef} projectId={projectId} initialImages={btsImages} />
          </div>
        )}
      </div>

      {/* Footer: save + status (left) | delete (right) */}
      {!isNew && projectId && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border flex-shrink-0 bg-admin-bg-wash">
          <div className="flex items-center gap-3">
            <SaveButton saving={isSaving} saved={isSaved} onClick={handleSaveAll} className="px-5 py-2.5 text-sm" />
            {/* Status dropdown */}
            <div ref={statusRef} className="relative">
              <button
                type="button"
                onClick={() => setStatusOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  published
                    ? 'text-admin-success bg-admin-success-bg hover:bg-admin-success-bg/80'
                    : 'text-admin-text-muted bg-admin-bg-hover hover:bg-admin-bg-active'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-admin-success' : 'bg-admin-text-ghost'}`} />
                {published ? 'Published' : 'Draft'}
                <ChevronDown size={12} />
              </button>
              {statusOpen && (
                <div className="absolute bottom-full mb-1 left-0 w-36 bg-admin-bg-raised border border-admin-border rounded-lg shadow-xl overflow-hidden z-50">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(true)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      published ? 'bg-admin-bg-selected text-admin-text-primary' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-admin-success" />
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(false)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      !published ? 'bg-admin-bg-selected text-admin-text-primary' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-admin-text-ghost" />
                    Draft
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-admin-danger mr-1">Delete this project?</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-admin-border text-admin-text-muted hover:text-admin-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs rounded-lg bg-admin-danger-bg-strong text-admin-danger border border-admin-danger-border hover:bg-admin-danger-bg-strong transition-colors disabled:opacity-40"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-danger/50 hover:text-admin-danger hover:bg-admin-danger-bg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
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
