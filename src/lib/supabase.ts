// Re-exporta o cliente oficial gerado pela integração Lovable Cloud.
// Não criamos um novo client aqui para evitar erro "supabaseUrl is required"
// quando VITE_SUPABASE_ANON_KEY não está definido (usamos VITE_SUPABASE_PUBLISHABLE_KEY).
export { supabase } from '@/integrations/supabase/client';
