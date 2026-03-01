'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Search, Plus, Check, Loader2, X, PanelRightOpen, PanelRightClose, Home, Play, ClipboardList } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { AdminTabBar } from '@/app/admin/_components/AdminTabBar';
import { addPlacement, removePlacement } from '@/app/admin/actions';
import type { PlacementPage, PlacementWithProject } from '@/types/placement';
import type { BrowserProject } from '@/types/proposal';
import { PlacementList, type PlacementLayout } from './PlacementList';

type Tab = 'homepage' | 'work' | 'services';

const PAGE_TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'homepage', label: 'Home', icon: <Home size={13} className="flex-shrink-0" /> },
  { value: 'work', label: 'Work', icon: <Play size={13} className="flex-shrink-0" /> },
  { value: 'services', label: 'Services', icon: <ClipboardList size={13} className="flex-shrink-0" /> },
];

const FEATURED_MAX = 4; // 1 wide + 3 normal

const SERVICE_SECTIONS: { page: PlacementPage; label: string; layout: PlacementLayout; showFullWidth: boolean; description: string; max?: number }[] = [
  { page: 'services_build', label: 'Build', layout: 'featured', showFullWidth: false, max: FEATURED_MAX, description: '1 featured project + 3 below it, shown in the Build section.' },
  { page: 'services_launch', label: 'Launch', layout: 'featured', showFullWidth: false, max: FEATURED_MAX, description: '1 featured project + 3 below it, shown in the Launch section.' },
  { page: 'services_scale', label: 'Scale', layout: 'featured', showFullWidth: false, max: FEATURED_MAX, description: '1 featured project + 3 below it, shown in the Scale section.' },
  { page: 'services_crowdfunding', label: 'Crowdfunding', layout: 'row', showFullWidth: false, description: 'Scrolling carousel on /services. All shown side by side.' },
  { page: 'services_fundraising', label: 'Fundraising', layout: 'row', showFullWidth: false, description: 'Scrolling carousel on /services. All shown side by side.' },
];

interface WebsitePageClientProps {
  initialHomepage: PlacementWithProject[];
  initialWork: PlacementWithProject[];
  initialServices: Record<string, PlacementWithProject[]>;
  allProjects: BrowserProject[];
}

