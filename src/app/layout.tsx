import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { ParallaxProvider } from '@/components/animations/ParallaxProvider';
import { ScrollProgressRight } from '@/components/animations/ScrollProgressRight';
import { PageTransition } from '@/components/animations/PageTransition';

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
    <html lang="en" className="dark">
      <head />
      <body className="bg-background text-foreground">
        <PageTransition>
          <ScrollProgressRight />
          <Navigation />

          <ParallaxProvider>
            {children}
          </ParallaxProvider>

          <Footer />
        </PageTransition>
      </body>
    </html>
  );
}
