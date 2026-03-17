'use client';

import { type ReactNode } from 'react';
import { useChatContext } from './chat/ChatContext';

interface PanelDrawerProps {
  open: boolean;
  onClose: () => void;
  width?: string;
  /** Stacking level: 1 = primary panel (default), 2 = overlay panel on top of another */
  level?: 1 | 2;
  children: ReactNode;
}

/**
 * Universal side panel shell — backdrop + slide-in drawer.
 * Use this as the outer wrapper for all record panels (CompanyPanel, ProjectPanel, etc.).
 */
export function PanelDrawer({ open, onClose, width = 'w-[480px]', level = 1, children }: PanelDrawerProps) {
  const { isSidebarMode, isOpen: chatOpen, chatWidth } = useChatContext();
  const rightOffset = open && isSidebarMode && chatOpen ? chatWidth : 0;

  const backdropZ = level === 2 ? 'z-[110]' : 'z-[100]';
  const drawerZ = level === 2 ? 'z-[111]' : 'z-[101]';
  const backdropStyle = level === 2
    ? 'bg-black/20 backdrop-blur-sm'
    : 'bg-black/40 backdrop-blur-sm';

  return (
    <>
      {/* Backdrop — clipped to not cover chat sidebar */}
      <div
        className={`fixed inset-0 ${backdropStyle} ${backdropZ} transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ right: rightOffset }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 ${width} bg-admin-bg-sidebar border-l border-admin-border ${drawerZ} flex flex-col duration-200 shadow-panel ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          right: rightOffset,
          maxWidth: rightOffset > 0 ? `calc(100vw - ${rightOffset}px - 3.5rem)` : undefined,
          transition: 'right 300ms ease-in-out, transform 200ms, max-width 300ms ease-in-out',
        }}
      >
        {children}
      </div>
    </>
  );
}
