'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, ChevronDown, ChevronRight, FileText, Video, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { getBunnyVideoThumbnail } from '@/lib/bunny/client';
import type { ContentSnippetRow } from '@/types/proposal';

type VideoItem = {
  id: string;
  bunny_video_id: string;
  title: string;
  video_type: string;
  aspect_ratio: string;
  project_id: string;
  project: { id: string; title: string; thumbnail_url: string | null; slug: string } | null;
};

interface Props {
  snippets: ContentSnippetRow[];
  videos: VideoItem[];
  onAddSnippet: (snippet: ContentSnippetRow) => void;
  onAddVideo: (video: VideoItem) => void;
}

function DraggableSidebarItem({ id, dragData, children }: { id: string; dragData: Record<string, unknown>; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${id}`,
    data: { source: 'sidebar', ...dragData },
  });

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <div className="flex items-center">
        <div
          {...listeners}
          {...attributes}
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-muted-foreground/15 hover:text-[#404044] transition-colors"
        >
          <GripVertical size={10} />
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

type TabId = 'snippets' | 'videos';

export function ContentLibrarySidebar({ snippets, videos, onAddSnippet, onAddVideo }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('snippets');
  const [search, setSearch] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const tabs: { id: TabId; label: string; icon: typeof FileText; count: number }[] = [
    { id: 'snippets', label: 'Snippets', icon: FileText, count: snippets.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
  ];

  const filteredSnippets = useMemo(() => {
    if (!search.trim()) return snippets;
    const q = search.toLowerCase();
    return snippets.filter((s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q) || s.snippet_type.includes(q));
  }, [snippets, search]);

  const videosByProject = useMemo(() => {
    const groups: Record<string, { projectTitle: string; videos: VideoItem[] }> = {};
    for (const v of videos) {
      const key = v.project_id;
      const projectTitle = v.project?.title ?? 'Unknown Project';
      if (!groups[key]) groups[key] = { projectTitle, videos: [] };
      groups[key].videos.push(v);
    }
    return groups;
  }, [videos]);

  const filteredVideoGroups = useMemo(() => {
    if (!search.trim()) return videosByProject;
    const q = search.toLowerCase();
    const filtered: typeof videosByProject = {};
    for (const [key, group] of Object.entries(videosByProject)) {
      const matchingVideos = group.videos.filter((v) => v.title.toLowerCase().includes(q) || group.projectTitle.toLowerCase().includes(q));
      if (matchingVideos.length > 0) {
        filtered[key] = { ...group, videos: matchingVideos };
      }
    }
    return filtered;
  }, [videosByProject, search]);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const SNIPPET_TYPE_COLORS: Record<string, string> = {
    build: 'text-purple-400',
    launch: 'text-orange-400',
    scale: 'text-cyan-400',
    'build-launch': 'text-indigo-400',
    fundraising: 'text-emerald-400',
    general: 'text-zinc-400',
  };

  return (
    <div className="flex flex-col h-full border-l border-[#2a2a2a] bg-[#0a0a0a]">
      {/* Tab bar */}
      <div className="flex border-b border-[#2a2a2a]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-white text-foreground'
                  : 'border-transparent text-[#515155] hover:text-muted-foreground'
              }`}
            >
              <Icon size={12} />
              {tab.label}
              <span className="text-[#303033]">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#404044]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}…`}
            className="w-full rounded-md border border-[#2a2a2a] bg-black/50 pl-7 pr-2 py-1.5 text-xs text-foreground placeholder:text-[#303033] focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto admin-scrollbar px-3 pb-4">
        {/* Snippets tab */}
        {activeTab === 'snippets' && (
          <div className="space-y-1.5">
            {filteredSnippets.length === 0 && (
              <div className="text-xs text-[#303033] text-center py-6">No snippets found</div>
            )}
            {filteredSnippets.map((s) => (
              <DraggableSidebarItem key={s.id} id={s.id} dragData={{ dragType: 'snippet', label: s.title, snippet: s }}>
                <div className="group flex items-start gap-2 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium uppercase ${SNIPPET_TYPE_COLORS[s.snippet_type] ?? 'text-zinc-400'}`}>
                        {s.snippet_type}
                      </span>
                      <span className="text-[10px] text-[#303033]">{s.category}</span>
                    </div>
                    <div className="text-xs font-medium text-foreground mt-0.5 truncate">{s.title}</div>
                    <div className="text-[11px] text-[#404044] line-clamp-2 mt-0.5">{s.body}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAddSnippet(s); }}
                    className="flex-shrink-0 p-1.5 rounded text-[#333] hover:text-foreground hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Add to proposal"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </DraggableSidebarItem>
            ))}
          </div>
        )}

        {/* Videos tab */}
        {activeTab === 'videos' && (
          <div className="space-y-1">
            {Object.keys(filteredVideoGroups).length === 0 && (
              <div className="text-xs text-[#303033] text-center py-6">No videos found</div>
            )}
            {Object.entries(filteredVideoGroups).map(([projectId, group]) => {
              const isExpanded = expandedProjects.has(projectId);
              return (
                <div key={projectId}>
                  <button
                    onClick={() => toggleProjectExpand(projectId)}
                    className="flex items-center gap-2 w-full py-2 px-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="truncate">{group.projectTitle}</span>
                    <span className="text-[#303033] ml-auto flex-shrink-0">{group.videos.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 ml-4 mb-2">
                      {group.videos.map((v) => (
                        <DraggableSidebarItem key={v.id} id={v.id} dragData={{ dragType: 'video', label: v.title, videoId: v.id }}>
                          <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                            <div className="w-12 h-8 rounded overflow-hidden bg-black/50 flex-shrink-0">
                              <img
                                src={getBunnyVideoThumbnail(v.bunny_video_id)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-foreground truncate">{v.title}</div>
                              <div className="text-[10px] text-[#404044]">{v.video_type} · {v.aspect_ratio}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAddVideo(v); }}
                              className="flex-shrink-0 p-1.5 rounded text-[#333] hover:text-foreground hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Add to proposal"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </DraggableSidebarItem>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
