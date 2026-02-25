'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Copy, Check, ExternalLink, PanelRightOpen, PanelRightClose, Settings,
} from 'lucide-react';
import { ProposalCanvas } from './ProposalCanvas';
import { ContentLibrarySidebar } from './ContentLibrarySidebar';
import { ProposalDndContext } from './ProposalDndContext';
import {
  addProposalSection,
  updateProposalSection,
  addProposalVideo,
  removeProposalVideo,
  reorderProposalVideos,
  updateProposalVideoBlurb,
  addProposalMilestone,
  updateProposalMilestone,
  deleteProposalMilestone,
} from '../../actions';
import type {
  ProposalRow,
  ProposalSectionRow,
  ProposalQuoteRow,
  ProposalMilestoneRow,
  ContentSnippetRow,
} from '@/types/proposal';

type VideoItem = {
  id: string;
  bunny_video_id: string;
  title: string;
  video_type: string;
  aspect_ratio: string;
  project_id: string;
  project: { id: string; title: string; thumbnail_url: string | null; slug: string } | null;
};

type ProposalVideo = {
  id: string;
  proposal_id: string;
  sort_order: number;
  section_id: string;
  project_video: {
    id: string;
    bunny_video_id: string;
    title: string;
    video_type: string;
    aspect_ratio: string;
  } | null;
};

interface Props {
  proposal: ProposalRow;
  initialSections: ProposalSectionRow[];
  snippets: ContentSnippetRow[];
  videos: VideoItem[];
  proposalVideos: ProposalVideo[];
  proposalQuotes: ProposalQuoteRow[];
  initialMilestones: ProposalMilestoneRow[];
}

