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

export function ScriptShareIntro({
  scriptTitle,
  projectTitle: _projectTitle,
  clientName,
  clientLogoUrl,
  versionLabel,
  shareNotes,
  onBegin,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          {/* Logos */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-5" />
            {clientLogoUrl && (
              <>
                <span className="text-border text-xs">/</span>
                <img src={clientLogoUrl} alt="" className="h-5 object-contain admin-logo" />
              </>
            )}
          </div>

          {/* Eyebrow */}
          {clientName && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Script for {clientName}
            </p>
          )}

          {/* Title */}
          <h1 className="font-display text-2xl font-bold text-foreground">
            {scriptTitle}
          </h1>

          {/* Version */}
          <p className="text-xs text-muted-foreground mt-1">v{versionLabel}</p>
        </div>

        {/* What to look for */}
        {shareNotes && (
          <div className="mb-6">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              What to Look For
            </label>
            <div className="w-full px-3 py-2.5 bg-black border border-border rounded-lg text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {shareNotes}
            </div>
          </div>
        )}

        {/* Begin button */}
        <button
          onClick={onBegin}
          className={`relative w-full px-4 py-3 font-medium rounded-lg overflow-hidden border transition-all duration-300 text-black bg-white border-white cursor-pointer hover:bg-white/90`}
        >
          View Script
        </button>
      </div>
    </div>
  );
}
