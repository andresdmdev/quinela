import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client configured for server-side usage with PKCE flow.
 */
export const supabase: SupabaseClient = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

/**
 * Supabase admin client configured with the service role key.
 * Use only in trusted server endpoints.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
