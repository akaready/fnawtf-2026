import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { Reveal } from '@/components/animations/Reveal';

export const metadata: Metadata = {
  title: 'Terms of Service - FNA.WTF',
  description: 'Terms and conditions for using the Friends \'n Allies website.',
};

const sections = [
  {
    heading: 'Acceptance of Terms',
    content: (
      <p>
        By accessing and using this website (fna.wtf), you accept and agree to be bound by
        these Terms of Service. If you do not agree with any part of these terms, you should
        not use this site.
      </p>
    ),
  },
  {
    heading: 'Use of This Site',
    content: (
      <>
        <p>You agree to use this site only for lawful purposes and in a manner that does not:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li>Infringe on the rights of others</li>
          <li>Restrict or inhibit anyone else from using the site</li>
          <li>Attempt to gain unauthorized access to any part of the site or its systems</li>
          <li>Introduce viruses, malware, or other harmful material</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Intellectual Property',
    content: (
      <p>
        All content on this site — including text, images, graphics, video, audio, designs,
        logos, and code — is the property of Pictureshow.co LLC, DBA Friends &apos;n Allies or its content
        creators and is protected by copyright and intellectual property laws. You may not
        reproduce, distribute, or create derivative works from any content on this site
        without prior written permission.
      </p>
    ),
  },
  {
    heading: 'User Submissions',
    content: (
      <p>
        Any information you submit through forms on this site (such as contact forms or
        project inquiries) is subject to our{' '}
        <a href="/privacy" className="underline text-foreground/80 hover:text-foreground transition-colors">
          Privacy Policy
        </a>
        . By submitting information, you represent that it is accurate and that you have the
        right to provide it.
      </p>
    ),
  },
  {
    heading: 'Third-Party Links',
    content: (
      <p>
        This site may contain links to third-party websites. We are not responsible for the
        content, privacy practices, or availability of those sites. Visiting third-party links
        is at your own risk.
      </p>
    ),
  },
  {
    heading: 'Disclaimer of Warranties',
    content: (
      <p>
        This site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
        warranties of any kind, either express or implied. We do not guarantee that the site
        will be uninterrupted, error-free, or free of harmful components.
      </p>
    ),
  },
  {
    heading: 'Limitation of Liability',
    content: (
      <p>
        To the fullest extent permitted by law, Pictureshow.co LLC, DBA Friends &apos;n Allies shall not be liable
        for any indirect, incidental, special, consequential, or punitive damages arising from
        your use of this site, even if we have been advised of the possibility of such damages.
      </p>
    ),
  },
  {
    heading: 'Governing Law',
    content: (
      <p>
        These terms are governed by and construed in accordance with the laws of the State of
        California. Any disputes arising from these terms or your use of this site shall be
        subject to the exclusive jurisdiction of the courts in California.
      </p>
    ),
  },
  {
    heading: 'Changes to These Terms',
    content: (
      <p>
        We reserve the right to update these Terms of Service at any time. Changes will be
        posted on this page with an updated effective date. Your continued use of the site
        after changes are posted constitutes acceptance of the revised terms.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    content: (
      <p>
        If you have questions about these Terms of Service, contact us at{' '}
        <a href="mailto:hi@fna.wtf" className="underline text-foreground/80 hover:text-foreground transition-colors">
          hi@fna.wtf
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero
        label="Legal"
        title="Terms of Service"
        subCopy="The rules of the road."
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
