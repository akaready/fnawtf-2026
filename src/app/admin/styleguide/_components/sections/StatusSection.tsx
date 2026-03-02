'use client';

import { StatusBadge } from '../../../_components/StatusBadge';
import {
  COMPANY_STATUSES,
  CONTACT_TYPES,
  PROPOSAL_STATUSES,
  SCRIPT_STATUSES,
  MEETING_STATUSES,
  INTAKE_STATUSES,
  CONTRACT_STATUSES,
  PROJECT_STATUSES,
} from '../../../_components/statusConfigs';

export function StatusSection() {
  const families: { label: string; config: Record<string, { label: string; className: string }> }[] = [
    { label: 'Company Statuses', config: COMPANY_STATUSES },
    { label: 'Contact Types', config: CONTACT_TYPES },
    { label: 'Proposal Statuses', config: PROPOSAL_STATUSES },
    { label: 'Script Statuses', config: SCRIPT_STATUSES },
    { label: 'Meeting Statuses', config: MEETING_STATUSES },
    { label: 'Intake Statuses', config: INTAKE_STATUSES },
    { label: 'Contract Statuses', config: CONTRACT_STATUSES },
    { label: 'Project Statuses', config: PROJECT_STATUSES },
  ];

  return (
    <section id="status" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Status & Badges</h2>

      {/* All status badge families — rendered with actual StatusBadge component */}
      <div className="space-y-6">
        {families.map(({ label, config }) => (
          <div key={label}>
            <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">{label}</h3>
            <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
              {Object.keys(config).map((key) => (
                <StatusBadge key={key} status={key} config={config} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Badges */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Toggle Badges</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-admin-success-bg text-admin-success cursor-pointer">Yes</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-admin-bg-hover text-admin-text-faint cursor-pointer">No</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-admin-warning-bg text-admin-warning cursor-pointer">Pending</span>
        </div>
      </div>

      {/* Danger States */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Danger / Delete States</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <div className="px-4 py-3 rounded-lg bg-admin-danger-bg border border-admin-danger-border text-admin-danger text-sm">
            Are you sure you want to delete this item?
          </div>
          <button className="btn-danger px-4 py-2 text-sm">Confirm Delete</button>
        </div>
      </div>
    </section>
  );
}
