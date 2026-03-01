'use client';

import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { useChatContext } from './ChatContext';
import { ChatMessage, TypingIndicator } from './ChatMessage';

export function ChatMessageList() {
  const { messages, isStreaming, streamingText } = useChatContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-10 h-10 rounded-full bg-admin-accent/10 flex items-center justify-center mb-3">
          <Bot size={20} className="text-admin-accent" />
        </div>
        <p className="text-sm text-[#888] mb-1">Ask me anything</p>
        <p className="text-xs text-admin-text-faint">
          I have access to all your projects, clients, contacts, proposals, and more.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      style={{ scrollbarWidth: 'none' }}
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
      ))}
      {isStreaming && streamingText && (
        <ChatMessage role="assistant" content={streamingText} />
      )}
      {isStreaming && !streamingText && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