export function ProposalBuilderClient({
  proposal,
  initialSections,
  snippets,
  videos,
  proposalVideos: initialProposalVideos,
  proposalQuotes,
  initialMilestones,
}: Props) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [proposalVideos, setProposalVideos] = useState(initialProposalVideos);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Find the welcome and approach sections by sort_order convention:
  // sort_order 0 = welcome, sort_order 1 = approach
  const welcomeSection = sections.find((s) => s.sort_order === 0 && s.section_type === 'text') ?? null;
  const approachSection = sections.find((s) => s.sort_order === 1 && s.section_type === 'text') ?? null;

  // ── Snippet drop into a text zone ───────────────────────────────────────
  const handleDropSnippet = useCallback(async (zoneId: string, data: Record<string, unknown>) => {
    const snippet = data.snippet as ContentSnippetRow | undefined;
    if (!snippet) return;

    const sortOrder = zoneId === 'welcome' ? 0 : 1;
    const existing = sections.find((s) => s.sort_order === sortOrder && s.section_type === 'text');

    try {
      if (existing) {
        await updateProposalSection(existing.id, {
          snippet_id: snippet.id,
          custom_title: snippet.title,
          custom_content: snippet.body,
        });
        setSections((prev) =>
          prev.map((s) =>
            s.id === existing.id
              ? { ...s, snippet_id: snippet.id, custom_title: snippet.title, custom_content: snippet.body }
              : s
          )
        );
      } else {
        const id = await addProposalSection({
          proposal_id: proposal.id,
          section_type: 'text',
          snippet_id: snippet.id,
          custom_title: snippet.title,
          custom_content: snippet.body,
          sort_order: sortOrder,
        });
        const newSection: ProposalSectionRow = {
          id,
          proposal_id: proposal.id,
          section_type: 'text',
          snippet_id: snippet.id,
          custom_content: snippet.body,
          custom_title: snippet.title,
          layout_columns: 1,
          layout_position: 'full',
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        };
        setSections((prev) => [...prev, newSection]);
      }
    } catch (err) {
      console.error('Failed to add snippet:', err);
    }
  }, [proposal.id, sections]);

  // ── Snippet click from sidebar (+ button) ──────────────────────────────
  const handleAddSnippet = useCallback(async (snippet: ContentSnippetRow) => {
    // Insert into first empty text zone
    const zoneId = !welcomeSection ? 'welcome' : !approachSection ? 'approach' : 'welcome';
    await handleDropSnippet(zoneId, { snippet });
  }, [welcomeSection, approachSection, handleDropSnippet]);

  // ── Video drop/click ───────────────────────────────────────────────────
  const handleDropVideo = useCallback(async (data: Record<string, unknown>) => {
    const videoId = data.videoId as string | undefined;
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;

    try {
      // Find or create the video section
      let videoSection = sections.find((s) => s.section_type === 'video');
      let sectionId: string;

      if (videoSection) {
        sectionId = videoSection.id;
      } else {
        sectionId = await addProposalSection({
          proposal_id: proposal.id,
          section_type: 'video',
          sort_order: 10, // videos zone
        });
        const newSection: ProposalSectionRow = {
          id: sectionId,
          proposal_id: proposal.id,
          section_type: 'video',
          snippet_id: null,
          custom_content: null,
          custom_title: null,
          layout_columns: 1,
          layout_position: 'full',
          sort_order: 10,
          created_at: new Date().toISOString(),
        };
        setSections((prev) => [...prev, newSection]);
      }

      const pvId = await addProposalVideo({
        proposal_id: proposal.id,
        section_id: sectionId,
        project_video_id: video.id,
        sort_order: proposalVideos.length,
      });

      setProposalVideos((prev) => [
        ...prev,
        {
          id: pvId,
          proposal_id: proposal.id,
          sort_order: prev.length,
          section_id: sectionId,
          project_video: {
            id: video.id,
            bunny_video_id: video.bunny_video_id,
            title: video.title,
            video_type: video.video_type,
            aspect_ratio: video.aspect_ratio,
          },
        },
      ]);
    } catch (err) {
      console.error('Failed to add video:', err);
    }
  }, [proposal.id, videos, sections, proposalVideos.length]);

  const handleAddVideo = useCallback(async (video: VideoItem) => {
    await handleDropVideo({ videoId: video.id });
  }, [handleDropVideo]);

  const handleRemoveVideo = useCallback(async (pvId: string) => {
    try {
      await removeProposalVideo(pvId);
      setProposalVideos((prev) => prev.filter((v) => v.id !== pvId));
    } catch (err) {
      console.error('Failed to remove video:', err);
    }
  }, []);

  const handleMoveVideo = useCallback(async (id: string, dir: 'up' | 'down') => {
    const idx = proposalVideos.findIndex((v: any) => v.id === id);
    if (idx === -1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= proposalVideos.length) return;
    const updated = [...proposalVideos];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((v: any, i: number) => ({ ...v, sort_order: i }));
    setProposalVideos(reordered);
    try {
      await reorderProposalVideos(reordered.map((v: any) => ({ id: v.id, sort_order: v.sort_order })));
    } catch (err) {
      console.error('Failed to reorder videos:', err);
      setProposalVideos(proposalVideos);
    }
  }, [proposalVideos]);

  const handleUpdateVideoBlurb = useCallback(async (id: string, blurb: string | null) => {
    setProposalVideos((prev: any[]) => prev.map((v: any) => v.id === id ? { ...v, proposal_blurb: blurb } : v));
    try {
      await updateProposalVideoBlurb(id, blurb);
    } catch (err) {
      console.error('Failed to update blurb:', err);
    }
  }, []);

  // ── Section updates ────────────────────────────────────────────────────
  const handleUpdateSection = useCallback((id: string, data: Partial<ProposalSectionRow>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const handleSectionCreate = useCallback((section: import('@/types/proposal').ProposalSectionRow) => {
    setSections((prev) => {
      const exists = prev.some((s) => s.id === section.id);
      return exists ? prev : [...prev, section];
    });
  }, []);
  // ── Milestone handlers ─────────────────────────────────────────────────
  const handleAddMilestone = useCallback(async (milestone: Omit<ProposalMilestoneRow, 'id' | 'created_at'>) => {
    try {
      const id = await addProposalMilestone(milestone);
      setMilestones((prev) => [
        ...prev,
        { ...milestone, id, created_at: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  }, []);

  const handleUpdateMilestone = useCallback(async (id: string, data: Partial<ProposalMilestoneRow>) => {
    try {
      await updateProposalMilestone(id, data);
      setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  }, []);

  const handleDeleteMilestone = useCallback(async (id: string) => {
    try {
      await deleteProposalMilestone(id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  }, []);

  // ── UI ─────────────────────────────────────────────────────────────────
  const copyLink = () => {
    const url = `${window.location.origin}/p/${proposal.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/proposals')}
          className="p-2 rounded-lg text-white/30 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{proposal.title}</h1>
          <p className="text-[11px] text-white/20 font-mono truncate">/p/{proposal.slug}</p>
        </div>

        <button
          onClick={() => router.push(`/admin/proposals/${proposal.id}/settings`)}
          title="Edit proposal settings"
          className="p-2 rounded-lg text-white/30 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <Settings size={15} />
        </button>
        <button
          onClick={copyLink}
          title="Copy proposal link"
          className="p-2 rounded-lg text-white/30 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          {copiedLink ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
        </button>
        <button
          onClick={() => window.open(`/p/${proposal.slug}`, '_blank')}
          title="Open proposal page"
          className="p-2 rounded-lg text-white/30 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <ExternalLink size={15} />
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Hide library' : 'Show library'}
          className="p-2 rounded-lg text-white/30 hover:text-foreground hover:bg-white/5 transition-colors"
        >
          {sidebarOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </button>
      </div>

      {/* Builder area */}
      <ProposalDndContext
        onDropSnippet={handleDropSnippet}
        onDropVideo={handleDropVideo}
      >
        <div className="flex-1 min-h-0 flex">
          {/* Canvas */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scrollbar">
            <ProposalCanvas
              proposal={proposal}
              welcomeSection={welcomeSection}
              approachSection={approachSection}
              proposalVideos={proposalVideos}
              proposalQuotes={proposalQuotes}
              milestones={milestones}
              onUpdateSection={handleUpdateSection}
              onSectionCreate={handleSectionCreate}
              onRemoveVideo={handleRemoveVideo}
              onMoveVideo={handleMoveVideo}
              onUpdateVideoBlurb={handleUpdateVideoBlurb}
              onAddMilestone={handleAddMilestone}
              onUpdateMilestone={handleUpdateMilestone}
              onDeleteMilestone={handleDeleteMilestone}
            />
          </div>

          {/* Sidebar with smooth collapse */}
          <div
            className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
              sidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <div className="w-72 h-full">
              <ContentLibrarySidebar
                snippets={snippets}
                videos={videos}
                onAddSnippet={handleAddSnippet}
                onAddVideo={handleAddVideo}
              />
            </div>
          </div>
        </div>
      </ProposalDndContext>
    </div>
  );
}