export function WebsitePageClient({
  initialHomepage,
  initialWork,
  initialServices,
  allProjects,
}: WebsitePageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('homepage');
  const [activeServicePage, setActiveServicePage] = useState<PlacementPage>('services_build');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Track placements per page in parent so we can update after add
  const [homepage, setHomepage] = useState(initialHomepage);
  const [work, setWork] = useState(initialWork);
  const [services, setServices] = useState(initialServices);

  const listRefsUpdated = useRef(0);

  const getPlacementsForPage = (page: PlacementPage): PlacementWithProject[] => {
    if (page === 'homepage') return homepage;
    if (page === 'work') return work;
    return services[page.replace('services_', '')] ?? [];
  };

  const setPlacementsForPage = (page: PlacementPage, placements: PlacementWithProject[]) => {
    if (page === 'homepage') setHomepage(placements);
    else if (page === 'work') setWork(placements);
    else {
      const key = page.replace('services_', '');
      setServices((prev) => ({ ...prev, [key]: placements }));
    }
  };

  // The active placement page for the sidebar context
  const activePage: PlacementPage = activeTab === 'services' ? activeServicePage : activeTab;
  const activePlacements = getPlacementsForPage(activePage);
  const placedProjectIds = useMemo(() => new Set(activePlacements.map((p) => p.project_id)), [activePlacements]);

  // Sidebar project list filtered by search + placed status, sorted by client name
  const sidebarProjects = useMemo(() => {
    let list = allProjects;
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.trim().toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.client_name && p.client_name.toLowerCase().includes(q))
      );
    }
    if (sidebarFilter === 'used') {
      list = list.filter((p) => placedProjectIds.has(p.id));
    } else if (sidebarFilter === 'unused') {
      list = list.filter((p) => !placedProjectIds.has(p.id));
    }
    return list;
  }, [allProjects, sidebarSearch, sidebarFilter, placedProjectIds]);

  // Check if the active page has a max limit
  const activeSection = SERVICE_SECTIONS.find((s) => s.page === activePage);
  const activeMax = activeSection?.max;
  const isAtMax = activeMax !== undefined && activePlacements.length >= activeMax;

  const handleAdd = useCallback(
    async (projectId: string) => {
      const currentPlacements = getPlacementsForPage(activePage);
      // Enforce max limit
      const section = SERVICE_SECTIONS.find((s) => s.page === activePage);
      if (section?.max && currentPlacements.length >= section.max) return;
      setLoadingIds((prev) => new Set(prev).add(projectId));
      try {
        const id = await addPlacement({
          project_id: projectId,
          page: activePage,
          sort_order: currentPlacements.length,
        });

        const project = allProjects.find((p) => p.id === projectId);
        if (!project) return;

        const newPlacement: PlacementWithProject = {
          id,
          project_id: projectId,
          page: activePage,
          sort_order: currentPlacements.length,
          full_width: false,
          created_at: new Date().toISOString(),
          project: {
            id: project.id,
            title: project.title,
            slug: project.slug,
            thumbnail_url: project.thumbnail_url,
            client_name: '',
            published: true,
          },
        };

        setPlacementsForPage(activePage, [...currentPlacements, newPlacement]);
        listRefsUpdated.current += 1;
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePage, allProjects, homepage, work, services],
  );

  const handleSidebarRemove = useCallback(
    async (projectId: string) => {
      const placement = activePlacements.find((p) => p.project_id === projectId);
      if (!placement) return;
      setPlacementsForPage(activePage, activePlacements.filter((p) => p.id !== placement.id));
      listRefsUpdated.current += 1;
      removePlacement(placement.id, activePage).catch(console.error);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePage, activePlacements, homepage, work, services],
  );

  const totalCount = homepage.length + work.length +
    Object.values(services).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-full">
      <AdminPageHeader
        title="Website"
        subtitle={`${totalCount} placements across ${3 + SERVICE_SECTIONS.length} pages`}
      />

      <AdminTabBar
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as Tab)}
        actions={
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            title={sidebarOpen ? 'Hide project list' : 'Show project list'}
          >
            {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        }
      />

      {/* Main content + sidebar */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: placement lists */}
        <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar px-8 py-6">
          {activeTab === 'homepage' && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-admin-text-secondary">Featured Work</h2>
                <p className="text-sm text-admin-text-secondary mt-1">
                  Projects displayed on the homepage. Drag to reorder.
                </p>
              </div>
              <PlacementList
                key={`homepage-${listRefsUpdated.current}`}
                page="homepage"
                initialPlacements={homepage}
                layout="grid"
                showFullWidth
                onRemove={(id) => setHomepage((prev) => prev.filter((p) => p.id !== id))}
              />
            </div>
          )}

          {activeTab === 'work' && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-admin-text-secondary">Portfolio</h2>
                <p className="text-sm text-admin-text-secondary mt-1">
                  Projects displayed on the /work page. Drag to reorder.
                </p>
              </div>
              <PlacementList
                key={`work-${listRefsUpdated.current}`}
                page="work"
                initialPlacements={work}
                layout="grid"
                showFullWidth
                onRemove={(id) => setWork((prev) => prev.filter((p) => p.id !== id))}
              />
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-10">
              {SERVICE_SECTIONS.map((section) => {
                const key = section.page.replace('services_', '');
                const placements = services[key] ?? [];
                const isActive = activeServicePage === section.page;
                return (
                  <div
                    key={section.page}
                    role="button"
                    tabIndex={0}
                    className={`block w-full text-left rounded-xl p-5 border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-admin-bg-selected border-admin-border'
                        : 'bg-white/[0.015] border-admin-border hover:bg-admin-bg-subtle'
                    }`}
                    onClick={() => setActiveServicePage(section.page)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveServicePage(section.page); }}
                  >
                    <div className="mb-5">
                      <h2 className={`text-base font-semibold transition-colors ${
                        isActive ? 'text-admin-text-secondary' : 'text-admin-text-dim'
                      }`}>
                        {section.label}
                      </h2>
                      <p className="text-sm text-admin-text-secondary mt-1">
                        {section.description}
                        {section.max && (
                          <span className={`ml-1 ${placements.length >= section.max ? 'text-yellow-400/60' : ''}`}>
                            ({placements.length}/{section.max})
                          </span>
                        )}
                      </p>
                    </div>
                    <PlacementList
                      key={`${section.page}-${listRefsUpdated.current}`}
                      page={section.page}
                      initialPlacements={placements}
                      layout={section.layout}
                      showFullWidth={section.showFullWidth}
                      onRemove={(id) => {
                        setPlacementsForPage(section.page, placements.filter((p) => p.id !== id));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: project sidebar */}
        {sidebarOpen && (
        <div className="flex-shrink-0 w-72 border-l border-admin-border flex flex-col bg-admin-bg-subtle">
          <div className="flex-shrink-0">
            {activeTab === 'services' && (
              <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 border-b border-admin-border">
                {SERVICE_SECTIONS.map((s) => (
                  <button
                    key={s.page}
                    onClick={() => setActiveServicePage(s.page)}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                      activeServicePage === s.page
                        ? 'bg-admin-bg-active text-admin-text-primary'
                        : 'text-admin-text-secondary hover:text-admin-text-secondary'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="px-3 py-3 border-b border-admin-border space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-ghost" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-admin-bg-selected border border-admin-border rounded-md pl-9 pr-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-placeholder focus:outline-none focus:border-admin-border-emphasis"
                />
              </div>
              <div className="flex items-center">
                {(['all', 'used', 'unused'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSidebarFilter(f)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      sidebarFilter === f
                        ? 'bg-admin-bg-active text-admin-text-secondary'
                        : 'text-admin-text-ghost hover:text-admin-text-dim'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto admin-scrollbar p-2">
            {sidebarProjects.length === 0 ? (
              <p className="text-center text-sm text-admin-text-placeholder py-8">No matching projects.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {sidebarProjects.map((project) => {
                  const isPlaced = placedProjectIds.has(project.id);
                  const isLoading = loadingIds.has(project.id);

                  return (
                    <button
                      key={project.id}
                      onClick={() => isPlaced ? handleSidebarRemove(project.id) : handleAdd(project.id)}
                      disabled={isLoading || (!isPlaced && isAtMax)}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors disabled:opacity-50 group/item ${
                        isPlaced
                          ? 'bg-admin-bg-selected'
                          : 'hover:bg-admin-bg-selected'
                      }`}
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded overflow-hidden bg-admin-bg-selected">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isPlaced ? 'text-admin-text-secondary' : 'text-admin-text-secondary'}`}>
                          {project.title}
                        </p>
                        {project.client_name && (
                          <p className="text-xs text-admin-text-ghost truncate">{project.client_name}</p>
                        )}
                      </div>

                      {isLoading ? (
                        <Loader2 size={14} className="text-admin-text-secondary animate-spin flex-shrink-0" />
                      ) : isPlaced ? (
                        <span className="flex-shrink-0 text-admin-success/60 group-hover/item:hidden">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-admin-text-primary/15 opacity-0 group-hover/item:opacity-100">
                          <Plus size={14} />
                        </span>
                      )}

                      {isPlaced && !isLoading && (
                        <span className="flex-shrink-0 text-admin-danger/60 hidden group-hover/item:block">
                          <X size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
