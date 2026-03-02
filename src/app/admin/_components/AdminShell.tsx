'use client';

import React, { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Rocket, LogOut, ChevronRight, ChevronDown, FileText, Search, MessageSquare, BookOpen, Users, Tag, Globe, Building2, Target, AppWindow, Clapperboard, GitFork, Video, Sun, Moon, Palette, ClipboardList, ScrollText, Settings, PanelLeftOpen, FileSignature, Layers, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NavLogo } from '@/components/layout/NavLogo';
import { AdminSearchModal } from './AdminSearchModal';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ChatProvider, useChatContext } from './chat/ChatContext';
import { ChatWidget } from './chat/ChatWidget';
import { ChatPanel } from './chat/ChatPanel';

interface Props {
  children: ReactNode;
  userEmail: string;
}

export function AdminShell({ children, userEmail }: Props) {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <ChatProvider>
          <AdminShellInner userEmail={userEmail}>{children}</AdminShellInner>
        </ChatProvider>
      </Suspense>
    </ThemeProvider>
  );
}

function AdminShellInner({ children, userEmail }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { isOpen, isSidebarMode } = useChatContext();
  const chatSidebarOpen = isSidebarMode && isOpen;
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const [navTooltip, setNavTooltip] = useState<{ label: string; top: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const logoRef = useRef<HTMLAnchorElement>(null);

  const CHAT_MIN = 320;
  const CHAT_MAX = 700;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startW = chatWidth;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX - ev.clientX;
      setChatWidth(Math.min(CHAT_MAX, Math.max(CHAT_MIN, startW + delta)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [chatWidth]);

  // Apply saved design token overrides from style guide
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fna-admin-custom-tokens');
      if (!raw) return;
      const overrides = JSON.parse(raw) as Record<string, string>;
      for (const [key, value] of Object.entries(overrides)) {
        document.documentElement.style.setProperty(key, value);
      }
    } catch {}
  }, []);

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

  // Close settings menu on click outside
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node) &&
        settingsBtnRef.current && !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const [navSubmenuOpen, setNavSubmenuOpen] = useState<string | null>(null);

  const navItems: { href: string; label: string; icon: typeof Building2; children?: { href: string; label: string; icon: typeof Building2 }[] }[] = [
    // --- Active ---
    { href: '/admin/clients',      label: 'Clients',      icon: Building2 },
    { href: '/admin/projects',     label: 'Projects',     icon: Rocket },
    { href: '/admin/scripts',      label: 'Scripts',      icon: ScrollText },
    { href: '/admin/meetings',     label: 'Meetings',     icon: Video },
    { href: '/admin/contracts',    label: 'Contracts',    icon: FileSignature },
    // --- Incoming ---
    { href: '/admin/partners',     label: 'Pipelines',    icon: GitFork },
    { href: '/admin/leads',        label: 'Leads',        icon: Target },
    { href: '/admin/intake',       label: 'Intake',       icon: ClipboardList },
    { href: '/admin/proposals',    label: 'Proposals',    icon: FileText },
    // --- Library ---
    { href: '/admin/contacts',     label: 'People',       icon: Users },
    { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
    { href: '/admin/tags',         label: 'Tags',         icon: Tag },
    { href: '/admin/roles',        label: 'Roles',        icon: Clapperboard },
    { href: '/admin/locations',    label: 'Locations',    icon: MapPin },
    { href: '/admin/snippets',     label: 'Snippets',     icon: BookOpen },
    { href: '/admin/contracts/templates', label: 'Templates', icon: Layers },
  ];

  // Admin-only settings menu items (SEO, Website, Style Guide)
  const settingsItems = [
    { href: '/admin/seo',        label: 'SEO',         icon: Globe },
    { href: '/admin/website',    label: 'Website',     icon: AppWindow },
    { href: '/admin/styleguide', label: 'Style Guide', icon: Palette },
  ];

  return (
    <div className={`admin-shell flex h-screen bg-admin-bg-base text-admin-text-primary overflow-hidden${theme === 'light' ? ' light-mode' : ''}`}>
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-14' : 'w-52'
        } flex-shrink-0 flex flex-col border-r border-admin-border bg-admin-bg-sidebar h-full transition-[width] duration-200 overflow-hidden hover:bg-admin-bg-sidebar-hover cursor-pointer`}
        onClick={(e) => {
          // Don't toggle if clicking a link, button, or the logo
          const target = e.target as HTMLElement;
          if (target.closest('a') || target.closest('button')) return;
          setCollapsed(!collapsed);
        }}
      >
        {/* Top section — logo + search = exactly 10rem to align with header+toolbar border */}
        <div className="h-[10rem] flex-shrink-0 flex flex-col border-b border-admin-border">
          {/* Logo */}
          <div className="flex-1 flex items-center justify-center px-2">
            <NavLogo ref={logoRef} style={{ transform: collapsed ? 'scale(0.6)' : 'scale(1.25)', transformOrigin: 'center', margin: '-4px', transition: 'transform 200ms ease' }} />
          </div>
          {/* Search button */}
          <div className="px-2 pb-2">
            <button
              onClick={() => setSearchOpen(true)}
              title={collapsed ? 'Search' : undefined}
              className="w-full flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover"
            >
              <Search size={15} strokeWidth={1.75} className="flex-shrink-0" />
              <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                Search
                <span className="ml-1.5 text-xs text-admin-text-faint font-normal">⌘+K</span>
              </span>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 pt-2 pb-3 space-y-1 px-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {navItems.map(({ href, label, icon: Icon, children }, i) => {
            const active = pathname.startsWith(href);
            const hasChildren = children && children.length > 0;
            const submenuOpen = navSubmenuOpen === href;
            return (
              <React.Fragment key={href}>
                {(i === 5 || i === 9) && <div className="border-t border-admin-border -mx-2 !mt-2 !mb-2" />}
                <div className="relative">
                  <Link
                    href={href}
                    data-btn-hover
                    onMouseEnter={(e) => {
                      if (!collapsed) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setNavTooltip({ label, top: rect.top + rect.height / 2 });
                    }}
                    onMouseLeave={() => setNavTooltip(null)}
                    className={`flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors ${
                      active
                        ? 'text-admin-text-primary bg-admin-bg-active'
                        : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                    }`}
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 -ml-1.5 rounded-md">
                      <Icon size={15} strokeWidth={1.75} />
                    </span>
                    <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
                    {active && !hasChildren && <ChevronRight size={12} className={`ml-auto transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-40'}`} />}
                  </Link>
                  {/* Submenu chevron toggle — shown when expanded and item has children */}
                  {hasChildren && !collapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNavSubmenuOpen(submenuOpen ? null : href);
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                        submenuOpen
                          ? 'text-admin-text-primary bg-admin-bg-active'
                          : 'text-admin-text-faint hover:text-admin-text-muted hover:bg-admin-bg-hover'
                      }`}
                    >
                      <ChevronDown size={12} className={`transition-transform duration-150 ${submenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {/* Submenu items */}
                {hasChildren && submenuOpen && !collapsed && children.map((child) => {
                  const childActive = pathname.startsWith(child.href);
                  const ChildIcon = child.icon;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center gap-2.5 h-9 pl-[30px] pr-[7px] rounded-lg text-sm whitespace-nowrap transition-colors ${
                        childActive
                          ? 'text-admin-text-primary bg-admin-bg-active'
                          : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                      }`}
                    >
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md">
                        <ChildIcon size={13} strokeWidth={1.75} />
                      </span>
                      <span>{child.label}</span>
                    </Link>
                  );
                })}
              </React.Fragment>
            );
          })}

        </nav>

        {/* Footer — collapsed: expand button only; expanded: full controls */}
        <div className="border-t border-admin-border px-2 py-3">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="w-full flex items-center justify-center h-10 rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
            >
              <PanelLeftOpen size={15} strokeWidth={1.75} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 min-w-0 flex items-center gap-2.5 h-10 pl-[13px] pr-[7px] rounded-lg text-sm whitespace-nowrap text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0" />
                <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
              </button>
              {userEmail === 'ready@fna.wtf' && (
                <div className="relative">
                  <button
                    ref={settingsBtnRef}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    title="Settings"
                    className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      settingsOpen
                        ? 'text-admin-text-primary bg-admin-bg-active'
                        : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                    }`}
                  >
                    <Settings size={15} strokeWidth={1.75} />
                  </button>
                </div>
              )}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
              >
                {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar nav tooltip — rendered outside aside to avoid overflow clip */}
      {navTooltip && (
        <div
          className="fixed pointer-events-none px-3 py-1.5 rounded-xl bg-admin-bg-overlay border border-admin-border backdrop-blur-md whitespace-nowrap z-50"
          style={{ left: 64, top: navTooltip.top, transform: 'translateY(-50%)' }}
        >
          <span className="text-sm font-medium text-white">{navTooltip.label}</span>
        </div>
      )}

      {/* Settings flyout — rendered outside aside to avoid overflow clip */}
      {settingsOpen && settingsBtnRef.current && (
        <div
          ref={settingsMenuRef}
          className="fixed z-50 py-1.5 rounded-xl bg-admin-bg-overlay border border-admin-border backdrop-blur-md min-w-[160px]"
          style={{
            left: settingsBtnRef.current.getBoundingClientRect().left,
            top: settingsBtnRef.current.getBoundingClientRect().top - 8,
            transform: 'translateY(-100%)',
          }}
        >
          {settingsItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSettingsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'text-admin-text-primary bg-admin-bg-active'
                    : 'text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover'
                }`}
              >
                <Icon size={14} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main content — flex container; each page manages its own scroll */}
      <main className="flex-1 min-w-0 h-full flex flex-col">{children}</main>

      {/* Chat sidebar — full-height panel on the right */}
      <div
        className="flex-shrink-0 h-full overflow-hidden relative"
        style={{
          width: chatSidebarOpen ? chatWidth : 0,
          transition: isDragging.current ? 'none' : 'width 300ms ease-in-out',
        }}
      >
        {isSidebarMode && (
          <>
            {/* Drag handle */}
            <div
              onMouseDown={handleDragStart}
              className="absolute left-0 top-0 w-1 h-full cursor-col-resize z-10 hover:bg-[#a14dfd]/40 transition-colors"
            />
            <div className="h-full border-l border-admin-border-subtle" style={{ width: chatWidth }}>
              <ChatPanel />
            </div>
          </>
        )}
      </div>

      <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ChatWidget />
    </div>
  );
}
