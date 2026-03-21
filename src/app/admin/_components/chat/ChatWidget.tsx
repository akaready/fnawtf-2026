'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from './ChatContext';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const { isOpen, isSidebarMode, toggle, close, toggleSidebarMode } = useChatContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cmd+J shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        if (!isOpen) {
          toggle(); // closed → popup
        } else if (!isSidebarMode) {
          toggleSidebarMode(); // popup → sidebar
        } else {
          close(); // sidebar → closed
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isSidebarMode, toggle, toggleSidebarMode, close]);

  // Click outside to close (only in floating mode)
  useEffect(() => {
    if (!isOpen || isSidebarMode) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        close();
      }
    };
    // Delay to avoid the opening click triggering close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, isSidebarMode, close]);

  // In sidebar mode, AdminShell renders the chat panel inline
  if (isSidebarMode) return null;

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 28,
              mass: 0.8,
            }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-[78px] right-3 z-[115] w-[380px] h-[550px]"
          >
            {/* Outer glow for lift */}
            <div className="absolute -inset-10 rounded-[2rem] bg-radial from-transparent via-black/20 to-black/60 pointer-events-none blur-md" />
            {/* drop-shadow traces the combined alpha of panel + tail as one continuous outline */}
            <div
              className="absolute inset-0"
              style={{ filter: 'drop-shadow(0 0 0.5px rgba(255,255,255,0.7)) drop-shadow(0 0 0.5px rgba(255,255,255,0.7)) drop-shadow(0 8px 40px rgba(0,0,0,0.7))' }}
            >
              <div className="relative h-full">
                <ChatPanel />
              </div>
              {/* Tail — just fill, outline comes from parent drop-shadow */}
              <svg
                className="absolute -bottom-[7px] right-4 pointer-events-none"
                width="18"
                height="11"
                viewBox="0 0 18 11"
              >
                <path d="M0,0 L18,0 L9,11 Z" style={{ fill: 'var(--admin-bg-nav)' }} />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        ref={buttonRef}
        onClick={toggle}
        animate={isOpen ? { scale: 0.9 } : { scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="fixed bottom-3 right-3 z-[115] w-12 h-12 rounded-full bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center" style={{ border: '1.5px solid black' }}
        title="Chat (⌘+J)"
      >
        <MessageCircle size={20} />
      </motion.button>
    </>
  );
}
