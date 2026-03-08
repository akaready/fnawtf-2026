'use client';

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { X, ExternalLink, Check, ChevronDown, Save, MapPin, UserCheck, Users, Clapperboard, Truck, FileText, ClipboardList, Eye, EyeOff, Copy, Megaphone } from 'lucide-react';
import { PanelDrawer } from '@/app/admin/_components/PanelDrawer';
import { SaveDot } from '@/app/admin/_components/SaveDot';
import { useAutoSave } from '@/app/admin/_hooks/useAutoSave';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import { DiscardChangesDialog } from '@/app/admin/_components/DiscardChangesDialog';
import type { CallSheetWithRelations, CallSheetListRow } from '@/types/callsheet-admin';
import type { ContactRow } from '@/types/proposal';
import type { ClientRow } from '../../actions';
import { PersonPanel } from '@/app/admin/_components/PersonPanel';
import { getCallSheet, updateCallSheet, deleteCallSheet, getClients, updateContact, deleteContact } from '../../actions';
import { createClient } from '@/lib/supabase/client';
import { DetailsTab } from './tabs/DetailsTab';
import { LocationsTab } from './tabs/LocationsTab';
import { CastTab } from './tabs/CastTab';
import { CrewTab } from './tabs/CrewTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { VendorsTab } from './tabs/VendorsTab';
import { DeptNotesTab } from './tabs/DeptNotesTab';
import { AnnouncementsTab } from './tabs/AnnouncementsTab';

type VisKey = 'vendorsVisible' | 'deptNotesVisible';

const TABS: { value: string; label: string; Icon: React.ElementType; visKey?: VisKey }[] = [
  { value: 'details', label: 'Details', Icon: ClipboardList },
  { value: 'announcements', label: 'Announcements', Icon: Megaphone },
  { value: 'locations', label: 'Locations', Icon: MapPin },
  { value: 'cast', label: 'Cast', Icon: UserCheck },
  { value: 'crew', label: 'Crew', Icon: Users },
  { value: 'schedule', label: 'Schedule', Icon: Clapperboard },
  { value: 'vendors', label: 'Vendors', Icon: Truck, visKey: 'vendorsVisible' },
  { value: 'dept-notes', label: 'Notes', Icon: FileText, visKey: 'deptNotesVisible' },
];

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-admin-bg-active text-admin-text-dim',
  published: 'bg-admin-success-bg text-admin-success',
};

interface Props {
  callSheetId: string | null;
  projectId?: string;
  open: boolean;
  onClose: () => void;
  onSaved: (cs: Partial<CallSheetListRow> & { id: string }) => void;
  onDeleted: (id: string) => void;
}

