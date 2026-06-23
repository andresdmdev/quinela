import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';

export interface AdminProfileRecord {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_enabled: boolean;
  created_at: string;
}

interface AdminProfilesResponse {
  profiles: AdminProfileRecord[];
}

/**
 * Returns all profiles for the admin panel.
 * Only accessible by the admin email.
 */
export const GET: APIRoute = async ({ cookies }) => {
  const accessToken: string | undefined = cookies.get('sb-access-token')?.value;
  const refreshToken: string | undefined = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (sessionError || !data.session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (data.session.user.email !== ADMIN_EMAIL) {
    return new Response('Forbidden', { status: 403 });
  }

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, avatar_url, is_enabled, created_at')
    .order('created_at', { ascending: false }) as { data: AdminProfileRecord[] | null; error: Error | null };

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const response: AdminProfilesResponse = { profiles: profiles ?? [] };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
