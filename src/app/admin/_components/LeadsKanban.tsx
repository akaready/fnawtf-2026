'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTransition } from 'react';
import { Plus, Building2, RotateCcw } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { AdminPageHeader } from './AdminPageHeader';
import { type ClientRow, createClientRecord, updateClientRecord, updateContact, updateTestimonial, updateProject } from '../actions';
import type { ContactRow } from '@/types/proposal';
import { CompanyPanel } from './CompanyPanel';
import {
  type ClientProject,
  type ClientTestimonial,
  type CompanyStatus,
  STATUS_CONFIG,
} from './companyUtils';

type PipelineStage = 'new' | 'qualified' | 'proposal' | 'negotiating' | 'closed' | 'lost';

const PIPELINE_COLUMNS: { value: PipelineStage; label: string; accent: string; headerColor: string; overColor: string; cardBg: string; cardBgFocused: string; cardBorder: string; cardBorderFocused: string }[] = [
  { value: 'new',         label: 'New Lead',    accent: 'border-[#2a2a2a]',      headerColor: 'text-white/40',    overColor: 'bg-white/[0.04]',       cardBg: '#0e0e0e',   cardBgFocused: '#141414',   cardBorder: 'bg-[#2a2a2a]',      cardBorderFocused: 'bg-white/20' },
  { value: 'qualified',   label: 'Qualified',   accent: 'border-amber-500/30',   headerColor: 'text-amber-400',   overColor: 'bg-amber-500/[0.06]',   cardBg: '#1a1408',   cardBgFocused: '#251c0c',   cardBorder: 'bg-amber-800/50',   cardBorderFocused: 'bg-amber-600/70' },
  { value: 'proposal',    label: 'Proposal',    accent: 'border-sky-500/30',     headerColor: 'text-sky-400',     overColor: 'bg-sky-500/[0.06]',     cardBg: '#0a1520',   cardBgFocused: '#0d1e2e',   cardBorder: 'bg-sky-800/50',     cardBorderFocused: 'bg-sky-600/70' },
  { value: 'negotiating', label: 'Negotiating', accent: 'border-violet-500/30',  headerColor: 'text-violet-400',  overColor: 'bg-violet-500/[0.06]',  cardBg: '#150f1e',   cardBgFocused: '#1d1528',   cardBorder: 'bg-violet-800/50',  cardBorderFocused: 'bg-violet-600/70' },
  { value: 'closed',      label: 'Won',         accent: 'border-emerald-500/30', headerColor: 'text-emerald-400', overColor: 'bg-emerald-500/[0.06]', cardBg: '#0a1810',   cardBgFocused: '#0e2018',   cardBorder: 'bg-emerald-800/50', cardBorderFocused: 'bg-emerald-600/70' },
];

interface Props {
  initialLeads: ClientRow[];
  projects: ClientProject[];
  testimonials: ClientTestimonial[];
  contacts: ContactRow[];
}

