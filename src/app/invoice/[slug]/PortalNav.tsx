'use client';

import Image from 'next/image';
import { Sun, Moon, Printer, ExternalLink } from 'lucide-react';

interface PortalNavProps {
  projectTitle: string;
  clientCompany?: string;
  invoiceNumber: string;
  lightMode: boolean;
  onToggleMode: () => void;
  proposalUrl?: string;
  contractUrl?: string;
}

export function PortalNav({
  projectTitle,
  clientCompany,
  invoiceNumber,
  lightMode,
  onToggleMode,
  proposalUrl,
  contractUrl,
}: PortalNavProps) {
  return (
    <nav className="sticky top-0 z-50 h-12 flex items-center justify-between px-5 border-b border-admin-border bg-admin-bg-nav invoice-no-print:hidden">

      {/* Left: FNA logo + project context */}
      <div className="flex items-center gap-3 min-w-0">
        <Image
          src="/images/logo/f-only.svg"
          alt="FNA"
          width={20}
          height={20}
          className="w-5 h-5 object-contain brightness-0 invert flex-shrink-0"
        />
        <div className="hidden sm:block h-4 w-px bg-admin-border flex-shrink-0" />
        <span className="hidden sm:block text-xs text-admin-text-muted truncate max-w-[200px]">
          <span className="font-medium text-admin-text-primary">{projectTitle}</span>
          {clientCompany && (
            <span className="text-admin-text-dim"> · {clientCompany}</span>
          )}
        </span>
      </div>

      {/* Center: doc tab strip */}
      <div className="flex items-center gap-0.5 bg-admin-bg-inset border border-admin-border rounded-lg p-0.5">
        {proposalUrl ? (
          <a
            href={proposalUrl}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          >
            Proposal
          </a>
        ) : (
          <span className="px-3 py-1 rounded-md text-xs font-medium text-admin-text-dim cursor-not-allowed">
            Proposal
          </span>
        )}

        {contractUrl ? (
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          >
            Contract
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ) : (
          <span className="px-3 py-1 rounded-md text-xs font-medium text-admin-text-dim cursor-not-allowed">
            Contract
          </span>
        )}

        {/* Active: Invoice */}
        <span className="px-3 py-1 rounded-md text-xs font-semibold bg-admin-bg-active text-admin-text-primary">
          Invoice
          <span className="font-[family-name:var(--font-mono)] font-normal text-admin-text-dim ml-1.5">
            {invoiceNumber}
          </span>
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleMode}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {lightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => window.print()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-admin-text-dim hover:text-admin-text-primary hover:bg-admin-bg-hover transition-colors"
          title="Print invoice"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}
