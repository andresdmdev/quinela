import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';

export interface ProfileMeResponse {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_enabled: boolean;
  is_admin: boolean;
  available_points: number;
}

/**
 * Returns the current user's minimal profile information.
 * Used by client components like the bottom navigation bar.
 */
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const isAdmin = user.email === ADMIN_EMAIL;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, avatar_url, is_enabled, available_points')
    .eq('id', user.id)
    .single() as { data: Omit<ProfileMeResponse, 'is_admin'> | null; error: Error | null };

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const response: ProfileMeResponse = {
    ...profile!,
    is_admin: isAdmin
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
