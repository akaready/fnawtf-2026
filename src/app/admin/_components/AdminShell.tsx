'use client';

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Rocket, LogOut, ChevronRight, FileText, Search, MessageSquare, BookOpen, Users, Tag, Globe, Building2, Target, AppWindow, Clapperboard, GitFork, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NavLogo } from '@/components/layout/NavLogo';
import { AdminSearchModal } from './AdminSearchModal';

interface Props {
  children: ReactNode;
  userEmail: string;
}

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const logoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    // --- CRM ---
    { href: '/admin/clients',      label: 'Clients',      icon: Building2 },     // 0
    { href: '/admin/leads',        label: 'Leads',        icon: Target },        // 1
    { href: '/admin/partners',     label: 'Pipelines',    icon: GitFork },       // 2
    { href: '/admin/contacts',     label: 'People',       icon: Users },         // 3
    // --- Production ---
    { href: '/admin/projects',     label: 'Projects',     icon: Rocket },        // 4
    { href: '/admin/meetings',     label: 'Meetings',     icon: Video },         // 5
    // --- Proposals ---
    { href: '/admin/proposals',    label: 'Proposals',    icon: FileText },      // 6
    { href: '/admin/snippets',     label: 'Snippets',     icon: BookOpen },      // 7
    // --- Config ---
    { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare }, // 8
    { href: '/admin/tags',         label: 'Tags',         icon: Tag },           // 9
    { href: '/admin/roles',        label: 'Roles',        icon: Clapperboard },  // 10
    { href: '/admin/seo',          label: 'SEO',          icon: Globe },         // 11
    { href: '/admin/website',      label: 'Website',      icon: AppWindow },     // 12
  ];

  return (
    <div className="admin-shell flex h-screen bg-black text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-14' : 'w-52'
        } flex-shrink-0 flex flex-col border-r border-[#2a2a2a] bg-[#0a0a0a] h-full transition-[width] duration-200 overflow-hidden hover:bg-[#0e0e0e] cursor-pointer`}
        onClick={(e) => {
          // Don't toggle if clicking a link, button, or the logo
          const target = e.target as HTMLElement;
          if (target.closest('a') || target.closest('button')) return;
          setCollapsed(!collapsed);
        }}
      >
        {/* Top section — logo + search = exactly 10rem to align with header+toolbar border */}
        <div className="h-[10rem] flex-shrink-0 flex flex-col border-b border-[#2a2a2a]">
          {/* Logo */}
          <div className="flex-1 flex items-center justify-center px-2">
            <NavLogo ref={logoRef} style={{ transform: collapsed ? 'scale(0.6)' : 'scale(1.25)', transformOrigin: 'center', margin: '-4px', transition: 'transform 200ms ease' }} />
          </div>
          {/* Search button */}
          <div className="px-2 pb-2">
            <button
              onClick={() => setSearchOpen(true)}
              title={collapsed ? 'Search' : undefined}
              className="w-full flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <Search size={15} strokeWidth={1.75} className="flex-shrink-0" />
              <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                Search
                <span className="ml-1.5 text-xs text-[#4d4d4d] font-normal">⌘+K</span>
              </span>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 pt-2 pb-3 space-y-1 px-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {navItems.map(({ href, label, icon: Icon }, i) => {
            const active = pathname.startsWith(href);
            return (
              <React.Fragment key={href}>
                {i === 4 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 6 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 8 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 11 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                <Link
                  href={href}
                  data-btn-hover
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors ${
                    active
                      ? 'text-foreground bg-white/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 -ml-1.5 rounded-md">
                    <Icon size={15} strokeWidth={1.75} />
                  </span>
                  <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
                  {active && <ChevronRight size={12} className={`ml-auto transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-40'}`} />}
                </Link>
              </React.Fragment>
            );
          })}

        </nav>

        {/* User / sign out */}
        <div className="border-t border-[#2a2a2a] space-y-1 px-2 py-3">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title={collapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors w-full"
          >
            <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0" />
            <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main content — flex container; each page manages its own scroll */}
      <main className="flex-1 min-w-0 h-full flex flex-col">{children}</main>

      <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
