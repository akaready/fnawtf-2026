import { HeroSection } from '@/components/homepage/HeroSection';
import { LocationsRow } from '@/components/homepage/LocationsRow';
import { ServicesMarquee } from '@/components/homepage/ServicesMarquee';
import { ReelPlayer } from '@/components/homepage/ReelPlayer';
import { ServicesCards } from '@/components/homepage/ServicesCards';
import { FeaturedWork } from '@/components/homepage/FeaturedWork';
import { ClientLogos } from '@/components/homepage/ClientLogos';
import { FooterCTA } from '@/components/layout/FooterCTA';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

/**
 * Homepage for FNA.WTF
 * 
 * This is the main entry point for the FNA.WTF website.
 * It assembles all the homepage sections in order:
 * - Hero section with video background
 * - Locations row
 * - Services marquee (infinite scroll)
 * - Reel player (showcase video)
 * - Services cards
 * - Featured work (masonry grid)
 * - Client logos
 * - Footer CTA
 */
export default async function HomePage() {
  // Services data
  const services = [
    'digital storytelling',
    'branding',
    'video production',
    'pitch videos',
    'launch pages',
    'copywriting',
    'ai integrations',
    'automations',
  ];

  // Services cards data
  const servicesCards = [
    {
      title: 'Build',
      description: 'Foundation services to establish your brand identity and visual presence.',
      href: '/services#build',
    },
    {
      title: 'Launch',
      description: 'Launch services to get your story out into the world.',
      href: '/services#launch',
    },
    {
      title: 'Scale',
      description: 'Growth services to expand your reach and impact.',
      href: '/services#scale',
    },
  ];

  // Reel video (placeholder - would come from Bunny CDN in production)
  const reelVideoSrc = process.env.BUNNY_CDN_HOSTNAME 
    ? `https://${process.env.BUNNY_CDN_HOSTNAME}/reel/playlist.m3u8`
    : '/videos/reel-placeholder.mp4';

  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="home" />
      
      {/* Hero Section */}
      <HeroSection
        headline="We craft visual stories for ambitious brands."
        subheadline="Friends n Allies is a boutique agency that helps founders craft and share their unique stories."
        backgroundVideoSrc="/videos/hero-bg.mp4"
      />

      {/* Locations Row */}
      <LocationsRow
        locations={['San Francisco', 'Los Angeles', 'Austin', 'New York', 'Global']}
      />

      {/* Reel Player */}
      <ReelPlayer
        videoSrc={reelVideoSrc}
        placeholderSrc="/images/reel-placeholder.jpg"
      />

      {/* Services Marquee */}
      <ServicesMarquee items={services} />

      {/* Services Cards */}
      <ServicesCards cards={servicesCards} />

      {/* Featured Work - Server component fetches from Supabase */}
      <FeaturedWork />

      {/* Client Logos */}
      <ClientLogos />

      {/* Footer CTA */}
      <FooterCTA
        headline="like what you see? snag some time on our calendar."
        calcomUsername={process.env.NEXT_PUBLIC_CALCOM_USERNAME || 'fna'}
      />

      <Footer />
    </main>
  );
}
