import type { StatusConfig } from './StatusBadge';

/** Company / client statuses */
export const COMPANY_STATUSES: Record<string, StatusConfig> = {
  active:   { label: 'Active',   className: 'bg-admin-success-bg text-admin-success' },
  prospect: { label: 'Prospect', className: 'bg-admin-warning-bg text-admin-warning' },
  past:     { label: 'Past',     className: 'bg-admin-bg-active text-admin-text-secondary' },
  inactive: { label: 'Inactive', className: 'bg-admin-bg-active text-admin-text-dim' },
  lead:     { label: 'Lead',     className: 'bg-admin-info-bg text-admin-info' },
};

/** Contact type badges */
export const CONTACT_TYPES: Record<string, StatusConfig> = {
  crew:    { label: 'Crew',    className: 'bg-admin-info-bg text-admin-info border border-admin-info-border' },
  cast:    { label: 'Cast',    className: 'bg-admin-warning-bg text-admin-warning border border-admin-warning-border' },
  contact: { label: 'Contact', className: 'bg-admin-bg-active text-admin-text-secondary border border-admin-border' },
  staff:   { label: 'Staff',   className: 'bg-admin-success-bg text-admin-success border border-admin-success-border' },
  partner: { label: 'Partner', className: 'bg-[var(--admin-accent-bg)] text-[var(--admin-accent)] border border-[var(--admin-accent-border)]' },
};

/** Proposal statuses */
export const PROPOSAL_STATUSES: Record<string, StatusConfig> = {
  draft:    { label: 'Draft',    className: 'bg-admin-bg-active text-admin-text-secondary' },
  sent:     { label: 'Sent',     className: 'bg-admin-info-bg text-admin-info' },
  viewed:   { label: 'Viewed',   className: 'bg-admin-warning-bg text-admin-warning' },
  accepted: { label: 'Accepted', className: 'bg-admin-success-bg text-admin-success' },
  declined: { label: 'Declined', className: 'bg-admin-danger-bg text-admin-danger' },
};

/** Script statuses */
export const SCRIPT_STATUSES: Record<string, StatusConfig> = {
  draft:  { label: 'Draft',  className: 'bg-admin-bg-active text-admin-text-secondary' },
  review: { label: 'Review', className: 'bg-admin-info-bg text-admin-info' },
  locked: { label: 'Locked', className: 'bg-admin-success-bg text-admin-success' },
};

/** Meeting statuses */
export const MEETING_STATUSES: Record<string, StatusConfig> = {
  upcoming:       { label: 'Upcoming',      className: 'bg-admin-info-bg text-admin-info' },
  bot_scheduled:  { label: 'Bot Scheduled', className: 'bg-admin-info-bg text-admin-info' },
  in_progress:    { label: 'In Progress',   className: 'bg-admin-success-bg text-admin-success' },
  completed:      { label: 'Completed',     className: 'bg-admin-success-bg text-admin-success' },
  failed:         { label: 'Failed',        className: 'bg-admin-danger-bg text-admin-danger' },
  no_video_link:  { label: 'No Video',      className: 'bg-admin-bg-active text-admin-text-dim' },
  cancelled:      { label: 'Cancelled',     className: 'bg-admin-bg-active text-admin-text-dim' },
};

/** Intake submission statuses */
export const INTAKE_STATUSES: Record<string, StatusConfig> = {
  new:       { label: 'New',       className: 'bg-admin-info-bg text-admin-info' },
  reviewed:  { label: 'Reviewed',  className: 'bg-admin-warning-bg text-admin-warning' },
  converted: { label: 'Converted', className: 'bg-admin-success-bg text-admin-success' },
  archived:  { label: 'Archived',  className: 'bg-admin-bg-active text-admin-text-dim' },
};

/** Contract statuses */
export const CONTRACT_STATUSES: Record<string, StatusConfig> = {
  draft:          { label: 'Draft',   className: 'bg-admin-bg-active text-admin-text-dim' },
  pending_review: { label: 'Review',  className: 'bg-admin-warning-bg text-admin-warning' },
  sent:           { label: 'Sent',    className: 'bg-admin-info-bg text-admin-info' },
  viewed:         { label: 'Viewed',  className: 'bg-admin-info-bg text-admin-info' },
  signed:         { label: 'Signed',  className: 'bg-admin-success-bg text-admin-success' },
  declined:       { label: 'Declined', className: 'bg-admin-danger-bg text-admin-danger' },
  expired:        { label: 'Expired',  className: 'bg-admin-danger-bg text-admin-danger' },
  voided:         { label: 'Voided',   className: 'bg-admin-bg-active text-admin-text-ghost' },
};

/** Project visibility statuses */
export const PROJECT_STATUSES: Record<string, StatusConfig> = {
  published: { label: 'Published', className: 'bg-admin-success-bg text-admin-success' },
  hidden:    { label: 'Hidden',    className: 'bg-admin-danger-bg text-admin-danger' },
  featured:  { label: 'Featured',  className: 'bg-admin-warning-bg text-admin-warning' },
  draft:     { label: 'Draft',     className: 'bg-admin-bg-active text-admin-text-dim' },
};
