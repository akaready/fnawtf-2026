'use client';

import type { CallSheetData } from '@/components/callsheet/types';
import { CallSheetHeader } from '@/components/callsheet/CallSheetHeader';
import { CallSheetBulletin } from '@/components/callsheet/CallSheetBulletin';
import { CallSheetLocations } from '@/components/callsheet/CallSheetLocations';
import { CallSheetCast } from '@/components/callsheet/CallSheetCast';
import { CallSheetCrew } from '@/components/callsheet/CallSheetCrew';
import { CallSheetInstructions } from '@/components/callsheet/CallSheetInstructions';
import Image from 'next/image';

interface Props {
  data: CallSheetData;
}

export function CallSheetPage({ data }: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Content */}
      <div className="call-sheet-print max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <CallSheetHeader data={data} />
        {data.bulletins.length > 0 && (
          <CallSheetBulletin bulletins={data.bulletins} />
        )}
        <CallSheetLocations locations={data.locations} />
        {data.cast.length > 0 && <CallSheetCast cast={data.cast} />}
        {data.crew.length > 0 && <CallSheetCrew crew={data.crew} />}
        {data.specialInstructions.length > 0 && (
          <CallSheetInstructions instructions={data.specialInstructions} />
        )}

        {/* Footer — FNA branding */}
        <footer className="flex items-center justify-center gap-3 py-8 border-t border-[var(--border)] opacity-40">
          <Image
            src="/images/logo/fna-logo.svg"
            alt="Friends 'n Allies"
            width={24}
            height={24}
            className="invert"
          />
          <span className="text-xs font-[family-name:var(--font-body)] tracking-wide text-[var(--muted-foreground)]">
            Produced by Friends &apos;n Allies
          </span>
        </footer>
      </div>
    </div>
  );
}
