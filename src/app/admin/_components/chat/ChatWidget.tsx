'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from './ChatContext';
import { ChatPanel } from './ChatPanel';

export function ChatWidget() {
  const { isOpen, isSidebarMode, toggle, close } = useChatContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cmd+J shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

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
            className="fixed bottom-24 right-6 z-[90] w-[380px] h-[550px]"
          >
            {/* Chat bubble tail */}
            <div
              className="absolute -bottom-[7px] right-4 w-4 h-4 bg-admin-bg-sidebar border-r border-b border-admin-border rotate-45"
            />
            <ChatPanel />
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
        className="fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full bg-white text-black shadow-xl flex items-center justify-center"
        title="Chat (⌘+J)"
      >
        <MessageCircle size={20} />
      </motion.button>
    </>
  );
}
