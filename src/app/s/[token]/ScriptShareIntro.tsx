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
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-black">
      <div className="relative w-full max-w-lg text-center">
        {/* Logos */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <img src="/images/logo/fna-logo.svg" alt="FNA" className="h-6" />
          {clientLogoUrl && (
            <>
              <span className="text-border text-sm">/</span>
              <img src={clientLogoUrl} alt="" className="h-6 object-contain admin-logo" />
            </>
          )}
        </div>

        {/* Client / project eyebrow */}
        {clientName && (
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
            {clientName}
          </p>
        )}

        {/* Script title */}
        <h1 className="font-display text-3xl font-bold text-foreground leading-tight mb-2">
          {scriptTitle}
        </h1>

        {/* Version */}
        <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-muted-foreground bg-white/[0.05] border border-border rounded-full mb-8">
          v{versionLabel}
        </span>

        {/* What to look for */}
        {shareNotes && (
          <div className="bg-white/[0.03] border border-border rounded-xl px-6 py-5 text-left mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-2">
              What to Look For
            </p>
            <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
              {shareNotes}
            </p>
          </div>
        )}

        {/* Begin button */}
        <button
          onClick={onBegin}
          className="relative px-10 py-3.5 font-medium rounded-lg overflow-hidden border text-black bg-white border-white cursor-pointer hover:bg-white/90 transition-all duration-300 text-sm"
        >
          Begin
        </button>
      </div>
    </div>
  );
}
