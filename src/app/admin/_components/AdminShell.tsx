'use client';

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, ChevronRight, FileText, Search, MessageSquare, BookOpen, Users, Tag, Globe, Briefcase, Target, AppWindow, Clapperboard, GitFork, Video } from 'lucide-react';
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
    { href: '/admin/search',       label: 'Search',       icon: Search },        // 0
    // --- CRM ---
    { href: '/admin/clients',      label: 'Clients',      icon: Briefcase },     // 1
    { href: '/admin/leads',        label: 'Leads',        icon: Target },        // 2
    { href: '/admin/partners',     label: 'Pipelines',    icon: GitFork },       // 3
    { href: '/admin/contacts',     label: 'People',       icon: Users },         // 4
    // --- Production ---
    { href: '/admin/projects',     label: 'Projects',     icon: LayoutGrid },    // 5
    { href: '/admin/meetings',     label: 'Meetings',     icon: Video },         // 6
    // --- Proposals ---
    { href: '/admin/proposals',    label: 'Proposals',    icon: FileText },      // 7
    { href: '/admin/snippets',     label: 'Snippets',     icon: BookOpen },      // 8
    // --- Config ---
    { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare }, // 9
    { href: '/admin/tags',         label: 'Tags',         icon: Tag },           // 10
    { href: '/admin/roles',        label: 'Roles',        icon: Clapperboard },  // 11
    { href: '/admin/seo',          label: 'SEO',          icon: Globe },         // 12
    { href: '/admin/website',      label: 'Website',      icon: AppWindow },     // 13
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
        {/* Logo */}
        <div className="flex items-center justify-center py-8 px-2">
          <NavLogo ref={logoRef} style={{ transform: collapsed ? 'scale(0.6)' : 'scale(1.25)', transformOrigin: 'center', margin: '-4px', transition: 'transform 200ms ease' }} />
        </div>

        {/* Nav — always same padding; sidebar overflow-hidden clips text when collapsed */}
        <nav className="flex-1 pt-[10px] pb-3 space-y-1 px-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {navItems.map(({ href, label, icon: Icon }, i) => {
            const active = pathname.startsWith(href);
            return (
              <React.Fragment key={href}>
                {i === 1 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 5 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 7 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 9 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {i === 12 && <div className="border-t border-[#2a2a2a] -mx-2 !mt-2 !mb-2" />}
                {label === 'Search' ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    title={collapsed ? label : undefined}
                    className={`w-full flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors text-muted-foreground hover:text-foreground hover:bg-white/5`}
                  >
                    <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
                    <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                      {label}
                      <span className="ml-1.5 text-xs text-[#4d4d4d] font-normal">⌘+K</span>
                    </span>
                  </button>
                ) : (
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
                )}
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
