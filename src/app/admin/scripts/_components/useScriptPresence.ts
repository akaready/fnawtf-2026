'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  userId: string;
  email: string;
  joinedAt: string;
}

export interface CellLock {
  userId: string;
  email: string;
}

/** Key format: `${beatId}:${field}` or `scene:${sceneId}` */
export type LockedCellsMap = Map<string, CellLock>;

export function cellLockKey(beatId: string, field: string) {
  return `${beatId}:${field}`;
}

export function sceneLockKey(sceneId: string) {
  return `scene:${sceneId}`;
}

const LOCK_EXPIRY_MS = 30_000;

interface UseScriptPresenceOptions {
  scriptId: string;
  onConflict?: () => void;
}

export function useScriptPresence({ scriptId, onConflict }: UseScriptPresenceOptions) {
  const [otherUsers, setOtherUsers] = useState<PresenceUser[]>([]);
  const [conflictDetected, setConflictDetected] = useState(false);
  const [lockedCells, setLockedCells] = useState<LockedCellsMap>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const lockTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        // Debounce: brief disconnects (Supabase reconnects) cause rapid sync
        // events that make the indicator flicker. Settle for 1.5s before updating.
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          if (!mounted) return;
          const state = channel.presenceState<{ email: string; joined_at: string }>();
          const users: PresenceUser[] = [];
          for (const [key, presences] of Object.entries(state)) {
            if (key === user.id) continue;
            const p = presences[0];
            if (p) users.push({ userId: key, email: p.email, joinedAt: p.joined_at });
          }
          setOtherUsers(users);
        }, 1500);
      });

      // When a user leaves, clear all their locks
      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (!mounted) return;
        const leftIds = new Set(leftPresences.map((p: { presence_ref: string }) => {
          // presence key is the userId
          return Object.entries(channel.presenceState()).find(
            ([, vals]) => vals.some((v: { presence_ref: string }) => v.presence_ref === p.presence_ref)
          )?.[0];
        }).filter(Boolean));
        if (leftIds.size === 0) return;
        setLockedCells(prev => {
          const next = new Map(prev);
          let changed = false;
          for (const [key, lock] of next) {
            if (leftIds.has(lock.userId)) { next.delete(key); changed = true; }
          }
          return changed ? next : prev;
        });
      });

      channel.on('broadcast', { event: 'script_saved' }, (payload) => {
        if (!mounted) return;
        const senderId = (payload.payload as { userId?: string })?.userId;
        if (senderId && senderId !== user.id) {
          setConflictDetected(true);
          onConflict?.();
        }
      });

      // Cell lock/unlock
      channel.on('broadcast', { event: 'cell_lock' }, (payload) => {
        if (!mounted) return;
        const p = payload.payload as { userId: string; email: string; key: string };
        if (p.userId === user.id) return;
        setLockedCells(prev => {
          const next = new Map(prev);
          next.set(p.key, { userId: p.userId, email: p.email });
          return next;
        });
        // Auto-expire
        const existing = lockTimersRef.current.get(p.key);
        if (existing) clearTimeout(existing);
        lockTimersRef.current.set(p.key, setTimeout(() => {
          setLockedCells(prev => {
            const next = new Map(prev);
            next.delete(p.key);
            return next;
          });
          lockTimersRef.current.delete(p.key);
        }, LOCK_EXPIRY_MS));
      });

      channel.on('broadcast', { event: 'cell_unlock' }, (payload) => {
        if (!mounted) return;
        const p = payload.payload as { userId: string; key: string };
        if (p.userId === user.id) return;
        setLockedCells(prev => {
          const next = new Map(prev);
          next.delete(p.key);
          return next;
        });
        const timer = lockTimersRef.current.get(p.key);
        if (timer) { clearTimeout(timer); lockTimersRef.current.delete(p.key); }
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
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      for (const timer of lockTimersRef.current.values()) clearTimeout(timer);
      lockTimersRef.current.clear();
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [scriptId, onConflict]);

  const broadcastSave = useCallback(() => {
    if (channelRef.current && userIdRef.current) {
      void channelRef.current.send({
        type: 'broadcast',
        event: 'script_saved',
        payload: { userId: userIdRef.current },
      });
    }
  }, []);

  const broadcastLock = useCallback((key: string) => {
    if (channelRef.current && userIdRef.current) {
      const user = channelRef.current.presenceState()[userIdRef.current]?.[0] as { email?: string } | undefined;
      void channelRef.current.send({
        type: 'broadcast',
        event: 'cell_lock',
        payload: { userId: userIdRef.current, email: user?.email ?? 'Unknown', key },
      });
    }
  }, []);

  const broadcastUnlock = useCallback((key: string) => {
    if (channelRef.current && userIdRef.current) {
      void channelRef.current.send({
        type: 'broadcast',
        event: 'cell_unlock',
        payload: { userId: userIdRef.current, key },
      });
    }
  }, []);

  return {
    otherUsers,
    conflictDetected,
    dismissConflict,
    broadcastSave,
    broadcastLock,
    broadcastUnlock,
    lockedCells,
    updateLastKnownTimestamp,
  };
}
