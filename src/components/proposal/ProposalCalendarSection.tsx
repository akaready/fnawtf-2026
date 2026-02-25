'use client';

import { CalBookingButton } from '@/components/cal/CalBookingButton';

export function ProposalCalendarSection() {
  return (
    <section
      className="py-16 px-6 rounded-2xl border border-border"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-lg text-white/50 max-w-lg mx-auto leading-relaxed">
            Book a call to discuss this proposal, ask questions, and outline next steps.
          </p>
        </div>

        <CalBookingButton
          buttonText="Schedule a Call"
          variant="default"
          size="lg"
          calLink="fnawtf/introduction"
          namespace="proposal-call"
          config={{
            layout: 'month_view',
            theme: 'dark',
            hideEventTypeDetails: true,
            useSlotsViewOnSmallScreen: true,
          }}
        />
      </div>
    </section>
  );
}
