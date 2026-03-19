import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validação obrigatória (evita deploy quebrado)
 */
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Supabase não configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
    );
}

/**
 * Cliente Supabase configurado para produção
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    global: {
        headers: {
            "X-Client-Info": "base-studio-pizzas",
        },
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});