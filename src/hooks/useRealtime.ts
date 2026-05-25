import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useStockStore } from '../store/useStockStore';
import type { Produto, Movimentacao, Compra, Kit, Producao, Retorno } from '../types';

type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
};

export function useRealtime() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const {
    upsertProduto,
    removeProduto,
    addMovimentacao,
    addCompra,
    upsertKit,
    removeKit,
    addProducao,
    addRetorno,
    terminalId,
  } = useStockStore();

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;

    const channel = supabase
      .channel('stockos_realtime')

      .on<Produto>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos' },
        (payload) => {
          const p = payload as unknown as RealtimePayload<Produto>;
          if (p.eventType === 'DELETE') {
            removeProduto((p.old as Produto).id);
          } else {
            upsertProduto(p.new);
          }
        }
      )

      .on<Movimentacao>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movimentacoes' },
        (payload) => {
          const mov = (payload as unknown as RealtimePayload<Movimentacao>).new;
          if (mov.terminal !== terminalId) {
            addMovimentacao(mov);
          }
        }
      )

      .on<Compra>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'compras' },
        (payload) => {
          const compra = (payload as unknown as RealtimePayload<Compra>).new;
          if (compra) addCompra(compra);
        }
      )

      .on<Kit>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kits' },
        (payload) => {
          const p = payload as unknown as RealtimePayload<Kit>;
          if (p.eventType === 'DELETE') {
            removeKit((p.old as Kit).id);
          } else {
            upsertKit(p.new);
          }
        }
      )

      .on<Producao>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'producoes' },
        (payload) => {
          const producao = (payload as unknown as RealtimePayload<Producao>).new;
          if (producao.terminal !== terminalId) {
            addProducao(producao);
          }
        }
      )

      .on<Retorno>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'retornos' },
        (payload) => {
          const retorno = (payload as unknown as RealtimePayload<Retorno>).new;
          if (retorno) addRetorno(retorno);
        }
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[StockOS] Realtime conectado');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[StockOS] Erro no canal Realtime');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [terminalId, upsertProduto, removeProduto, addMovimentacao, addCompra, upsertKit, removeKit, addProducao, addRetorno]);
}
