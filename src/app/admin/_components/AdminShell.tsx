'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  children: ReactNode;
  userEmail: string;
}

export function AdminShell({ children, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/projects', label: 'Projects', icon: LayoutGrid },
  ];

  return (
    <div className="flex min-h-screen bg-black text-foreground pt-[73px]">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-14' : 'w-52'
        } flex-shrink-0 flex flex-col border-r border-border/40 bg-[#0a0a0a] sticky top-[73px] h-[calc(100vh-73px)] self-start transition-[width] duration-200 overflow-hidden`}
      >
        {/* Header: collapse toggle */}
        <div className={`flex items-center border-b border-border/40 ${collapsed ? 'justify-center pt-5 pb-4 px-2' : 'px-3 pt-5 pb-4 justify-between'}`}>
          {!collapsed && (
            <Link
              href="/admin/projects"
              className="font-display text-sm font-bold tracking-tight text-foreground truncate pl-2"
            >
              FNA Admin
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-lg text-sm transition-colors ${
                  collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-2.5 px-3 py-2'
                } ${
                  active
                    ? 'bg-white/8 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
                {!collapsed && label}
                {!collapsed && active && <ChevronRight size={12} className="ml-auto opacity-40" />}
              </Link>
            );
          })}
        </nav>

        {/* User / sign out */}
        <div className={`border-t border-border/40 space-y-1 ${collapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
          {!collapsed && (
            <p className="px-3 text-[11px] text-muted-foreground/50 truncate">{userEmail}</p>
          )}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title={collapsed ? 'Sign Out' : undefined}
            className={`flex items-center rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors ${
              collapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-full gap-2.5 px-3 py-2'
            }`}
          >
            <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0" />
            {!collapsed && (signingOut ? 'Signing out…' : 'Sign Out')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
