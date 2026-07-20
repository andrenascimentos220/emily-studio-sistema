import { createClient } from '@supabase/supabase-js'

// Agora o código busca as chaves de forma segura no ambiente onde está rodando
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)