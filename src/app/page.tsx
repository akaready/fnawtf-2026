import { FnaLoader } from '@/components/animations/FnaLoader';
import { HeroSection } from '@/components/homepage/HeroSection';
import { ServicesMarquee } from '@/components/homepage/ServicesMarquee';
import { ServicesCards } from '@/components/homepage/ServicesCards';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { FeaturedWork } from '@/components/homepage/FeaturedWork';
import { ClientLogos } from '@/components/homepage/ClientLogos';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { getBunnyVideoUrl, getBunnyVideoThumbnail } from '@/lib/bunny/client';

export const metadata = {
  title: 'FNA.WTF - Video Production & Digital Storytelling',
  description: 'Friends n Allies is a boutique creative agency crafting visual stories for ambitious brands.',
};

export default function Home() {
  // Bunny CDN HLS video configuration
  const heroVideoId = 'a7a33b5c-afea-4623-95e3-d7756fd7985c';
  const heroVideoSrc = getBunnyVideoUrl(heroVideoId);
  const heroVideoPoster = getBunnyVideoThumbnail(heroVideoId);

  // Reel video (update when available on Bunny CDN)
  const reelVideoSrc = 'https://fna-wtf.b-cdn.net/reel-showcase.mp4';

  return (
    <main className="bg-background text-foreground">
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
      <ReelPlayer videoSrc={reelVideoSrc} />

      {/* Services Cards */}
      <ServicesCards />

      {/* Featured Work */}
      <FeaturedWork />

      {/* Client Logos */}
      <ClientLogos />

      {/* CTA Section */}
      <FooterCTA />
    </main>
  );
}
