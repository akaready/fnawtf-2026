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

interface Crumb {
  label: string;
  href: string;
  isLast: boolean;
}

function parseBreadcrumbs(pathname: string): Crumb[] {
  // Always starts with Home
  const base: { label: string; href: string }[] = [
    { label: 'Home', href: '/portal' },
  ];

  // Strip the /portal prefix and split remaining segments
  const rest = pathname.replace(/^\/portal\/?/, '');
  if (!rest) {
    return base.map((c, i, arr) => ({ ...c, isLast: i === arr.length - 1 }));
  }

  const segments = rest.split('/').filter(Boolean);
  let accumulated = '/portal';

  for (const segment of segments) {
    accumulated = `${accumulated}/${segment}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    base.push({ label, href: accumulated });
  }

  return base.map((c, i, arr) => ({ ...c, isLast: i === arr.length - 1 }));
}

function BreadcrumbList({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-xs text-portal-text-separator">/</span>
          )}
          {crumb.isLast ? (
            <span className="text-xs text-portal-crumb-active">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-xs text-portal-crumb-inactive hover:text-portal-text-muted transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </>
  );
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
    <div className="flex items-center gap-3">
      <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-4 opacity-60" />
      {clientLogoUrl && (
        <>
          <span className="text-portal-text-separator text-xs">/</span>
          <img
            src={clientLogoUrl}
            alt={clientName}
            className="admin-logo h-5 object-contain"
          />
        </>
      )}
      {!clientLogoUrl && (
        <>
          <span className="text-portal-text-separator text-xs">/</span>
          <span className="text-xs tracking-wide text-portal-text-muted">{clientName}</span>
        </>
      )}
    </div>
  );

  const avatarInitial = clientName.charAt(0).toUpperCase();

  return (
    <header className="h-[50px] md:h-[54px] bg-portal-bar border-b border-portal-border flex-shrink-0 grid grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
      {/* Left: logo lockup (desktop always; mobile only on home) */}
      <div className="flex items-center">
        {isHome ? (
          logoLockup
        ) : (
          <>
            {/* Inner pages desktop: logo lockup */}
            <div className="hidden md:flex">{logoLockup}</div>
            {/* Inner pages mobile: breadcrumbs */}
            <nav className="flex md:hidden items-center gap-1.5" aria-label="Breadcrumb">
              <BreadcrumbList crumbs={breadcrumbs} />
            </nav>
          </>
        )}
      </div>

      {/* Center: desktop breadcrumbs on inner pages */}
      <div>
        {!isHome && (
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Breadcrumb">
            <BreadcrumbList crumbs={breadcrumbs} />
          </nav>
        )}
      </div>

      {/* Right: email + logout (desktop) or avatar (mobile) */}
      <div className="flex items-center justify-end gap-2">
        {/* Email — desktop only */}
        <span className="hidden md:block text-xs text-portal-crumb-inactive truncate max-w-[180px]">
          {email}
        </span>
        {/* Log out — desktop only */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="hidden md:block text-xs text-portal-crumb-inactive px-2 py-1 border border-portal-logout-border rounded hover:border-portal-avatar-border hover:text-portal-text-muted transition-colors disabled:opacity-50"
        >
          Log out
        </button>
        {/* Avatar — mobile only */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          title={`Logged in as ${email} — click to log out`}
          className="w-7 h-7 rounded-full bg-portal-avatar-bg border border-portal-avatar-border flex items-center justify-center text-xs text-portal-avatar-text font-semibold hover:border-portal-logout-border hover:text-portal-text-muted transition-colors disabled:opacity-50 md:hidden"
        >
          {avatarInitial}
        </button>
      </div>
    </header>
  );
}
