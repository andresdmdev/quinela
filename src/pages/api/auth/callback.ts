import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

/**
 * Handles the OAuth callback from Google and creates a session.
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

  return redirect(redirectTo);
};
