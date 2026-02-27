'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import { PanelDrawer } from './PanelDrawer';
import { MetadataTab } from './MetadataTab';
import { VideosTab } from './VideosTab';
import { CreditsTab } from './CreditsTab';
import { BTSTab } from './BTSTab';
import { ThumbnailGallery } from './ThumbnailGallery';
import {
  getProjectById,
  getProjectVideos,
  getProjectCredits,
  getProjectBTSImages,
  deleteProject,
} from '../actions';
import type { TagSuggestions, TestimonialOption } from './ProjectForm';

type ProjectRow = Record<string, unknown> & { id: string };

type Tab = 'project' | 'metadata' | 'videos' | 'thumbnail' | 'credits' | 'bts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'project', label: 'Project' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'videos', label: 'Videos' },
  { id: 'thumbnail', label: 'Thumbnail' },
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
}: ProjectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('project');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videos, setVideos] = useState<any[]>([]);
  const [credits, setCredits] = useState<Array<{ id?: string; role: string; name: string; sort_order: number }>>([]);
  const [btsImages, setBtsImages] = useState<Array<{ id?: string; image_url: string; caption: string | null; sort_order: number }>>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const isNew = !project;
  const projectId = project?.id;

  // Reset state when panel opens with a different project
  useEffect(() => {
    setActiveTab('project');
    setVideos([]);
    setCredits([]);
    setBtsImages([]);
    setConfirmDelete(false);

    if (projectId) {
      setLoadingRelated(true);
      Promise.all([
        getProjectVideos(projectId),
        getProjectCredits(projectId),
        getProjectBTSImages(projectId),
      ])
        .then(([v, c, b]) => {
          setVideos(v);
          setCredits(c);
          setBtsImages(b);
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

  return (
    <PanelDrawer open={open} onClose={onClose} width="w-[640px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-white/[0.08] flex-shrink-0">
        {project?.thumbnail_url ? (
          <div className="w-14 h-9 rounded overflow-hidden bg-white/5 flex-shrink-0">
            <img src={String(project.thumbnail_url)} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {isNew ? 'New Project' : String(project?.title || 'Untitled')}
          </h2>
          {!isNew && project?.slug ? (
            <p className="text-xs text-muted-foreground/50 truncate">{String(project.slug)}</p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] px-6 py-2 flex-shrink-0">
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
                  ? 'text-muted-foreground/25 cursor-not-allowed'
                  : activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-6 py-5">
        {activeTab === 'project' && (
          <MetadataTab
            project={project as Parameters<typeof MetadataTab>[0]['project']}
            tagSuggestions={tagSuggestions as TagSuggestions | undefined}
            testimonials={testimonials}
            onSaved={handleSaved}
            onCreated={handleCreated}
            visibleSections="project"
          />
        )}
        {activeTab === 'metadata' && projectId && (
          <MetadataTab
            project={project as Parameters<typeof MetadataTab>[0]['project']}
            tagSuggestions={tagSuggestions as TagSuggestions | undefined}
            testimonials={testimonials}
            onSaved={handleSaved}
            onCreated={handleCreated}
            visibleSections="metadata"
          />
        )}
        {activeTab === 'videos' && projectId && (
          loadingRelated ? (
            <LoadingSkeleton />
          ) : (
            <VideosTab projectId={projectId} initialVideos={videos} />
          )
        )}
        {activeTab === 'thumbnail' && projectId && (
          loadingRelated ? (
            <LoadingSkeleton />
          ) : (
            <ThumbnailGallery
              projectId={projectId}
              videos={videos}
              currentThumbnailUrl={String(project?.thumbnail_url ?? '')}
            />
          )
        )}
        {activeTab === 'credits' && projectId && (
          loadingRelated ? (
            <LoadingSkeleton />
          ) : (
            <CreditsTab projectId={projectId} initialCredits={credits} />
          )
        )}
        {activeTab === 'bts' && projectId && (
          loadingRelated ? (
            <LoadingSkeleton />
          ) : (
            <BTSTab projectId={projectId} initialImages={btsImages} />
          )
        )}
      </div>

      {/* Footer */}
      {!isNew && projectId && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] flex-shrink-0">
          <span className="text-xs text-muted-foreground/40">
            {project?.created_at
              ? new Date(String(project.created_at)).toLocaleDateString()
              : ''}
          </span>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-400 mr-1">Delete this project?</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border-subtle text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="h-10 bg-white/5 rounded" />
      <div className="h-4 bg-white/5 rounded w-1/4" />
      <div className="h-10 bg-white/5 rounded" />
    </div>
  );
}
