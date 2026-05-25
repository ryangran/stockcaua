import { createClient } from '@supabase/supabase-js';
import type { Produto, Movimentacao, Compra, Kit, KitItem, Producao, Retorno } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[StockOS] Supabase env vars not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
}

export type Database = {
  public: {
    Tables: {
      produtos: { Row: Produto; Insert: Omit<Produto, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Produto, 'id'>> };
      movimentacoes: { Row: Movimentacao; Insert: Omit<Movimentacao, 'id' | 'created_at' | 'produto'>; Update: never };
      compras: { Row: Compra; Insert: Omit<Compra, 'id' | 'created_at' | 'produto'>; Update: never };
      kits: { Row: Kit; Insert: Omit<Kit, 'id' | 'created_at' | 'itens'>; Update: Partial<Omit<Kit, 'id'>> };
      kit_itens: { Row: KitItem; Insert: Omit<KitItem, 'id' | 'produto'>; Update: never };
      producoes: { Row: Producao; Insert: Omit<Producao, 'id' | 'created_at' | 'kit'>; Update: never };
      retornos: { Row: Retorno; Insert: Omit<Retorno, 'id' | 'created_at' | 'produto'>; Update: never };
    };
  };
};

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
