import { FnaLoader } from '@/components/animations/FnaLoader';
import { HeroSection } from '@/components/homepage/HeroSection';
import { ServicesMarquee } from '@/components/homepage/ServicesMarquee';
import { ServicesCards } from '@/components/homepage/ServicesCards';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { FeaturedWork } from '@/components/homepage/FeaturedWork';
import { ClientLogos } from '@/components/homepage/ClientLogos';
import { TestimonialsServer } from '@/components/homepage/TestimonialsServer';
import { FooterCTA } from '@/components/layout/FooterCTA';
export const metadata = {
  title: 'FNA.WTF - Video Production & Digital Storytelling',
  description: 'Friends n Allies is a boutique creative agency crafting visual stories for ambitious brands.',
};

// Hero background still uses Reels library (600543) — HLS with hotlink protection
const REELS_CDN = 'vz-8955c328-692.b-cdn.net';
// Main project videos library (604035) — no hotlink protection
const VIDEOS_CDN = 'vz-6b68e26c-531.b-cdn.net';

export default function Home() {
  // Hero background video (HLS) — Reels library
  const heroVideoId = '0540ef55-62e5-466f-b1f6-acef297a614d';
  const heroVideoSrc = `https://${REELS_CDN}/${heroVideoId}/playlist.m3u8`;
  const heroVideoPoster = `https://${REELS_CDN}/${heroVideoId}/thumbnail.jpg`;

  // Reel player video (MP4) — copied to main library for reliable thumbnails
  const reelVideoId = '8a666997-7b51-4e37-a019-8dedd010e6ef';
  const reelVideoSrc = `https://${VIDEOS_CDN}/${reelVideoId}/play_1080p.mp4`;
  const reelVideoPoster = `https://${VIDEOS_CDN}/${reelVideoId}/thumbnail.jpg`;

  return (
    <main className="bg-background text-foreground min-h-screen">
      {/* Loading Animation */}
      <FnaLoader />

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
              Give us just 70 seconds (try not to smile).
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
