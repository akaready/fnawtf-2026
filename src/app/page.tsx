import { HeroSection } from '@/components/homepage/HeroSection';
import { ServicesMarquee } from '@/components/homepage/ServicesMarquee';
import { ServicesCards } from '@/components/homepage/ServicesCards';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { FeaturedWork } from '@/components/homepage/FeaturedWork';
import { ClientLogos } from '@/components/homepage/ClientLogos';
import { TestimonialsServer } from '@/components/homepage/TestimonialsServer';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { getPageSeo } from '@/lib/seo';

export async function generateMetadata() {
  return getPageSeo('/', {
    title: 'FNA.WTF - Video Production & Digital Storytelling',
    description: 'Friends n Allies is a boutique creative agency crafting visual stories for ambitious brands.',
  });
}

export default function Home() {
  // Hero background video (MP4) — landing loop in main videos library
  const heroVideoId = 'bf866299-8371-456f-b0a0-9a66687a59cb';
  const heroVideoSrc = `/cdn/videos/${heroVideoId}/play_720p.mp4`;
  const heroVideoPoster = `/cdn/videos/${heroVideoId}/thumbnail.jpg`;

  // Reel player video (MP4) — main videos library
  const reelVideoId = 'bf090ca4-69bf-49e6-b0f8-ce6e0dd44995';
  const reelVideoSrc = `/cdn/videos/${reelVideoId}/play_1080p.mp4`;
  const reelVideoPoster = `/cdn/videos/${reelVideoId}/thumbnail.jpg`;

  return (
    <main className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <HeroSection
        headline="We craft visual stories for ambitious brands."
        subheadline="Friends 'n Allies is a boutique creative agency that helps build brands, launch products, and scale startups."
        backgroundVideoSrc={heroVideoSrc}
        backgroundPosterSrc={heroVideoPoster}
      >
        <ServicesMarquee />
      </HeroSection>

      {/* Reel Player */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Watch Our Reel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Just 70 seconds (try not to smile).
            </p>
          </div>
          <ReelPlayer videoSrc={reelVideoSrc} placeholderSrc={reelVideoPoster} />
        </div>
      </section>

      {/* Services Cards */}
      <ServicesCards />

      {/* Featured Work */}
      <FeaturedWork />

      {/* Client Logos */}
      <ClientLogos />

      {/* Testimonials */}
      <TestimonialsServer />

      {/* CTA Section */}
      <FooterCTA />
    </main>
  );
}
