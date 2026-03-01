'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, MessageCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import { useChatContext } from './ChatContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ChatHistoryList() {
  const {
    conversations,
    loadConversations,
    openConversation,
    startNewChat,
    deleteConversation,
    renameConversation,
  } = useChatContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const startEdit = (id: string, currentTitle: string | null) => {
    setEditingId(id);
    setEditValue(currentTitle || '');
  };

  const confirmEdit = () => {
    if (editingId && editValue.trim()) {
      renameConversation(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* New chat button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-admin-bg-hover hover:bg-admin-bg-hover-strong text-sm text-admin-text-primary transition-colors"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 admin-scrollbar-auto"
      >
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={24} className="mx-auto text-admin-text-placeholder mb-2" />
            <p className="text-xs text-admin-text-faint">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="group flex items-center rounded-lg hover:bg-admin-bg-hover transition-colors cursor-pointer"
            >
              {editingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1 px-3 py-2">
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="flex-1 bg-transparent text-sm text-admin-text-primary outline-none border-b border-admin-border"
                  />
                  <button
                    onClick={confirmEdit}
                    className="p-1 text-admin-success hover:text-admin-success"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-admin-text-faint hover:text-admin-text-primary"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openConversation(conv.id)}
                    className="flex-1 text-left px-3 py-2.5 min-w-0"
                  >
                    <p className="text-sm text-admin-text-primary truncate">
                      {conv.title || 'Untitled chat'}
                    </p>
                    <p className="text-[10px] text-admin-text-faint mt-0.5">
                      {timeAgo(conv.updated_at)}
                    </p>
                  </button>
                  <div className={`flex-shrink-0 flex items-center transition-all ${deletingId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {deletingId === conv.id ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                            setDeletingId(null);
                          }}
                          className="p-2 text-admin-danger hover:text-red-300 transition-colors"
                          title="Confirm delete"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="p-2 text-admin-text-faint hover:text-admin-text-primary transition-colors"
                          title="Cancel"
                        >
                          <X size={11} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(conv.id, conv.title);
                          }}
                          className="p-2 text-admin-text-faint hover:text-admin-text-primary transition-colors"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(conv.id);
                          }}
                          className="p-2 text-admin-text-faint hover:text-admin-danger transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
