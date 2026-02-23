import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { VideoDimmingOverlay } from '@/components/layout/VideoDimmingOverlay';
import { VideoPlayerProvider } from '@/contexts/VideoPlayerContext';
import { SiteLayoutWrapper } from '@/components/layout/SiteLayoutWrapper';

export const metadata: Metadata = {
  title: 'FNA.WTF',
  description: 'Friends n Allies - Video Production & Digital Storytelling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className="bg-background text-foreground">
        <VideoPlayerProvider>
          <SiteLayoutWrapper
            nav={
              <>
                <Navigation />
                <VideoDimmingOverlay />
              </>
            }
            navOnly={<Navigation />}
            footer={<Footer />}
          >
            {children}
          </SiteLayoutWrapper>
        </VideoPlayerProvider>
      </body>
    </html>
  );
}
