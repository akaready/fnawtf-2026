'use client';

import { ArrowLeft, Download, Maximize2, Minimize2, Plus, X } from 'lucide-react';
import { useChatContext } from './ChatContext';
import { ChatHistoryList } from './ChatHistoryList';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const {
    view, setView, close, activeConversationId, startNewChat,
    messages, conversations, isSidebarMode, toggleSidebarMode,
  } = useChatContext();

  const isChat = view === 'chat';
  const canGoBack = !isChat && activeConversationId && messages.length > 0;
  const activeTitle = conversations.find((c) => c.id === activeConversationId)?.title;

  const exportChat = () => {
    if (messages.length === 0) return;

    const conv = conversations.find((c) => c.id === activeConversationId);
    const title = conv?.title || 'New Chat';
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const lines = [`# Chat Export — ${title}`, date, ''];
    for (const msg of messages) {
      const label = msg.role === 'user' ? '**You**' : '**Assistant**';
      lines.push(`${label}:\n${msg.content}\n`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()}-export.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-admin-bg-sidebar overflow-hidden ${
      isSidebarMode
        ? ''
        : 'border border-admin-border rounded-2xl shadow-2xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-admin-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isChat && (
            <button
              onClick={() => setView('history')}
              className="p-1 -ml-1 rounded-md hover:bg-admin-bg-hover text-[#888] hover:text-admin-text-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          {canGoBack && (
            <button
              onClick={() => setView('chat')}
              className="p-1 -ml-1 rounded-md hover:bg-admin-bg-hover text-[#888] hover:text-admin-text-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <h2 className="text-sm font-medium text-admin-text-primary truncate">
            {isChat ? (activeTitle || 'New Chat') : 'Chats'}
          </h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isChat && (
            <button
              onClick={startNewChat}
              className="p-1 rounded-md hover:bg-admin-bg-hover text-[#888] hover:text-admin-text-primary transition-colors"
              title="New chat"
            >
              <Plus size={16} />
            </button>
          )}
          {isChat && messages.length > 0 && (
            <button
              onClick={exportChat}
              className="p-1 rounded-md hover:bg-admin-bg-hover text-[#888] hover:text-admin-text-primary transition-colors"
              title="Export as markdown"
            >
              <Download size={14} />
            </button>
          )}
          <button
            onClick={toggleSidebarMode}
            className="p-1 rounded-md hover:bg-admin-bg-hover text-[#888] hover:text-admin-text-primary transition-colors"
            title={isSidebarMode ? 'Minimize to floating' : 'Expand to sidebar'}
          >
            {isSidebarMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={close}
            className="p-1 rounded-md hover:bg-admin-bg-hover text-[#888] hover:text-admin-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isChat ? (
        <>
          <ChatMessageList />
          <ChatInput />
        </>
      ) : (
        <ChatHistoryList />
      )}
    </div>
  );
}
