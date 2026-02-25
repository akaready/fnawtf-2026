'use client';

import React, { ReactNode, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, ChevronRight, FileText, Search, MessageSquare, Building2, BookOpen, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NavLogo } from '@/components/layout/NavLogo';

interface Props {
  children: ReactNode;
  userEmail: string;
}

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const logoRef = useRef<HTMLAnchorElement>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/seo', label: 'SEO', icon: Search },
    { href: '/admin/clients', label: 'Clients', icon: Building2 },
    { href: '/admin/projects', label: 'Projects', icon: LayoutGrid },
    { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  ];

  const bottomItems = [
    { href: '/admin/contacts', label: 'Contacts', icon: Users },
    { href: '/admin/content', label: 'Content', icon: BookOpen, hidden: true },
    { href: '/admin/proposals', label: 'Proposals', icon: FileText, hidden: true },
  ];

  return (
    <div className="flex h-screen bg-black text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-14' : 'w-52'
        } flex-shrink-0 flex flex-col border-r border-white/[0.12] bg-[#0a0a0a] h-full transition-[width] duration-200 overflow-hidden hover:bg-[#0e0e0e] cursor-pointer`}
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
        <nav className="flex-1 py-3 space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }, i) => {
            const active = pathname.startsWith(href);
            return (
              <React.Fragment key={href}>
                {i === 1 && <div className="my-3 border-t border-white/[0.08] w-full" />}
                <Link
                  href={href}
                  data-btn-hover
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-white/8 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
                  <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
                  {active && <ChevronRight size={12} className={`ml-auto transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-40'}`} />}
                </Link>
              </React.Fragment>
            );
          })}

          {/* Divider + bottom items */}
          <div className="my-3 border-t border-white/[0.08] w-full" />
          {bottomItems.filter(item => !item.hidden).map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-btn-hover
                title={collapsed ? label : undefined}
                className={`flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-white/8 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
                <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
                {active && <ChevronRight size={12} className={`ml-auto transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-40'}`} />}
              </Link>
            );
          })}
        </nav>

        {/* User / sign out */}
        <div className="border-t border-white/[0.12] space-y-1 px-2 py-3">
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
    </div>
  );
}
