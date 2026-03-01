'use client';

import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

interface Props {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
          isUser ? 'bg-admin-bg-active' : 'bg-admin-accent/20'
        }`}
      >
        {isUser ? (
          <User size={12} className="text-white/60" />
        ) : (
          <Bot size={12} className="text-admin-accent" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-admin-bg-active text-admin-text-primary'
            : 'bg-transparent text-[#ccc]'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="chat-markdown prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-xs [&_code]:bg-admin-bg-active [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-admin-bg-hover [&_pre]:rounded-lg [&_pre]:p-2">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 bg-admin-accent/20">
        <Bot size={12} className="text-admin-accent" />
      </div>
      <div className="bg-transparent px-3.5 py-3 rounded-2xl">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
