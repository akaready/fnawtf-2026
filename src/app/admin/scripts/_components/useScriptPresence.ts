'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  userId: string;
  email: string;
  joinedAt: string;
}

interface UseScriptPresenceOptions {
  scriptId: string;
  /** Called when a conflict is detected (another user saved) */
  onConflict?: () => void;
}

export function useScriptPresence({ scriptId, onConflict }: UseScriptPresenceOptions) {
  const [otherUsers, setOtherUsers] = useState<PresenceUser[]>([]);
  const [conflictDetected, setConflictDetected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Track the script's updated_at when we loaded it
  const lastKnownUpdatedAtRef = useRef<string | null>(null);

  const updateLastKnownTimestamp = useCallback((ts: string) => {
    lastKnownUpdatedAtRef.current = ts;
  }, []);

  const dismissConflict = useCallback(() => {
    setConflictDetected(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      userIdRef.current = user.id;

      const channel = supabase.channel(`script:${scriptId}`, {
        config: { presence: { key: user.id } },
      });

      channel.on('presence', { event: 'sync' }, () => {
        if (!mounted) return;
        const state = channel.presenceState<{ email: string; joined_at: string }>();
        const users: PresenceUser[] = [];
        for (const [key, presences] of Object.entries(state)) {
          if (key === user.id) continue;
          const p = presences[0];
          if (p) users.push({ userId: key, email: p.email, joinedAt: p.joined_at });
        }
        setOtherUsers(users);
      });

      // Listen for broadcast messages about saves
      channel.on('broadcast', { event: 'script_saved' }, (payload) => {
        if (!mounted) return;
        const senderId = (payload.payload as { userId?: string })?.userId;
        if (senderId && senderId !== user.id) {
          setConflictDetected(true);
          onConflict?.();
        }
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            email: user.email ?? 'Unknown',
            joined_at: new Date().toISOString(),
          });
        }
      });

      channelRef.current = channel;
    }

    void init();

    return () => {
      mounted = false;
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [scriptId, onConflict]);

  /** Call this after saving to notify other users */
  const broadcastSave = useCallback(() => {
    if (channelRef.current && userIdRef.current) {
      void channelRef.current.send({
        type: 'broadcast',
        event: 'script_saved',
        payload: { userId: userIdRef.current },
      });
    }
  }, []);

  return {
    otherUsers,
    conflictDetected,
    dismissConflict,
    broadcastSave,
    updateLastKnownTimestamp,
  };
}
