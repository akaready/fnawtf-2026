'use client';

export function StatusSection() {
  return (
    <section id="status" className="space-y-8">
      <h2 className="text-admin-2xl font-admin-display font-bold tracking-tight text-admin-text-primary">Status & Badges</h2>

      {/* Status Badges */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Status Badges</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-success-bg text-admin-success border border-admin-success-border">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-warning-bg text-admin-warning border border-admin-warning-border">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Prospect
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-danger-bg text-admin-danger border border-admin-danger-border">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Overdue
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-info-bg text-admin-info border border-admin-info-border">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> In Progress
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-bg-hover text-admin-text-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Inactive
          </span>
        </div>
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

      {/* Company Type Badges */}
      <div>
        <h3 className="text-admin-lg font-semibold text-admin-text-secondary mb-3">Company Type</h3>
        <div className="flex flex-wrap gap-3 p-6 border border-admin-border rounded-xl bg-admin-bg-inset">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-admin-success-bg text-admin-success border border-admin-success-border">Client</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-admin-warning-bg text-admin-warning border border-admin-warning-border">Lead</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-admin-info-bg text-admin-info border border-admin-info-border">Partner</span>
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
