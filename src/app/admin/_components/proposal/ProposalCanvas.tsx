'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Pencil, Settings, X } from 'lucide-react';
import { VideoPlayerProvider } from '@/contexts/VideoPlayerContext';
import { TitleSlide } from '@/components/proposal/slides/TitleSlide';
import { WelcomeSlide } from '@/components/proposal/slides/WelcomeSlide';
import { ApproachSlide } from '@/components/proposal/slides/ApproachSlide';
import { ScheduleSlide } from '@/components/proposal/slides/ScheduleSlide';
import { InvestmentSlide } from '@/components/proposal/slides/InvestmentSlide';
import { ProcessSlide } from '@/components/proposal/slides/ProcessSlide';
import { NextStepsSlide } from '@/components/proposal/slides/NextStepsSlide';
import { DropZone } from './DropZone';
import { ScheduleBuilder } from './ScheduleBuilder';
import { EditableSlideText } from './EditableSlideText';
import { QuoteBuilder } from './QuoteBuilder';
import type { ProposalRow, ProposalSectionRow, ProposalQuoteRow, ProposalMilestoneRow } from '@/types/proposal';


interface Props {
  proposal: ProposalRow;
  welcomeSection: ProposalSectionRow | null;
  approachSection: ProposalSectionRow | null;
  proposalVideos: any[];
  proposalQuotes: ProposalQuoteRow[];
  milestones: ProposalMilestoneRow[];
  onUpdateSection: (id: string, data: Partial<ProposalSectionRow>) => void;
  onSectionCreate: (section: ProposalSectionRow) => void;
  onRemoveVideo: (id: string) => void;
  onMoveVideo?: (id: string, dir: 'up' | 'down') => void;
  onUpdateVideoBlurb?: (id: string, blurb: string | null) => void;
  onAddMilestone: (milestone: Omit<ProposalMilestoneRow, 'id' | 'created_at'>) => void;
  onUpdateMilestone: (id: string, data: Partial<ProposalMilestoneRow>) => void;
  onDeleteMilestone: (id: string) => void;
}

