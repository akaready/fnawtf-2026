'use client';

interface Props {
  scriptTitle: string;
  projectTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
  versionLabel: string;
  shareNotes: string | null;
  onBegin: () => void;
}

/**
 * Intro/start page for script share links.
 * Layout and styling lifted exactly from ProposalLoginForm.tsx —
 * same card, same spacing, same button style.
 */
export function ScriptShareIntro({
  scriptTitle,
  projectTitle: _projectTitle,
  clientName,
  clientLogoUrl: _clientLogoUrl,
  versionLabel: _versionLabel,
  shareNotes,
  onBegin,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {clientName ? `Script for ${clientName}` : 'Script'}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {scriptTitle}
          </h1>
        </div>

        {shareNotes && (
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              What to Look For
            </label>
            <div className="w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 whitespace-pre-wrap leading-relaxed">
              {shareNotes}
            </div>
          </div>
        )}

        <button
          onClick={onBegin}
          className="relative w-full px-4 py-3 font-medium rounded-lg overflow-hidden border transition-all duration-300 text-black bg-white border-white cursor-pointer hover:bg-white/90"
        >
          View Script
        </button>
      </div>
    </div>
  );
}
