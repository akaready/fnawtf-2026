'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminCombobox } from '@/app/admin/_components/AdminCombobox';
import { TwoStateDeleteButton } from '@/app/admin/_components/TwoStateDeleteButton';
import { getProjectList, getScriptList } from '../../../actions';
import { formatScriptVersion } from '@/types/scripts';

const SET_CONTACT_OPTIONS = [
  { id: 'ready', label: 'Ready (hi@fna.wtf / 512-555-0101)' },
  { id: 'richie', label: 'Richie (hi@fna.wtf / 512-555-0102)' },
];

interface Props {
  date: string;
  setDate: (v: string) => void;
  shootDay: number;
  setShootDay: (v: number) => void;
  totalDays: number;
  setTotalDays: (v: number) => void;
  generalCallTime: string;
  setGeneralCallTime: (v: string) => void;
  crewCall: string;
  setCrewCall: (v: string) => void;
  talentCall: string;
  setTalentCall: (v: string) => void;
  shootingCall: string;
  setShootingCall: (v: string) => void;
  lunchTime: string;
  setLunchTime: (v: string) => void;
  estimatedWrap: string;
  setEstimatedWrap: (v: string) => void;
  doordashEnabled: boolean;
  setDoordashEnabled: (v: boolean) => void;
  doordashLink: string;
  setDoordashLink: (v: string) => void;
  setContact: string | null;
  setSetContact: (v: string | null) => void;
  projectId: string | null;
  setProjectId: (v: string | null) => void;
  scriptId: string | null;
  setScriptId: (v: string | null) => void;
}

export function DetailsTab({
  date, setDate,
  shootDay, setShootDay,
  totalDays, setTotalDays,
  generalCallTime, setGeneralCallTime,
  crewCall, setCrewCall,
  talentCall, setTalentCall,
  shootingCall, setShootingCall,
  lunchTime, setLunchTime,
  estimatedWrap, setEstimatedWrap,
  doordashEnabled, setDoordashEnabled,
  doordashLink, setDoordashLink,
  setContact, setSetContact,
  projectId, setProjectId,
  scriptId, setScriptId,
}: Props) {
  const [projects, setProjects] = useState<{ id: string; label: string }[]>([]);
  const [scripts, setScripts] = useState<{ id: string; label: string; suffix?: string }[]>([]);
  const [confirmDeleteDoordash, setConfirmDeleteDoordash] = useState<string | null>(null);

  useEffect(() => {
    // Load projects and scripts for comboboxes
    Promise.all([getProjectList(), getScriptList()]).then(([projectList, scriptList]) => {
      setProjects(projectList.map((p) => ({ id: p.id, label: p.title })));
      setScripts(scriptList.map((s) => ({ id: s.id, label: s.title, suffix: `v${formatScriptVersion(s.major_version, s.minor_version, s.is_published)}` })));
    });
  }, []);

  return (
    <>
      {/* Project + Script */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="admin-label">Project</label>
          <AdminCombobox
            value={projectId}
            options={projects}
            onChange={setProjectId}
            placeholder="Select project..."
          />
        </div>
        <div>
          <label className="admin-label">Script</label>
          <AdminCombobox
            value={scriptId}
            options={scripts}
            onChange={setScriptId}
            placeholder="Select script..."
          />
        </div>
      </div>

      {/* Date + Day */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="admin-label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Day</label>
          <input
            type="number"
            min={1}
            value={shootDay}
            onChange={(e) => setShootDay(Math.max(1, parseInt(e.target.value) || 1))}
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">of Total</label>
          <input
            type="number"
            min={1}
            value={totalDays}
            onChange={(e) => setTotalDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="admin-input w-full"
          />
        </div>
      </div>

      {/* Schedule Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="admin-label">General Call</label>
          <input
            type="text"
            value={generalCallTime}
            onChange={(e) => setGeneralCallTime(e.target.value)}
            placeholder="8:00 AM"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Crew Call</label>
          <input
            type="text"
            value={crewCall}
            onChange={(e) => setCrewCall(e.target.value)}
            placeholder="7:30 AM"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Talent Call</label>
          <input
            type="text"
            value={talentCall}
            onChange={(e) => setTalentCall(e.target.value)}
            placeholder="8:30 AM"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Shooting Call</label>
          <input
            type="text"
            value={shootingCall}
            onChange={(e) => setShootingCall(e.target.value)}
            placeholder="9:00 AM"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Lunch</label>
          <input
            type="text"
            value={lunchTime}
            onChange={(e) => setLunchTime(e.target.value)}
            placeholder="12:00 PM"
            className="admin-input w-full"
          />
        </div>
        <div>
          <label className="admin-label">Est. Wrap</label>
          <input
            type="text"
            value={estimatedWrap}
            onChange={(e) => setEstimatedWrap(e.target.value)}
            placeholder="6:00 PM"
            className="admin-input w-full"
          />
        </div>
      </div>

      {/* Set Contact */}
      <div>
        <label className="admin-label">Set Contact</label>
        <AdminCombobox
          value={setContact}
          options={SET_CONTACT_OPTIONS}
          onChange={setSetContact}
          searchable={false}
          placeholder="Select set contact..."
        />
      </div>

      {/* DoorDash */}
      <div>
        {doordashEnabled ? (
          <>
            <label className="admin-label">DoorDash Lunch Order</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={doordashLink}
                onChange={(e) => setDoordashLink(e.target.value)}
                placeholder="https://www.doordash.com/..."
                className="admin-input w-full"
              />
              <TwoStateDeleteButton
                itemId="doordash"
                confirmId={confirmDeleteDoordash}
                onRequestConfirm={setConfirmDeleteDoordash}
                onConfirmDelete={() => { setDoordashEnabled(false); setDoordashLink(''); setConfirmDeleteDoordash(null); }}
                onCancel={() => setConfirmDeleteDoordash(null)}
                size={13}
              />
            </div>
          </>
        ) : (
          <button onClick={() => setDoordashEnabled(true)} className="btn-secondary w-full h-[2.375rem] inline-flex items-center justify-center gap-1.5 text-xs">
            <Plus size={13} />
            Add DoorDash Lunch Order
          </button>
        )}
      </div>
    </>
  );
}
