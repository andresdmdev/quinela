import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';

interface ToggleRequest {
  profileId: string;
  isEnabled: boolean;
}

/**
 * Enables or disables a profile. Only accessible by the admin email.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
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

  let body: ToggleRequest;

  try {
    body = (await request.json()) as ToggleRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { profileId, isEnabled } = body;

  if (!profileId || typeof isEnabled !== 'boolean') {
    return new Response(JSON.stringify({ error: 'profileId and isEnabled are required' }), { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_enabled: isEnabled })
    .eq('id', profileId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
