import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton instance - initialized lazily
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are not configured');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        }
    });
}

// Use a getter pattern for lazy initialization
// This ensures the client is only created when actually accessed
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        if (!supabaseInstance) {
            supabaseInstance = createSupabaseClient();
        }
        const value = (supabaseInstance as unknown as Record<string | symbol, unknown>)[prop];
        // Bind functions to the instance to preserve 'this' context
        if (typeof value === 'function') {
            return value.bind(supabaseInstance);
        }
        return value;
    }
});

