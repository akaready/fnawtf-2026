import { FnaLoader } from '@/components/animations/FnaLoader';
import { HeroSection } from '@/components/homepage/HeroSection';
import { ServicesMarquee } from '@/components/homepage/ServicesMarquee';
import { ServicesCards } from '@/components/homepage/ServicesCards';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { FeaturedWork } from '@/components/homepage/FeaturedWork';
import { ClientLogos } from '@/components/homepage/ClientLogos';
import { TestimonialsServer } from '@/components/homepage/TestimonialsServer';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { getBunnyVideoUrl, getBunnyVideoThumbnail, getBunnyVideoMp4Url } from '@/lib/bunny/client';

export const metadata = {
  title: 'FNA.WTF - Video Production & Digital Storytelling',
  description: 'Friends n Allies is a boutique creative agency crafting visual stories for ambitious brands.',
};

export default function Home() {
  // Bunny CDN HLS video configuration
  const heroVideoId = '0540ef55-62e5-466f-b1f6-acef297a614d';
  const heroVideoSrc = getBunnyVideoUrl(heroVideoId);
  const heroVideoPoster = getBunnyVideoThumbnail(heroVideoId);

  // Reel video — direct MP4 (HLS has audio+video codecs that break HLS.js SourceBuffers)
  const reelVideoId = '199273f8-c684-49cc-97fc-a36220a68085';
  const reelVideoSrc = getBunnyVideoMp4Url(reelVideoId, '1080p');
  const reelVideoPoster = getBunnyVideoThumbnail(reelVideoId);

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
      <ReelPlayer videoSrc={reelVideoSrc} placeholderSrc={reelVideoPoster} />

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
