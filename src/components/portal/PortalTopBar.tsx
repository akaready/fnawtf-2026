'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { logoutFromPortal } from '@/lib/portal/logoutAction';

interface PortalTopBarProps {
  clientName: string;
  clientLogoUrl: string | null;
  email: string;
}

function parseBreadcrumbs(pathname: string): { label: string; href: string }[] {
  // Always starts with Home
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/portal' },
  ];

  // Strip the /portal prefix and split remaining segments
  const rest = pathname.replace(/^\/portal\/?/, '');
  if (!rest) return crumbs;

  const segments = rest.split('/').filter(Boolean);
  let accumulated = '/portal';

  for (const segment of segments) {
    accumulated = `${accumulated}/${segment}`;
    // Capitalize first letter
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

export function PortalTopBar({ clientName, clientLogoUrl, email }: PortalTopBarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const isHome = pathname === '/portal';

  const breadcrumbs = parseBreadcrumbs(pathname);

  function handleLogout() {
    startTransition(async () => {
      await logoutFromPortal();
    });
  }

  const logoLockup = (
    <div className="flex items-center gap-2">
      {clientLogoUrl ? (
        <img
          src={clientLogoUrl}
          alt={clientName}
          className="admin-logo h-5 object-contain"
        />
      ) : (
        <span className="text-xs tracking-wide text-[#aaa]">{clientName}</span>
      )}
      <span className="text-[#333] text-xs">×</span>
      <span className="text-xs tracking-widest uppercase text-[#555]">
        Friends &amp; Allies
      </span>
    </div>
  );

  const avatarInitial = clientName.charAt(0).toUpperCase();

  const rightSection = (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Email — desktop only */}
      <span className="hidden md:block text-xs text-[#484848] truncate max-w-[180px]">
        {email}
      </span>
      {/* Log out — desktop only */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="hidden md:block text-xs text-[#484848] px-2 py-1 border border-[#222] rounded hover:border-[#333] hover:text-[#666] transition-colors disabled:opacity-50"
      >
        Log out
      </button>
      {/* Avatar — always visible */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        title={`Logged in as ${email} — click to log out`}
        className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-xs text-[#777] font-semibold hover:border-[#3a3a3a] hover:text-[#999] transition-colors disabled:opacity-50 md:hidden"
      >
        {avatarInitial}
      </button>
    </div>
  );

  return (
    <header className="h-[50px] md:h-[54px] bg-[#0d0d0d] border-b border-[#1a1a1a] flex-shrink-0 relative">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Left */}
        <div className="flex items-center">
          {isHome ? (
            // Home: always show logo lockup
            logoLockup
          ) : (
            <>
              {/* Inner pages desktop: show logo lockup */}
              <div className="hidden md:flex">{logoLockup}</div>
              {/* Inner pages mobile: show breadcrumbs instead */}
              <nav className="flex md:hidden items-center gap-1.5" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, i) => {
                  const isLast = i === breadcrumbs.length - 1;
                  return (
                    <span key={crumb.href} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span className="text-[#333] text-xs">/</span>
                      )}
                      {isLast ? (
                        <span className="text-xs text-[#ccc]">{crumb.label}</span>
                      ) : (
                        <Link
                          href={crumb.href}
                          className="text-xs text-[#555] hover:text-[#888] transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </span>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        {/* Center — desktop breadcrumbs on inner pages */}
        {!isHome && (
          <nav
            className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-[#333] text-xs">/</span>
                  )}
                  {isLast ? (
                    <span className="text-xs text-[#ccc]">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-xs text-[#555] hover:text-[#888] transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        )}

        {/* Right */}
        {rightSection}
      </div>
    </header>
  );
}
