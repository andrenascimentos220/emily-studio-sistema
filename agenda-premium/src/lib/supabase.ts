import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Atenção: URL ou Chave do Supabase não encontradas no arquivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);