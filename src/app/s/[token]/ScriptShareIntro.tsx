'use client';

/**
 * Intro/start page for script share links.
 * Structure copied exactly from ProposalLoginForm.tsx / ScriptLoginForm.tsx —
 * same outer wrapper, same card, same spacing, same button.
 */

interface Props {
  scriptTitle: string;
  projectTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
  versionLabel: string;
  shareNotes: string | null;
  onBegin: () => void;
}

export function ScriptShareIntro({
  scriptTitle,
  clientName,
  shareNotes,
  onBegin,
}: Props) {
  const inputCls =
    'w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/50 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {clientName ? `Script for ${clientName}` : 'Script Review'}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {scriptTitle}
          </h1>
        </div>

        <div className="space-y-4">
          {shareNotes && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                What to Look For
              </label>
              <div className={`${inputCls} whitespace-pre-wrap`}>
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
    </div>
  );
}
