import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'FNA.wtf • Privacy',
  description: 'How Friends \'n Allies collects, uses, and protects your information.',
};

const sections = [
  {
    heading: 'Information We Collect',
    content: (
      <>
        <p>When you visit our site, we automatically collect certain information through analytics tools, including:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li>Pages visited, time spent, and general browsing behavior</li>
          <li>Device type, browser, operating system, and screen resolution</li>
          <li>Approximate geographic location (country/region level)</li>
          <li>Referring website or search terms that brought you here</li>
        </ul>
        <p className="mt-4">
          If you contact us through a form on this site, we also collect the information you
          provide — such as your name, email address, and message content.
        </p>
      </>
    ),
  },
  {
    heading: 'Session Tracking',
    content: (
      <p>
        We may record anonymized browsing sessions to understand how visitors interact with our
        site. These recordings capture mouse movements, clicks, and scrolling behavior.
        Personal information entered into forms is automatically masked and not included in
        recordings.
      </p>
    ),
  },
  {
    heading: 'How We Use Your Information',
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li>Improve the design, content, and functionality of our site</li>
          <li>Understand how visitors navigate and use our pages</li>
          <li>Respond to inquiries and communicate with potential clients</li>
          <li>Identify and fix technical issues</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Cookies & Tracking',
    content: (
      <p>
        Our site uses first-party cookies for analytics purposes. These cookies help us
        recognize returning visitors and understand usage patterns. We do not use third-party
        advertising cookies or sell data to advertisers.
      </p>
    ),
  },
  {
    heading: 'Data Sharing',
    content: (
      <p>
        We do not sell, rent, or trade your personal information. We use third-party analytics
        services that process data on our behalf to help us understand site usage. These
        services are contractually obligated to protect your data and use it only for the
        purposes we specify.
      </p>
    ),
  },
  {
    heading: 'Data Retention',
    content: (
      <p>
        Analytics data is retained for a reasonable period to identify trends and improve our
        site. Contact form submissions are retained as long as necessary to respond to your
        inquiry and maintain our business records.
      </p>
    ),
  },
  {
    heading: 'Your Rights',
    content: (
      <p>
        You may request access to, correction of, or deletion of your personal information at
        any time. To make a request, contact us using the information below. We will respond
        within a reasonable timeframe.
      </p>
    ),
  },
  {
    heading: 'Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this
        page with an updated effective date. Continued use of our site after changes are posted
        constitutes acceptance of the revised policy.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    content: (
      <p>
        If you have questions about this Privacy Policy or your personal data, contact us at{' '}
        <a href="mailto:hi@fna.wtf" className="underline hover:no-underline text-foreground/80 hover:text-foreground transition-colors">
          hi@fna.wtf
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero
        label="Legal"
        title="Privacy Policy"
        subCopy="How we collect, use, and protect your information."
      />

      <section className="py-16 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-12">
            Last updated: March 3, 2026
          </p>

          <div className="space-y-12">
            {sections.map((section, i) => (
              <Reveal key={i} distance="2em">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {section.heading}
                  </h2>
                  <div className="text-base text-foreground/80 leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FooterCTA />
    </div>
  );
}
