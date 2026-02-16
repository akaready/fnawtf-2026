import { NavButton } from './NavButton';
import { CalBookingButton } from '@/components/cal/CalBookingButton';

export async function FooterCTA() {
  return (
    <section className="py-16 px-6 border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto text-center space-y-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            Like what you see?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Snag some time on our calendar and let's chat about your project.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <CalBookingButton
            buttonText="Schedule a Call"
            namespace="introduction"
            calLink="fnawtf/introduction"
          />
          <NavButton href="/services" iconName="clipboard-list">
            Explore Services
          </NavButton>
        </div>
      </div>
    </section>
  );
}
