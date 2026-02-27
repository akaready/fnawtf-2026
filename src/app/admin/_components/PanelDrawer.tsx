'use client';

import { type ReactNode } from 'react';

interface PanelDrawerProps {
  open: boolean;
  onClose: () => void;
  width?: string;
  children: ReactNode;
}

/**
 * Universal side panel shell — backdrop + slide-in drawer.
 * Use this as the outer wrapper for all record panels (CompanyPanel, ProjectPanel, etc.).
 */
export function PanelDrawer({ open, onClose, width = 'w-[480px]', children }: PanelDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 ${width} bg-[#0e0e0e] border-l border-[#2a2a2a] z-[101] flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {children}
      </div>
    </>
  );
}