export function CallSheetPanel({ callSheetId, projectId, open, onClose, onSaved, onDeleted }: Props) {
  const [data, setData] = useState<CallSheetWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // PersonPanel state for opening contact cards
  const [viewContact, setViewContact] = useState<ContactRow | null>(null);
  const [companies, setCompanies] = useState<ClientRow[]>([]);

  // Core fields tracked for auto-save
  const [date, setDate] = useState('');
  const [shootDay, setShootDay] = useState(1);
  const [totalDays, setTotalDays] = useState(1);
  const [generalCallTime, setGeneralCallTime] = useState('8:00 AM');
  const [crewCall, setCrewCall] = useState('');
  const [talentCall, setTalentCall] = useState('');
  const [shootingCall, setShootingCall] = useState('');
  const [lunchTime, setLunchTime] = useState('');
  const [estimatedWrap, setEstimatedWrap] = useState('');
  const [doordashEnabled, setDoordashEnabled] = useState(false);
  const [doordashLink, setDoordashLink] = useState('');
  const [setContact, setSetContact] = useState<string | null>(null);
  const [projectIdState, setProjectIdState] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [vendorsVisible, setVendorsVisible] = useState(true);
  const [deptNotesVisible, setDeptNotesVisible] = useState(true);
  const [status, setStatus] = useState<string>('draft');

  const stateRef = useRef({
    date, shootDay, totalDays, generalCallTime, crewCall, talentCall,
    shootingCall, lunchTime, estimatedWrap, doordashEnabled, doordashLink,
    setContact, projectId: projectIdState, scriptId,
    hospitalName, hospitalAddress, hospitalPhone,
    vendorsVisible, deptNotesVisible, status,
  });

  useEffect(() => {
    stateRef.current = {
      date, shootDay, totalDays, generalCallTime, crewCall, talentCall,
      shootingCall, lunchTime, estimatedWrap, doordashEnabled, doordashLink,
      setContact, projectId: projectIdState, scriptId,
      hospitalName, hospitalAddress, hospitalPhone,
      vendorsVisible, deptNotesVisible, status,
    };
  });

  const autoSave = useAutoSave(async () => {
    if (!callSheetId) return;
    const s = stateRef.current;
    await updateCallSheet(callSheetId, {
      date: s.date,
      shoot_day: s.shootDay,
      total_days: s.totalDays,
      general_call_time: s.generalCallTime,
      crew_call: s.crewCall || null,
      talent_call: s.talentCall || null,
      shooting_call: s.shootingCall || null,
      lunch_time: s.lunchTime || null,
      estimated_wrap: s.estimatedWrap || null,
      doordash_enabled: s.doordashEnabled,
      doordash_link: s.doordashLink || null,
      set_contact: s.setContact || null,
      project_id: s.projectId || null,
      script_id: s.scriptId || null,
      hospital_name: s.hospitalName || null,
      hospital_address: s.hospitalAddress || null,
      hospital_phone: s.hospitalPhone || null,
      vendors_visible: s.vendorsVisible,
      dept_notes_visible: s.deptNotesVisible,
      status: s.status,
    });
    onSaved({
      id: callSheetId,
      date: s.date,
      shoot_day: s.shootDay,
      total_days: s.totalDays,
      general_call_time: s.generalCallTime,
      status: s.status as 'draft' | 'published',
      project_id: s.projectId,
    });
  });

  const trigger = autoSave.trigger;

  // Load data
  useEffect(() => {
    if (!open || !callSheetId) return;
    setLoading(true);
    getCallSheet(callSheetId).then((cs) => {
      setData(cs as CallSheetWithRelations);
      setDate(cs.date);
      setShootDay(cs.shoot_day);
      setTotalDays(cs.total_days);
      setGeneralCallTime(cs.general_call_time);
      setCrewCall(cs.crew_call ?? '');
      setTalentCall(cs.talent_call ?? '');
      setShootingCall(cs.shooting_call ?? '');
      setLunchTime(cs.lunch_time ?? '');
      setEstimatedWrap(cs.estimated_wrap ?? '');
      setDoordashEnabled(cs.doordash_enabled);
      setDoordashLink(cs.doordash_link ?? '');
      setSetContact(cs.set_contact);
      setProjectIdState(cs.project_id ?? projectId ?? null);
      setScriptId(cs.script_id);
      setHospitalName(cs.hospital_name ?? '');
      setHospitalAddress(cs.hospital_address ?? '');
      setHospitalPhone(cs.hospital_phone ?? '');
      setVendorsVisible(cs.vendors_visible);
      setDeptNotesVisible(cs.dept_notes_visible);
      setStatus(cs.status);
      autoSave.reset();
      setLoading(false);
    });
  }, [open, callSheetId]);

  const handleClose = useCallback(() => {
    if (autoSave.hasPending) {
      setConfirmDiscard(true);
    } else {
      setActiveTab('details');
      onClose();
    }
  }, [autoSave.hasPending, onClose]);

  const handleDelete = useCallback(async () => {
    if (!callSheetId) return;
    await deleteCallSheet(callSheetId);
    onDeleted(callSheetId);
  }, [callSheetId, onDeleted]);

  async function reload() {
    if (!callSheetId) return;
    const cs = await getCallSheet(callSheetId);
    setData(cs as CallSheetWithRelations);
  }

  // Open a contact's PersonPanel
  async function handleOpenContact(contactId: string) {
    const supabase = createClient();
    const [{ data: contact }, companiesData] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      companies.length > 0 ? Promise.resolve(companies) : getClients(),
    ]);
    if (!contact) return;
    if (companies.length === 0) setCompanies(companiesData as ClientRow[]);
    setViewContact(contact as unknown as ContactRow);
  }

  // Visibility toggle for sections (vendors, dept notes)
  function handleVisibilityToggle(key: VisKey) {
    if (key === 'vendorsVisible') {
      setVendorsVisible(!vendorsVisible);
    } else {
      setDeptNotesVisible(!deptNotesVisible);
    }
    trigger();
  }

  function isSectionHidden(key: VisKey) {
    return key === 'vendorsVisible' ? !vendorsVisible : !deptNotesVisible;
  }

  const slug = data?.slug;

  function copyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/cs/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setStatusOpen(false);
    trigger();
  }

  const title = data?.project_title
    ? `${data.project_title} — Day ${shootDay}`
    : `Call Sheet — Day ${shootDay}`;

  return (
    <>
      <PanelDrawer open={open} onClose={handleClose} width="w-[920px]">
        <div className="flex flex-col h-full">
          {/* Header: title + slug (left) | SaveDot + status badge + X (right) */}
          <div className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-admin-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
                {slug && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-sm text-admin-text-muted font-mono truncate">
                      /cs/{slug}
                    </p>
                    <button
                      onClick={copyLink}
                      title="Copy link"
                      className="p-1 rounded-md text-admin-text-faint hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors flex-shrink-0"
                    >
                      {copiedLink ? <Check size={13} className="text-admin-success" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5">
                <SaveDot status={autoSave.status} />
                <span className={`px-4 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_BADGE[status] ?? STATUS_BADGE.draft}`}>
                  {status}
                </span>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Tab strip with icons + Eye/EyeOff visibility toggle */}
          <div className="flex-shrink-0 flex items-center gap-1 px-6 h-[3rem] border-b border-admin-border bg-admin-bg-wash overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
              const hidden = tab.visKey ? isSectionHidden(tab.visKey) : false;
              return (
                <Fragment key={tab.value}>
                  <button
                    onClick={() => setActiveTab(tab.value)}
                    className={`relative flex items-center gap-1.5 px-[15px] py-[7px] rounded-lg text-sm font-medium transition-colors border whitespace-nowrap ${
                      activeTab === tab.value
                        ? 'bg-admin-bg-active text-admin-text-primary border-transparent'
                        : 'text-admin-text-dim hover:text-admin-text-secondary hover:bg-admin-bg-hover border-transparent'
                    } ${hidden ? 'opacity-30' : ''}`}
                  >
                    {tab.visKey ? (
                      <span
                        className="group/ico flex-shrink-0 relative w-[13px] h-[13px]"
                        onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(tab.visKey!); }}
                      >
                        <span className="absolute inset-0 group-hover/ico:hidden">
                          <tab.Icon size={13} />
                        </span>
                        <span className="absolute inset-0 hidden group-hover/ico:block">
                          {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        </span>
                      </span>
                    ) : (
                      <tab.Icon size={13} className="flex-shrink-0" />
                    )}
                    {tab.label}
                  </button>
                </Fragment>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-admin-text-muted">Loading...</div>
            ) : (
              <>
                {activeTab === 'details' && (
                  <DetailsTab
                    date={date} setDate={(v) => { setDate(v); trigger(); }}
                    shootDay={shootDay} setShootDay={(v) => { setShootDay(v); trigger(); }}
                    totalDays={totalDays} setTotalDays={(v) => { setTotalDays(v); trigger(); }}
                    generalCallTime={generalCallTime} setGeneralCallTime={(v) => { setGeneralCallTime(v); trigger(); }}
                    crewCall={crewCall} setCrewCall={(v) => { setCrewCall(v); trigger(); }}
                    talentCall={talentCall} setTalentCall={(v) => { setTalentCall(v); trigger(); }}
                    shootingCall={shootingCall} setShootingCall={(v) => { setShootingCall(v); trigger(); }}
                    lunchTime={lunchTime} setLunchTime={(v) => { setLunchTime(v); trigger(); }}
                    estimatedWrap={estimatedWrap} setEstimatedWrap={(v) => { setEstimatedWrap(v); trigger(); }}
                    doordashEnabled={doordashEnabled} setDoordashEnabled={(v) => { setDoordashEnabled(v); trigger(); }}
                    doordashLink={doordashLink} setDoordashLink={(v) => { setDoordashLink(v); trigger(); }}
                    setContact={setContact} setSetContact={(v) => { setSetContact(v); trigger(); }}
                    projectId={projectIdState} setProjectId={(v) => { setProjectIdState(v); trigger(); }}
                    scriptId={scriptId} setScriptId={(v) => { setScriptId(v); trigger(); }}
                  />
                )}
                {activeTab === 'announcements' && (
                  <AnnouncementsTab
                    bulletins={data?.bulletins ?? []}
                    callSheetId={callSheetId}
                    onChanged={reload}
                  />
                )}
                {activeTab === 'locations' && (
                  <LocationsTab
                    csLocations={data?.locations ?? []}
                    hospitalName={hospitalName} setHospitalName={(v) => { setHospitalName(v); trigger(); }}
                    hospitalAddress={hospitalAddress} setHospitalAddress={(v) => { setHospitalAddress(v); trigger(); }}
                    hospitalPhone={hospitalPhone} setHospitalPhone={(v) => { setHospitalPhone(v); trigger(); }}
                    locationImages={data?.location_images ?? []}
                    callSheetId={callSheetId}
                    onChanged={reload}
                    onImagesChanged={reload}
                  />
                )}
                {activeTab === 'cast' && (
                  <CastTab
                    cast={data?.cast ?? []}
                    callSheetId={callSheetId}
                    onChanged={reload}
                    onOpenContact={handleOpenContact}
                  />
                )}
                {activeTab === 'crew' && (
                  <CrewTab
                    crew={data?.crew ?? []}
                    callSheetId={callSheetId}
                    onChanged={reload}
                    onOpenContact={handleOpenContact}
                  />
                )}
                {activeTab === 'schedule' && (
                  <ScheduleTab
                    scenes={data?.scenes ?? []}
                    callSheetId={callSheetId}
                    scriptId={scriptId}
                    onChanged={reload}
                  />
                )}
                {activeTab === 'vendors' && (
                  <VendorsTab
                    vendors={data?.vendors ?? []}
                    callSheetId={callSheetId}
                    onChanged={reload}
                  />
                )}
                {activeTab === 'dept-notes' && (
                  <DeptNotesTab
                    deptNotes={data?.dept_notes ?? []}
                    callSheetId={callSheetId}
                    onChanged={reload}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer: Save + Status (left) | View + Delete (right) */}
          <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-admin-border bg-admin-bg-wash">
            <div className="flex items-center gap-3">
              <button
                onClick={() => void autoSave.flush()}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <Save size={14} />
                Save
              </button>
              {/* Status toggle — Draft / Published */}
              <div ref={statusRef} className="relative">

                <button
                  type="button"
                  onClick={() => setStatusOpen((o) => !o)}
                  className={`${status === 'published' ? 'btn-success' : 'btn-secondary'} gap-1.5 px-4 py-2.5 text-sm font-medium`}
                >
                  {status === 'draft' ? 'Draft' : 'Published'}
                  <ChevronDown size={12} className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                    <div className="absolute bottom-full mb-1 left-0 min-w-[160px] bg-admin-bg-overlay border border-admin-border rounded-lg shadow-xl py-1 z-50">
                      <button
                        type="button"
                        onClick={() => handleStatusChange('published')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          status === 'published' ? 'text-admin-success bg-admin-success-bg/30' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-admin-success" />
                          Published
                        </span>
                        {status === 'published' && <Check size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange('draft')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          status === 'draft' ? 'text-admin-text-primary bg-admin-bg-active' : 'text-admin-text-muted hover:bg-admin-bg-hover'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-admin-text-faint" />
                          Draft
                        </span>
                        {status === 'draft' && <Check size={12} />}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {slug && (
                <a
                  href={`/cs/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-4 py-2.5 text-sm"
                >
                  <ExternalLink size={13} />
                  View
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              {callSheetId && (
                <TwoStateDeleteButton
                  itemId={callSheetId}
                  confirmId={confirmDeleteId}
                  onRequestConfirm={setConfirmDeleteId}
                  onConfirmDelete={async () => { await handleDelete(); setConfirmDeleteId(null); }}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              )}
            </div>
          </div>
        </div>
      </PanelDrawer>

      <DiscardChangesDialog
        open={confirmDiscard}
        onDiscard={() => {
          setConfirmDiscard(false);
          autoSave.reset();
          setActiveTab('details');
          onClose();
        }}
        onKeepEditing={() => setConfirmDiscard(false)}
      />

      {/* PersonPanel overlay for viewing contact cards */}
      <PersonPanel
        person={viewContact}
        open={!!viewContact}
        onClose={() => setViewContact(null)}
        companies={companies}
        level={2}
        onSave={async (row) => {
          await updateContact(row.id, row as unknown as Record<string, unknown>);
          setViewContact(null);
          reload();
        }}
        onDelete={async (id) => {
          await deleteContact(id);
          setViewContact(null);
          reload();
        }}
      />
    </>
  );
}
