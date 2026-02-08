import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        if (!supabaseInstance) {
            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Supabase environment variables are not configured');
            }
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        }
        return (supabaseInstance as unknown as Record<string | symbol, unknown>)[prop];
    }
});
