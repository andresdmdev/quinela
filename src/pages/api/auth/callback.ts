import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';

/**
 * Handles the OAuth callback from Google and creates a session.
 * Also ensures a profile exists in Supabase for the authenticated user.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode: string | null = url.searchParams.get('code');
  const redirectTo: string = url.searchParams.get('redirectTo') ?? '/';

  if (!authCode) {
    return new Response('No code provided', { status: 400 });
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const accessToken: string = data.session.access_token;
  const refreshToken: string = data.session.refresh_token;
  const user = data.session.user;

  cookies.set('sb-access-token', accessToken, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax'
  });

  cookies.set('sb-refresh-token', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax'
  });

  // Ensure profile exists. Admins are enabled by default, everyone else disabled.
  const isAdmin = user.email === ADMIN_EMAIL;
  const displayName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? 'Jugador';
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name: displayName,
    avatar_url: avatarUrl,
    is_enabled: isAdmin
  }, { onConflict: 'id' });

  return redirect(redirectTo);
};
