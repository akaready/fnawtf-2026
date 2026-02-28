'use client';

import React, { useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  batchSetPublished, batchDeleteProjects,
  updateProject,
} from '../actions';
import { AdminDataTable, type ColDef, type BatchAction } from './table';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ProjectRow {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  client_name: string;
  client_quote: string | null;
  type: string;
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
  client_id: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Main table ─────────────────────────────────────────────────────────── */

export function ProjectsTable({
  projects,
  tagSuggestions,
  exportRef,
  search,
  onRowClick,
}: {
  projects: ProjectRow[];
  tagSuggestions?: Record<string, string[]>;
  exportRef?: React.MutableRefObject<(() => void) | null>;
  search?: string;
  onSearchChange?: (v: string) => void;
  onRowClick?: (project: ProjectRow) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleEdit = useCallback(
    async (rowId: string, field: string, newValue: unknown) => {
      await updateProject(rowId, { [field]: newValue });
      router.refresh();
    },
    [router],
  );

  const edit = (field: string) => (id: string, v: unknown) => handleEdit(id, field, v);

  const columns: ColDef<ProjectRow>[] = [
    { key: 'thumbnail', label: 'Thumb', type: 'thumbnail', defaultWidth: 44 },
    { key: 'title', label: 'Title', type: 'text', sortable: true, onEdit: edit('title') },
    { key: 'subtitle', label: 'Subtitle', type: 'text', sortable: true, defaultVisible: false, maxWidth: 250, onEdit: edit('subtitle') },
    { key: 'slug', label: 'Slug', type: 'text', sortable: true, defaultVisible: false, mono: true, onEdit: edit('slug') },
    { key: 'client_name', label: 'Client', type: 'text', sortable: true, onEdit: edit('client_name') },
    { key: 'description', label: 'Description', type: 'text', defaultVisible: false, maxWidth: 300, onEdit: edit('description') },
    { key: 'client_quote', label: 'Quote', type: 'text', defaultVisible: false, maxWidth: 250, onEdit: edit('client_quote') },
    { key: 'type', label: 'Type', type: 'select', sortable: true, options: [{ value: 'video', label: 'Video' }, { value: 'design', label: 'Design' }], onEdit: edit('type') },
    { key: 'category', label: 'Category', type: 'text', sortable: true, defaultVisible: false, onEdit: edit('category') },
    { key: 'style_tags', label: 'Style', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.style_tags, onEdit: edit('style_tags') },
    { key: 'premium_addons', label: 'Add-ons', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.premium_addons, onEdit: edit('premium_addons') },
    { key: 'camera_techniques', label: 'Techniques', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.camera_techniques, onEdit: edit('camera_techniques') },
    { key: 'assets_delivered', label: 'Assets', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.assets_delivered, onEdit: edit('assets_delivered') },
    { key: 'production_days', label: 'Days', type: 'number', sortable: true, defaultVisible: false, onEdit: edit('production_days') },
    { key: 'crew_count', label: 'Crew', type: 'number', sortable: true, defaultVisible: false, onEdit: edit('crew_count') },
    { key: 'talent_count', label: 'Talent', type: 'number', sortable: true, defaultVisible: false, onEdit: edit('talent_count') },
    { key: 'location_count', label: 'Locations', type: 'number', sortable: true, defaultVisible: false, onEdit: edit('location_count') },
    { key: 'thumbnail_url', label: 'Thumb URL', type: 'text', defaultVisible: false, mono: true, onEdit: edit('thumbnail_url') },
    { key: 'client_id', label: 'Client ID', type: 'text', defaultVisible: false, mono: true, onEdit: edit('client_id') },
    { key: 'updated_by', label: 'Updated By', type: 'text', defaultVisible: false, mono: true },
    { key: 'created_at', label: 'Created', type: 'date', sortable: true, defaultVisible: false },
    { key: 'updated_at', label: 'Updated', type: 'date', sortable: true },
    {
      key: 'published', label: 'Published', type: 'toggle', sortable: true, group: 'Status',
      toggleLabels: ['Published', 'Draft'],
      toggleColors: ['bg-green-500/10 text-green-400', 'bg-white/5 text-[#515155]'],
      onEdit: edit('published'),
    },
  ];

  const batchActions: BatchAction<ProjectRow>[] = [
    {
      label: 'Publish',
      icon: <Eye size={13} />,
      onClick: (ids) => {
        startTransition(async () => {
          await batchSetPublished(ids, true);
          router.refresh();
        });
      },
    },
    {
      label: 'Unpublish',
      icon: <EyeOff size={13} />,
      onClick: (ids) => {
        startTransition(async () => {
          await batchSetPublished(ids, false);
          router.refresh();
        });
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={13} />,
      variant: 'danger',
      requireConfirm: true,
      onClick: (ids) => {
        startTransition(async () => {
          await batchDeleteProjects(ids);
          router.refresh();
        });
      },
    },
  ];

  return (
    <AdminDataTable
      columns={columns}
      data={projects}
      storageKey="fna-table-projects"
      toolbar
      sortable
      filterable
      groupable
      columnVisibility
      columnReorder
      columnResize
      selectable
      freezePanes
      exportCsv
      search={search}
      exportRef={exportRef}
      batchActions={batchActions}
      onRowClick={onRowClick}
      emptyMessage="No projects yet."
    />
  );
}
