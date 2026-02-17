import { Mail, Lock } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[4fr_1fr_1fr] gap-12 mb-8">
          {/* Left Column - Logo & Mission */}
          <div className="space-y-4">
            <Logo width={150} height={58} className="text-white" />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Friends 'n Allies is a boutique agency crafting visual stories for ambitious brands.
              We help build brands, launch products, and scale startups through video production,
              design, and digital strategy.
            </p>
          </div>
          {/* Middle Column - Explore */}
          <nav className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/work" className="text-muted-foreground hover:text-accent transition-colors">
                  Work
                </a>
              </li>
              <li>
                <a href="/services" className="text-muted-foreground hover:text-accent transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-muted-foreground hover:text-accent transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About
                </a>
              </li>
            </ul>
          </nav>

          {/* Right Column - Connect */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:hi@fna.wtf"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <Mail className="w-4 h-4" />
                hi@fna.wtf
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <Lock className="w-4 h-4" />
                Client Login
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright & Legal */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} Friends 'n Allies. All rights reserved.</p>

          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
