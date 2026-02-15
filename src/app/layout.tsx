import type { Metadata } from 'next';
import './globals.css';
import { GsapProvider } from '@/lib/animations/gsap-provider';
import { ScrollProgressBar } from '@/components/animations/ScrollProgressBar';

/**
 * Root layout for the FNA.WTF application.
 * This layout wraps all pages and provides the base HTML structure.
 */
export const metadata: Metadata = {
  title: 'FNA.WTF - Friends n Allies',
  description: 'We craft visual stories for ambitious brands. A boutique agency helping founders share their unique stories.',
  keywords: ['video production', 'branding', 'digital storytelling', 'pitch videos', 'agency'],
  openGraph: {
    title: 'FNA.WTF - Friends n Allies',
    description: 'We craft visual stories for ambitious brands.',
    url: 'https://fna.wtf',
    siteName: 'FNA.WTF',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FNA.WTF - Friends n Allies',
    description: 'We craft visual stories for ambitious brands.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <GsapProvider>
          {children}
          <ScrollProgressBar />
        </GsapProvider>
      </body>
    </html>
  );
}
