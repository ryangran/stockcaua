// Re-exporta o cliente oficial gerado pela integração Lovable Cloud.
// Cast para SupabaseClient não-tipado pois api.ts usa tabelas customizadas
// que ainda não estão no Database types gerado.
import { supabase as typedSupabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const supabase = typedSupabase as unknown as SupabaseClient;
