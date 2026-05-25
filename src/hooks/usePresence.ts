import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useStockStore } from '../store/useStockStore';
import type { Terminal } from '../types';

type PresenceState = {
  [key: string]: Array<{ id: string; nome: string; online_at: string }>;
};

export function usePresence() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { terminalId, setTerminaisAtivos } = useStockStore();

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;

    const channel = supabase.channel('stockos_presence', {
      config: { presence: { key: terminalId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as PresenceState;
        const terminais: Terminal[] = Object.entries(state).map(([id, presences]) => ({
          id,
          nome: presences[0]?.nome ?? id,
          online_at: presences[0]?.online_at ?? new Date().toISOString(),
        }));
        setTerminaisAtivos(terminais);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: terminalId,
            nome: terminalId,
            online_at: new Date().toISOString(),
          });
          console.log('[StockOS] Presence conectado:', terminalId);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [terminalId, setTerminaisAtivos]);
}
