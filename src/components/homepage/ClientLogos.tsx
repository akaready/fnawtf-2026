'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Client data interface
 */
export interface Client {
  id: string;
  name: string;
  logoUrl: string;
}

/**
 * Props for the ClientLogos component
 */
interface ClientLogosProps {
  clients?: Client[];
  shuffle?: boolean;
}

/**
 * ClientLogos component displaying a grid of client logos with cycling animation.
 * Uses ScrollTrigger to start animation on viewport enter.
 */
export function ClientLogos({ clients: initialClients, shuffle = false }: ClientLogosProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSet, setActiveSet] = useState<number[]>([]);
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [isLoading, setIsLoading] = useState(!initialClients);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fetch clients from Supabase if not provided
  useEffect(() => {
    if (initialClients) return;

    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          // Shuffle if needed
          const clientList = shuffle
            ? data.sort(() => Math.random() - 0.5)
            : data;
          setClients(clientList);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [initialClients, shuffle]);

  const placeholderClients: Client[] = [
    { id: 'ph-1', name: 'Northline', logoUrl: '/logos/placeholders/northline.svg' },
    { id: 'ph-2', name: 'ThreadLab', logoUrl: '/logos/placeholders/threadlab.svg' },
    { id: 'ph-3', name: 'Rift Health', logoUrl: '/logos/placeholders/rift-health.svg' },
    { id: 'ph-4', name: 'Anchor AI', logoUrl: '/logos/placeholders/anchor-ai.svg' },
    { id: 'ph-5', name: 'Foundry', logoUrl: '/logos/placeholders/foundry.svg' },
    { id: 'ph-6', name: 'Nova Studio', logoUrl: '/logos/placeholders/nova-studio.svg' },
    { id: 'ph-7', name: 'Brightline', logoUrl: '/logos/placeholders/brightline.svg' },
    { id: 'ph-8', name: 'Pioneer', logoUrl: '/logos/placeholders/pioneer.svg' },
  ];

  const logos = clients.length > 0 ? clients : placeholderClients;

  // Set up scroll-triggered animation
  useEffect(() => {
    if (prefersReducedMotion || isLoading || logos.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    // Simple fade-in animation on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            container.classList.add('animate-in');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [logos.length, isLoading, prefersReducedMotion]);

  useEffect(() => {
    if (logos.length === 0) return;

    const visibleCount = 8;
    const first = Array.from({ length: Math.min(visibleCount, logos.length) }, (_, i) => i);
    setActiveSet(first);

    if (prefersReducedMotion) return;

    let cursor = 0;
    const interval = window.setInterval(() => {
      cursor += 1;
      const next = Array.from({ length: Math.min(visibleCount, logos.length) }, (_, i) => (i + cursor) % logos.length);
      setActiveSet(next);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [logos, prefersReducedMotion]);

  return (
    <section className="py-16 md:py-24 bg-background border-t border-border" data-reveal-group>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12" data-reveal-group-nested>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Trusted by founders
          </h2>
          <p className="mt-2 text-muted-foreground">
            Companies we've had the pleasure of working with
          </p>
        </div>

        {/* Logo Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] rounded-lg bg-muted-foreground/10 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 opacity-0"
            data-logo-wall-cycle-init
            data-logo-wall-shuffle={shuffle}
            data-reveal-group-nested
          >
            {logos.map((client, index) => (
              <LogoTile
                key={client.id}
                client={client}
                isActive={activeSet.includes(index)}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface LogoTileProps {
  client: Client;
  isActive: boolean;
  prefersReducedMotion: boolean;
}

function LogoTile({ client, isActive, prefersReducedMotion }: LogoTileProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="flex items-center justify-center p-6 rounded-lg bg-muted/20 border border-border/60 transition-all duration-500 group"
      data-logo-wall-item
      data-logo-wall-target={isActive ? 'active' : 'idle'}
      style={{
        opacity: prefersReducedMotion ? 1 : isActive ? 1 : 0.2,
        transform: prefersReducedMotion
          ? 'none'
          : isActive
          ? 'translateY(0px) scale(1)'
          : 'translateY(10px) scale(0.98)',
        transition: prefersReducedMotion ? 'opacity 0.3s, transform 0.3s' : 'opacity 0.5s, transform 0.5s',
      }}
    >
      <div className="relative w-full h-12 grayscale opacity-60 transition-all duration-300 flex items-center justify-center">
        {!imageFailed ? (
          <Image
            src={client.logoUrl}
            alt={client.name}
            fill
            onError={() => setImageFailed(true)}
            className="object-contain invert dark:invert-0"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <span className="font-display text-sm md:text-base tracking-wide text-foreground/80">{client.name}</span>
        )}
      </div>
    </div>
  );
}
