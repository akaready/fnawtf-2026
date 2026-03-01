'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Conversation, Message, ModelId } from './types';

interface PageContext {
  route: string;
  recordId?: string;
  recordType?: string;
}

interface ChatState {
  isOpen: boolean;
  isSidebarMode: boolean;
  view: 'history' | 'chat';
  activeConversationId: string | null;
  conversations: Conversation[];
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  selectedModel: ModelId;
}

interface ChatContextValue extends ChatState {
  toggle: () => void;
  close: () => void;
  setView: (view: 'history' | 'chat') => void;
  setSelectedModel: (model: ModelId) => void;
  loadConversations: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  startNewChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  toggleSidebarMode: () => void;
  getContext: () => PageContext;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<ChatState>({
    isOpen: false,
    isSidebarMode: false,
    view: 'history',
    activeConversationId: null,
    conversations: [],
    messages: [],
    isStreaming: false,
    streamingText: '',
    selectedModel: 'haiku',
  });

  const abortRef = useRef<AbortController | null>(null);

  const supabase = createClient();

  const getContext = useCallback((): PageContext => {
    const segments = pathname.split('/').filter(Boolean);
    // Pattern: /admin/{section}/{id}
    const context: PageContext = { route: pathname };
    if (segments.length >= 3 && segments[0] === 'admin') {
      context.recordType = segments[1].replace(/s$/, ''); // "projects" -> "project"
      context.recordId = segments[2];
    }
    // Also check for ?open= param (used by some pages)
    const openId = searchParams.get('open');
    if (openId && segments.length >= 2) {
      context.recordType = segments[1].replace(/s$/, '');
      context.recordId = openId;
    }
    return context;
  }, [pathname, searchParams]);

  const toggle = useCallback(() => {
    setState((s) => ({ ...s, isOpen: !s.isOpen }));
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false, isSidebarMode: false }));
  }, []);

  const toggleSidebarMode = useCallback(() => {
    setState((s) => ({ ...s, isSidebarMode: !s.isSidebarMode, isOpen: true }));
  }, []);

  const setView = useCallback((view: 'history' | 'chat') => {
    setState((s) => ({ ...s, view }));
  }, []);

  const setSelectedModel = useCallback((model: ModelId) => {
    setState((s) => ({ ...s, selectedModel: model }));
  }, []);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) {
      setState((s) => ({ ...s, conversations: data as Conversation[] }));
    }
  }, [supabase]);

  const openConversation = useCallback(
    async (id: string) => {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      // Get conversation model
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('model')
        .eq('id', id)
        .single() as { data: { model: string } | null };

      setState((s) => ({
        ...s,
        activeConversationId: id,
        messages: (messages as Message[]) || [],
        view: 'chat',
        selectedModel: (conv?.model as ModelId) || 'haiku',
      }));
    },
    [supabase],
  );

  const startNewChat = useCallback(() => {
    setState((s) => ({
      ...s,
      activeConversationId: null,
      messages: [],
      view: 'chat',
      streamingText: '',
    }));
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      // Remove from UI immediately
      setState((s) => ({
        ...s,
        conversations: s.conversations.filter((c) => c.id !== id),
        ...(s.activeConversationId === id
          ? { activeConversationId: null, messages: [], view: 'history' as const }
          : {}),
      }));
      // Delete messages first (FK constraint), then conversation
      await supabase.from('chat_messages').delete().eq('conversation_id', id);
      await supabase.from('chat_conversations').delete().eq('id', id);
    },
    [supabase],
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      await supabase
        .from('chat_conversations')
        .update({ title } as never)
        .eq('id', id);
      setState((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, title } : c,
        ),
      }));
    },
    [supabase],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (state.isStreaming) return;

      const context = getContext();

      // Optimistically add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: state.activeConversationId || '',
        role: 'user',
        content: text,
        context: context as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
      };

      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        isStreaming: true,
        streamingText: '',
      }));

      try {
        abortRef.current = new AbortController();

        const res = await fetch('/api/admin/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: state.activeConversationId,
            message: text,
            context,
            model: state.selectedModel,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Chat request failed');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let convId = state.activeConversationId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.slice(6));

            if (data.type === 'conversation_id') {
              convId = data.id;
              const title = data.title || null;
              setState((s) => {
                const exists = s.conversations.some((c) => c.id === convId);
                const conversations = exists
                  ? s.conversations
                  : [{ id: convId!, title, model: s.selectedModel, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '' } as Conversation, ...s.conversations];
                return { ...s, activeConversationId: convId, conversations };
              });
            } else if (data.type === 'text') {
              fullText += data.text;
              setState((s) => ({ ...s, streamingText: fullText }));
            } else if (data.type === 'done') {
              // Add complete assistant message
              const assistantMsg: Message = {
                id: crypto.randomUUID(),
                conversation_id: convId || '',
                role: 'assistant',
                content: fullText,
                context: null,
                created_at: new Date().toISOString(),
              };
              setState((s) => ({
                ...s,
                messages: [...s.messages, assistantMsg],
                isStreaming: false,
                streamingText: '',
              }));
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Show error as assistant message
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: state.activeConversationId || '',
          role: 'assistant',
          content: `Error: ${(err as Error).message}`,
          context: null,
          created_at: new Date().toISOString(),
        };
        setState((s) => ({
          ...s,
          messages: [...s.messages, errorMsg],
          isStreaming: false,
          streamingText: '',
        }));
      }
    },
    [state.isStreaming, state.activeConversationId, state.selectedModel, getContext],
  );

  return (
    <ChatCtx.Provider
      value={{
        ...state,
        toggle,
        close,
        setView,
        setSelectedModel,
        loadConversations,
        openConversation,
        startNewChat,
        sendMessage,
        deleteConversation,
        renameConversation,
        toggleSidebarMode,
        getContext,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}