export function LeadsKanban({ initialLeads, projects, testimonials, contacts: initialContacts }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [localContacts, setLocalContacts] = useState(initialContacts);
  const [localTestimonials, setLocalTestimonials] = useState(testimonials);
  const [localProjects, setLocalProjects] = useState(projects);
  const [, startSave] = useTransition();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [animatingCard, setAnimatingCard] = useState<ClientRow | null>(null);
  const [showLost, setShowLost] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeCompany = leads.find((c) => c.id === activeId) ?? null;
  const draggingCard = draggingId ? leads.find((c) => c.id === draggingId) ?? null : null;

  const handleCreate = () => {
    startSave(async () => {
      setCreating(true);
      const id = await createClientRecord({ name: 'New Lead', email: '' });
      const newRecord: ClientRow = {
        id,
        name: 'New Lead',
        company: null,
        email: '',
        notes: null,
        logo_url: null,
        company_types: ['lead'],
        status: 'prospect',
        pipeline_stage: 'new',
        website_url: null,
        linkedin_url: null,
        description: null,
        industry: null,
        location: null,
        founded_year: null,
        company_size: null,
        twitter_url: null,
        instagram_url: null,
        created_at: new Date().toISOString(),
      };
      setLeads((prev) => [...prev, newRecord]);
      setCreating(false);
      setActiveId(id);
    });
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over) return;
    const leadId = active.id as string;
    const lead = leads.find((c) => c.id === leadId);
    if (!lead) return;

    const activator = event.activatorEvent as PointerEvent;
    const x = (activator.clientX + event.delta.x) / window.innerWidth;
    const y = (activator.clientY + event.delta.y) / window.innerHeight;

    // Lost zone — move card there immediately, animate at drop target
    if (over.id === 'lost') {
      if (lead.pipeline_stage === 'lost') return;
      if (activeId === leadId) setActiveId(null);
      setLeads((prev) => prev.map((c) => c.id === leadId ? { ...c, pipeline_stage: 'lost' as PipelineStage } : c));
      setAnimatingCard(lead);
      setTimeout(() => {
        setAnimatingCard(null);
        updateClientRecord(leadId, { pipeline_stage: 'lost' }).catch(console.error);
      }, 520);
      return;
    }

    const STAGE_IDS = new Set(['new', 'qualified', 'proposal', 'negotiating', 'closed']);

    // Card-on-card drop → reorder within the same column
    if (!STAGE_IDS.has(over.id as string)) {
      const overId = over.id as string;
      const overCard = leads.find((c) => c.id === overId);
      if (!overCard || lead.pipeline_stage !== overCard.pipeline_stage) return;
      setLeads((prev) => {
        const fromIndex = prev.findIndex((c) => c.id === leadId);
        const toIndex = prev.findIndex((c) => c.id === overId);
        return arrayMove(prev, fromIndex, toIndex);
      });
      return;
    }

    const targetStage = over.id as PipelineStage;
    if (lead.pipeline_stage === targetStage) return;

    // Optimistic update — stage change
    setLeads((prev) => prev.map((c) => (c.id === leadId ? { ...c, pipeline_stage: targetStage } : c)));

    // Persist
    updateClientRecord(leadId, { pipeline_stage: targetStage }).catch(console.error);

    // Confetti only when moving forward (right) in the pipeline
    const stageOrder: PipelineStage[] = ['new', 'qualified', 'proposal', 'negotiating', 'closed'];
    const movingForward = stageOrder.indexOf(targetStage) > stageOrder.indexOf(lead.pipeline_stage as PipelineStage);
    if (movingForward) {
      confetti({ particleCount: 38, spread: 55, startVelocity: 22, origin: { x, y }, scalar: 0.75, ticks: 90 });
    }
  }, [leads, activeId]);

  const handleCompanyUpdated = useCallback((updated: ClientRow) => {
    setLeads((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleCompanyDeleted = useCallback((id: string) => {
    setLeads((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleContactLinked = useCallback(async (contactId: string, companyId: string, companyName: string) => {
    await updateContact(contactId, { client_id: companyId, company: companyName });
    setLocalContacts((prev) =>
      prev.map((ct) => ct.id === contactId ? { ...ct, client_id: companyId, company: companyName } : ct)
    );
  }, []);

  const handleContactUnlinked = useCallback(async (contactId: string) => {
    await updateContact(contactId, { client_id: null });
    setLocalContacts((prev) =>
      prev.map((ct) => ct.id === contactId ? { ...ct, client_id: null } : ct)
    );
  }, []);

  const handleTestimonialLinked = useCallback(async (testimonialId: string, companyId: string) => {
    await updateTestimonial(testimonialId, { client_id: companyId });
    setLocalTestimonials((prev) =>
      prev.map((t) => t.id === testimonialId ? { ...t, client_id: companyId } : t)
    );
  }, []);

  const handleTestimonialUnlinked = useCallback(async (testimonialId: string) => {
    await updateTestimonial(testimonialId, { client_id: null });
    setLocalTestimonials((prev) =>
      prev.map((t) => t.id === testimonialId ? { ...t, client_id: null } : t)
    );
  }, []);

  const handleProjectLinked = useCallback(async (projectId: string, companyId: string) => {
    await updateProject(projectId, { client_id: companyId });
    setLocalProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, client_id: companyId } : p)
    );
  }, []);

  const handleProjectUnlinked = useCallback(async (projectId: string) => {
    await updateProject(projectId, { client_id: null });
    setLocalProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, client_id: null } : p)
    );
  }, []);

  // Filter to lead-type companies only
  const leadsOnly = useMemo(() =>
    leads.filter((c) => (c.company_types ?? []).includes('lead')),
    [leads]
  );

  const lostLeads = useMemo(() =>
    leadsOnly.filter((c) => c.pipeline_stage === 'lost'),
    [leadsOnly]
  );

  const handleRestore = useCallback((id: string) => {
    setLeads((prev) => prev.map((c) => c.id === id ? { ...c, pipeline_stage: 'new' as PipelineStage } : c));
    updateClientRecord(id, { pipeline_stage: 'new' }).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const active = leadsOnly.filter((c) => c.pipeline_stage !== 'lost');
    if (!search.trim()) return active;
    const q = search.toLowerCase();
    return active.filter((c) =>
      c.name.toLowerCase().includes(q) || c.notes?.toLowerCase().includes(q)
    );
  }, [leadsOnly, search]);

  const byStage = useMemo(() => {
    const map: Record<PipelineStage, ClientRow[]> = {
      new: [], qualified: [], proposal: [], negotiating: [], closed: [], lost: [],
    };
    for (const lead of filtered) {
      const stage = (lead.pipeline_stage ?? 'new') as PipelineStage;
      (map[stage] ?? map.new).push(lead);
    }
    return map;
  }, [filtered]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Leads"
        subtitle={`${leadsOnly.length} total`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search leads…"
        actions={
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            Add Lead
          </button>
        }
      />

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden admin-scrollbar px-8 pt-4 pb-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
            {PIPELINE_COLUMNS.map((col) => {
              const cards = byStage[col.value];
              const column = (
                <KanbanColumn
                  key={col.value}
                  col={col}
                  cards={cards}
                  contacts={localContacts}
                  projects={projects}
                  activeId={activeId}
                  cardBg={col.cardBg}
                  cardBgFocused={col.cardBgFocused}
                  cardBorder={col.cardBorder}
                  cardBorderFocused={col.cardBorderFocused}
                  onCardClick={(id) => setActiveId(id)}
                />
              );
              if (col.value === 'closed') {
                return (
                  <div key={col.value} className="flex flex-col gap-3 w-[220px] flex-shrink-0 h-full">
                    <div className="flex-1 min-h-0 flex flex-col">{column}</div>
                    <LostZone
                      animatingCard={animatingCard}
                      lostLeads={lostLeads}
                      showLost={showLost}
                      onToggle={() => setShowLost((v) => !v)}
                      onRestore={handleRestore}
                    />
                  </div>
                );
              }
              return column;
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {draggingCard && (
              <LeadCard
                company={draggingCard}
                contacts={localContacts}
                projects={projects}
                isFocused={false}
                isDragging={false}
                isOverlay
                onClick={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CompanyPanel
        company={activeCompany}
        contacts={localContacts}
        projects={localProjects}
        testimonials={localTestimonials}
        onClose={() => setActiveId(null)}
        onCompanyUpdated={handleCompanyUpdated}
        onCompanyDeleted={handleCompanyDeleted}
        onContactLinked={handleContactLinked}
        onContactUnlinked={handleContactUnlinked}
        onTestimonialLinked={handleTestimonialLinked}
        onTestimonialUnlinked={handleTestimonialUnlinked}
        onProjectLinked={handleProjectLinked}
        onProjectUnlinked={handleProjectUnlinked}
      />
    </div>
  );
}

/* ── Kanban column (droppable) ────────────────────────────────────────── */

function KanbanColumn({
  col,
  cards,
  contacts,
  projects,
  activeId,
  cardBg,
  cardBgFocused,
  cardBorder,
  cardBorderFocused,
  onCardClick,
}: {
  col: typeof PIPELINE_COLUMNS[number];
  cards: ClientRow[];
  contacts: ContactRow[];
  projects: ClientProject[];
  activeId: string | null;
  cardBg: string;
  cardBgFocused: string;
  cardBorder: string;
  cardBorderFocused: string;
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.value });

  return (
    <div
      className={`flex flex-col w-[220px] flex-shrink-0 h-full rounded-xl border transition-colors ${col.accent} ${
        isOver ? col.overColor : 'bg-white/[0.02]'
      }`}
    >
      {/* Column header */}
      <div className={`px-3 py-2.5 border-b flex items-center justify-between ${col.accent}`}>
        <span className={`text-xs font-semibold ${col.headerColor}`}>{col.label}</span>
        <span className="text-[10px] text-muted-foreground/30 bg-white/5 rounded px-1.5 py-0.5">
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto admin-scrollbar p-2 space-y-2 min-h-[60px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((c) => (
            <SortableLeadCard
              key={c.id}
              company={c}
              contacts={contacts}
              projects={projects}
              isFocused={activeId === c.id}
              isOverlay={false}
              cardBg={cardBg}
              cardBgFocused={cardBgFocused}
              cardBorder={cardBorder}
              cardBorderFocused={cardBorderFocused}
              onClick={() => onCardClick(c.id)}
            />
          ))}
        </SortableContext>
      </div>

    </div>
  );
}

/* ── Lost zone (droppable column, below Won) ─────────────────────────── */

function LostZone({
  animatingCard,
  lostLeads,
  showLost,
  onToggle,
  onRestore,
}: {
  animatingCard: ClientRow | null;
  lostLeads: ClientRow[];
  showLost: boolean;
  onToggle: () => void;
  onRestore: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'lost' });

  return (
    <div className={`flex flex-col flex-shrink-0 rounded-xl border transition-colors border-red-900/30 ${
      isOver ? 'bg-red-500/[0.08]' : 'bg-white/[0.02]'
    }`}>
      {/* Header — is both the drop zone and the expand toggle */}
      <div
        ref={setNodeRef}
        onClick={lostLeads.length > 0 ? onToggle : undefined}
        className={`px-3 py-2.5 flex items-center justify-between ${lostLeads.length > 0 ? 'cursor-pointer' : ''}`}
      >
        <span className="text-xs font-semibold text-red-500/60">Lost</span>
        <span className={`text-[10px] rounded px-1.5 py-0.5 ${
          lostLeads.length > 0
            ? 'text-red-400/70 bg-red-500/10'
            : 'text-muted-foreground/30 bg-white/5'
        }`}>
          {lostLeads.length}
        </span>
      </div>

      {/* Inline animation when a card is dropped */}
      {animatingCard && (
        <div className="px-2 pb-2 -mt-1">
          <div className="card-remove p-[1px] rounded-xl bg-red-900/40">
            <div className="rounded-[11px] px-3 py-2 flex items-center gap-2.5" style={{ backgroundColor: '#1a0808' }}>
              {animatingCard.logo_url ? (
                <img src={animatingCard.logo_url} alt="" className="w-6 h-6 rounded-md object-contain flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <Building2 size={10} className="text-muted-foreground/20" />
                </div>
              )}
              <p className="text-xs font-medium text-foreground/60 truncate">{animatingCard.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded lost leads — draggable back to any column */}
      {showLost && lostLeads.length > 0 && (
        <div className="border-t border-red-900/20 p-2 space-y-1.5 max-h-[260px] overflow-y-auto admin-scrollbar">
          {lostLeads.map((c) => (
            <DraggableLostCard key={c.id} company={c} onRestore={onRestore} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableLostCard({ company: c, onRestore }: { company: ClientRow; onRestore: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: c.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-[1px] rounded-xl bg-red-900/20 group cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="rounded-[11px] px-2.5 py-2 flex items-center gap-2 bg-[#120808]">
        {c.logo_url ? (
          <img src={c.logo_url} alt="" className="w-6 h-6 rounded-md object-contain flex-shrink-0 opacity-50" />
        ) : (
          <div className="w-6 h-6 rounded-md bg-white/[0.03] flex items-center justify-center flex-shrink-0">
            <Building2 size={10} className="text-muted-foreground/20" />
          </div>
        )}
        <p className="text-[11px] text-red-200/40 truncate flex-1">{c.name}</p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRestore(c.id); }}
          title="Restore to New Lead"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-white/70 flex-shrink-0"
        >
          <RotateCcw size={11} />
        </button>
      </div>
    </div>
  );
}

/* ── Lead card (sortable) ─────────────────────────────────────────────── */

type SortableRef = (node: HTMLElement | null) => void;

function SortableLeadCard(props: Omit<React.ComponentProps<typeof LeadCard>, 'sortableRef' | 'sortableListeners' | 'sortableAttributes' | 'sortableStyle' | 'isDragging'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.company.id });

  return (
    <LeadCard
      {...props}
      isDragging={isDragging}
      sortableRef={setNodeRef}
      sortableListeners={listeners}
      sortableAttributes={attributes}
      sortableStyle={{ transform: CSS.Transform.toString(transform), transition: transition ?? undefined }}
    />
  );
}

function LeadCard({
  company: c,
  contacts,
  projects,
  isFocused,
  isDragging,
  isOverlay,
  isRemoving = false,
  cardBg = '#0e0e0e',
  cardBgFocused = '#141414',
  cardBorder = 'bg-white/[0.08]',
  cardBorderFocused = 'bg-white/20',
  onClick,
  sortableRef,
  sortableListeners,
  sortableAttributes,
  sortableStyle,
}: {
  company: ClientRow;
  contacts: ContactRow[];
  projects: ClientProject[];
  isFocused: boolean;
  isDragging: boolean;
  isOverlay: boolean;
  isRemoving?: boolean;
  cardBg?: string;
  cardBgFocused?: string;
  cardBorder?: string;
  cardBorderFocused?: string;
  onClick: () => void;
  sortableRef?: SortableRef;
  sortableListeners?: React.HTMLAttributes<HTMLDivElement>;
  sortableAttributes?: React.HTMLAttributes<HTMLDivElement>;
  sortableStyle?: React.CSSProperties;
}) {
  const contactCount = contacts.filter((ct) => ct.client_id === c.id).length;
  const projectCount = projects.filter((p) => p.client_id === c.id).length;
  const statusCfg = STATUS_CONFIG[(c.status ?? 'prospect') as CompanyStatus] ?? STATUS_CONFIG['prospect'];

  return (
    <div
      ref={sortableRef}
      data-lead-card
      style={sortableStyle}
      {...sortableListeners}
      {...sortableAttributes}
      onClick={onClick}
      className={`p-[1px] rounded-xl transition-all select-none ${
        isRemoving ? 'card-remove' : isDragging ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'
      } ${isOverlay ? 'shadow-2xl rotate-1 scale-[1.02]' : ''} ${isFocused && !isDragging ? cardBorderFocused : cardBorder}`}
    >
      <div
        className="rounded-[11px] px-3 py-2.5 flex items-center gap-2.5 transition-colors"
        style={{ backgroundColor: isFocused && !isDragging ? cardBgFocused : cardBg }}
      >
        {c.logo_url ? (
          <img src={c.logo_url} alt="" className="w-7 h-7 rounded-md object-contain flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <Building2 size={12} className="text-muted-foreground/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
          <p className="text-[10px] mt-0.5 flex items-center gap-1 truncate">
            <span className={statusCfg.color}>{statusCfg.label}</span>
            {(contactCount > 0 || projectCount > 0) && (
              <>
                <span className="text-muted-foreground/25">·</span>
                <span className="text-muted-foreground/40">
                  {[
                    contactCount > 0 && `${contactCount}c`,
                    projectCount > 0 && `${projectCount}p`,
                  ].filter(Boolean).join(' ')}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
