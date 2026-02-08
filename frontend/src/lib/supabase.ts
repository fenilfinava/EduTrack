import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Simple singleton pattern - initializes on first import in browser
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are not configured');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        }
    });

    return supabaseInstance;
}

// Export the client directly for browser usage
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : ({} as SupabaseClient);
