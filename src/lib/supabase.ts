import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ucetccekkxacurkfchwd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ec7dYMO7H61Il5aAITSDJg_TLlI2OpR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
  auth: {
    persistSession: false,
  },
});