export function ProposalCanvas({
  proposal,
  welcomeSection,
  approachSection,
  proposalVideos,
  proposalQuotes,
  milestones,
  onUpdateSection,
  onSectionCreate,
  onRemoveVideo,
  onMoveVideo,
  onUpdateVideoBlurb,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
}: Props) {
  const router = useRouter();
  const [editingWelcome, setEditingWelcome] = useState(false);
  const [editingApproach, setEditingApproach] = useState(false);

  const fnaQuotes = proposalQuotes.filter((q) => q.is_fna_quote && !q.deleted_at);

  return (
    <VideoPlayerProvider>
      <div className="pb-16">

        {/* Title Slide */}
        <AdminSlideShell
          label="Title"
          actionLabel="Edit in Settings"
          actionIcon={<Settings size={12} />}
          onAction={() => router.push(`/admin/proposals/${proposal.id}/settings`)}
        >
          <TitleSlide proposal={proposal} />
        </AdminSlideShell>

        {/* Welcome Slide */}
        <DropZone id="zone-welcome" zoneType="text" zoneId="welcome" label="Welcome text">
          <AdminSlideShell
            label="Welcome"
            actionLabel="Edit Text"
            actionIcon={<Pencil size={12} />}
            onAction={() => setEditingWelcome(true)}
          >
            <WelcomeSlide section={welcomeSection} />
            {editingWelcome && (
              <EditableSlideText
                proposalId={proposal.id}
                sectionId={welcomeSection?.id}
                sortOrder={0}
                title={welcomeSection?.custom_title ?? null}
                content={welcomeSection?.custom_content ?? null}
                placeholder="Write a personal welcome message for your client…"
                onSaved={(section) => {
                  if (welcomeSection) {
                    onUpdateSection(welcomeSection.id, section);
                  } else {
                    onSectionCreate(section);
                  }
                  setEditingWelcome(false);
                }}
                onCancel={() => setEditingWelcome(false)}
              />
            )}
          </AdminSlideShell>
        </DropZone>

        {/* Approach Slide */}
        <DropZone id="zone-approach" zoneType="text" zoneId="approach" label="Approach text">
          <AdminSlideShell
            label="Approach"
            actionLabel="Edit Text"
            actionIcon={<Pencil size={12} />}
            onAction={() => setEditingApproach(true)}
          >
            <ApproachSlide section={approachSection} />
            {editingApproach && (
              <EditableSlideText
                proposalId={proposal.id}
                sectionId={approachSection?.id}
                sortOrder={1}
                title={approachSection?.custom_title ?? null}
                content={approachSection?.custom_content ?? null}
                placeholder="Describe your approach to the project…"
                onSaved={(section) => {
                  if (approachSection) {
                    onUpdateSection(approachSection.id, section);
                  } else {
                    onSectionCreate(section);
                  }
                  setEditingApproach(false);
                }}
                onCancel={() => setEditingApproach(false)}
              />
            )}
          </AdminSlideShell>
        </DropZone>

        {/* Schedule */}
        <AdminSlideShell label="Production Schedule">
          <div className="bg-black border-b border-border">
            <div className="max-w-5xl mx-auto px-8 pt-10 pb-6">
              <ScheduleBuilder
                proposal={proposal}
                milestones={milestones}
                onAdd={onAddMilestone}
                onUpdate={onUpdateMilestone}
                onDelete={onDeleteMilestone}
              />
            </div>
            {milestones.length > 0 && (
              <ScheduleSlide
                milestones={milestones}
                startDate={proposal.schedule_start_date}
                endDate={proposal.schedule_end_date}
              />
            )}
          </div>
        </AdminSlideShell>

        {/* Videos */}
        <DropZone id="zone-videos" zoneType="video" zoneId="videos" label="Sample videos">
          <AdminSlideShell label="Sample Videos">
            <div className="space-y-3 p-6">
              {(proposalVideos ?? []).length === 0 && (
                <p className="text-white/20 text-sm text-center py-8">
                  Drag videos from the library to add sample project slides
                </p>
              )}
              {(proposalVideos ?? []).map((v: any, i: number) => (
                <div
                  key={v.id}
                  className="flex gap-3 items-start rounded-lg border border-[#2a2a2a] bg-white/[0.02] p-4"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1 flex-shrink-0 pt-1">
                    <button
                      onClick={() => onMoveVideo?.(v.id, 'up')}
                      disabled={i === 0}
                      className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => onMoveVideo?.(v.id, 'down')}
                      disabled={i === (proposalVideos ?? []).length - 1}
                      className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {/* Video info + blurb */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium text-white/60 truncate">
                      {v.project_video?.title ?? v.project_video?.project?.title ?? 'Untitled video'}
                    </p>
                    <textarea
                      rows={2}
                      value={v.proposal_blurb ?? ''}
                      onChange={(e) => onUpdateVideoBlurb?.(v.id, e.target.value || null)}
                      placeholder="What to watch for… (optional)"
                      className="w-full rounded-md border border-[#2a2a2a] bg-black/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                    />
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => onRemoveVideo(v.id)}
                    className="flex-shrink-0 p-1.5 rounded text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </AdminSlideShell>
        </DropZone>

        {/* Investment / Quotes */}
        <AdminSlideShell label="Price Quote">
          <div className="bg-black border-b border-border min-h-[50vh] flex flex-col justify-center">
            <div className="max-w-5xl mx-auto px-8 py-12 w-full space-y-8">
              <QuoteBuilder proposalId={proposal.id} existingQuotes={fnaQuotes} />
              {proposalQuotes.length > 0 && (
                <InvestmentSlide
                  proposalId={proposal.id}
                  proposalType={proposal.proposal_type}
                  quotes={proposalQuotes}
                />
              )}
            </div>
          </div>
        </AdminSlideShell>

        {/* Process — read-only */}
        <AdminSlideShell label="Process & Capabilities">
          <ProcessSlide />
        </AdminSlideShell>

        {/* Next Steps — read-only */}
        <AdminSlideShell label="Next Steps">
          <NextStepsSlide />
        </AdminSlideShell>

      </div>
    </VideoPlayerProvider>
  );
}

// ── AdminSlideShell ───────────────────────────────────────────────────────

interface ShellProps {
  label: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  children: React.ReactNode;
}

function AdminSlideShell({ label, actionLabel, actionIcon, onAction, children }: ShellProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pointer-events-none group-hover:pointer-events-auto">
        <span className="bg-black/80 border border-[#2a2a2a] text-white/40 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur-sm">
          {label}
        </span>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 bg-black/80 border border-[#2a2a2a] text-white/40 hover:text-white/80 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur-sm transition-colors"
          >
            {actionIcon}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
