'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  batchSetPublished, batchDeleteProjects,
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

  const columns: ColDef<ProjectRow>[] = [
    { key: 'thumbnail', label: 'Thumb', type: 'thumbnail', defaultWidth: 44 },
    { key: 'title', label: 'Title', type: 'text', sortable: true },
    { key: 'subtitle', label: 'Subtitle', type: 'text', sortable: true, defaultVisible: false, maxWidth: 250 },
    { key: 'slug', label: 'Slug', type: 'text', sortable: true, defaultVisible: false, mono: true },
    { key: 'client_name', label: 'Client', type: 'text', sortable: true },
    { key: 'description', label: 'Description', type: 'text', defaultVisible: false, maxWidth: 300 },
    { key: 'client_quote', label: 'Quote', type: 'text', defaultVisible: false, maxWidth: 250 },
    { key: 'category', label: 'Type', type: 'text', sortable: true },
    { key: 'style_tags', label: 'Style', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.style_tags },
    { key: 'premium_addons', label: 'Add-ons', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.premium_addons },
    { key: 'camera_techniques', label: 'Techniques', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.camera_techniques },
    { key: 'assets_delivered', label: 'Assets', type: 'tags', defaultVisible: false, tagSuggestions: tagSuggestions?.assets_delivered },
    { key: 'production_days', label: 'Days', type: 'number', sortable: true, defaultVisible: false },
    { key: 'crew_count', label: 'Crew', type: 'number', sortable: true, defaultVisible: false },
    { key: 'talent_count', label: 'Talent', type: 'number', sortable: true, defaultVisible: false },
    { key: 'location_count', label: 'Locations', type: 'number', sortable: true, defaultVisible: false },
    { key: 'thumbnail_url', label: 'Thumb URL', type: 'text', defaultVisible: false, mono: true },
    { key: 'client_id', label: 'Client ID', type: 'text', defaultVisible: false, mono: true },
    { key: 'updated_by', label: 'Updated By', type: 'text', defaultVisible: false, mono: true },
    { key: 'created_at', label: 'Created', type: 'date', sortable: true, defaultVisible: false },
    { key: 'updated_at', label: 'Updated', type: 'date', sortable: true },
    {
      key: 'published', label: 'Published', type: 'toggle', sortable: true, group: 'Status',
      toggleLabels: ['Published', 'Draft'],
      toggleColors: ['bg-admin-success-bg text-admin-success', 'bg-admin-bg-hover text-admin-text-faint'],
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
