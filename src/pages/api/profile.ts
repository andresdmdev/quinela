import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';

export interface ProfileRecord {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

/**
 * Returns the authenticated user's profile.
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

  const userEmail = data.session.user.email;

  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'User email not available' }), { status: 400 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', userEmail)
    .single() as { data: ProfileRecord | null; error: Error | null };

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ profile }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

/**
 * Updates the authenticated user's display name.
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

  const body = await request.json();
  const displayName: string | undefined = body.displayName;

  if (!displayName || displayName.trim().length === 0) {
    return new Response('Display name is required', { status: 400 });
  }

  const userEmail = data.session.user.email;

  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'User email not available' }), { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('email', userEmail);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
