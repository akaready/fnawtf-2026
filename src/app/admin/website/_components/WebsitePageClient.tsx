'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Search, Plus, Check, Loader2, X, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { AdminTabBar } from '@/app/admin/_components/AdminTabBar';
import { addPlacement, removePlacement } from '@/app/admin/actions';
import type { PlacementPage, PlacementWithProject } from '@/types/placement';
import type { BrowserProject } from '@/types/proposal';
import { PlacementList, type PlacementLayout } from './PlacementList';

type Tab = 'homepage' | 'work' | 'services';

const PAGE_TABS: { value: Tab; label: string }[] = [
  { value: 'homepage', label: 'Homepage' },
  { value: 'work', label: 'Work' },
  { value: 'services', label: 'Services' },
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
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
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
                <h2 className="text-base font-semibold text-white/70">Featured Work</h2>
                <p className="text-sm text-white/30 mt-1">
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
                <h2 className="text-base font-semibold text-white/70">Portfolio</h2>
                <p className="text-sm text-white/30 mt-1">
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
                        ? 'bg-white/[0.04] border-white/[0.1]'
                        : 'bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03]'
                    }`}
                    onClick={() => setActiveServicePage(section.page)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveServicePage(section.page); }}
                  >
                    <div className="mb-5">
                      <h2 className={`text-base font-semibold transition-colors ${
                        isActive ? 'text-white/70' : 'text-white/40'
                      }`}>
                        {section.label}
                      </h2>
                      <p className="text-sm text-white/30 mt-1">
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
        <div className="flex-shrink-0 w-72 border-l border-white/[0.12] flex flex-col bg-white/[0.01]">
          <div className="flex-shrink-0">
            {activeTab === 'services' && (
              <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 border-b border-white/[0.12]">
                {SERVICE_SECTIONS.map((s) => (
                  <button
                    key={s.page}
                    onClick={() => setActiveServicePage(s.page)}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                      activeServicePage === s.page
                        ? 'bg-white/10 text-white'
                        : 'text-white/30 hover:text-white/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="px-3 py-3 border-b border-white/[0.12] space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-white/[0.04] border border-white/[0.12] rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex items-center">
                {(['all', 'used', 'unused'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSidebarFilter(f)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      sidebarFilter === f
                        ? 'bg-white/10 text-white/70'
                        : 'text-white/25 hover:text-white/40'
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
              <p className="text-center text-sm text-white/20 py-8">No matching projects.</p>
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
                          ? 'bg-white/[0.04]'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded overflow-hidden bg-white/[0.04]">
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
                        <p className={`text-sm font-medium truncate ${isPlaced ? 'text-white/70' : 'text-white/50'}`}>
                          {project.title}
                        </p>
                        {project.client_name && (
                          <p className="text-xs text-white/25 truncate">{project.client_name}</p>
                        )}
                      </div>

                      {isLoading ? (
                        <Loader2 size={14} className="text-white/30 animate-spin flex-shrink-0" />
                      ) : isPlaced ? (
                        <span className="flex-shrink-0 text-green-400/60 group-hover/item:hidden">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-white/15 opacity-0 group-hover/item:opacity-100">
                          <Plus size={14} />
                        </span>
                      )}

                      {isPlaced && !isLoading && (
                        <span className="flex-shrink-0 text-red-400/60 hidden group-hover/item:block">
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
