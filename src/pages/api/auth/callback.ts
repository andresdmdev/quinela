import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';

/**
 * Returns a safe redirect path.
 * Rejects absolute URLs and localhost redirects in production.
 */
function getSafeRedirectPath(redirectTo: string | null, isProduction: boolean): string {
  const fallback = '/';

  if (!redirectTo) {
    return fallback;
  }

  // Only allow relative paths.
  if (!redirectTo.startsWith('/')) {
    return fallback;
  }

  // In production, block any path that points to localhost.
  if (isProduction && redirectTo.includes('localhost')) {
    console.warn('Blocked localhost redirect in production:', redirectTo);
    return fallback;
  }

  return redirectTo;
}

/**
 * Handles the OAuth callback from Google and creates a session.
 * Also ensures a profile exists in Supabase for the authenticated user.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode: string | null = url.searchParams.get('code');
  const rawRedirectTo: string | null = url.searchParams.get('redirectTo');
  const isProduction = import.meta.env.PROD;
  const redirectTo = getSafeRedirectPath(rawRedirectTo, isProduction);

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
    secure: isProduction,
    sameSite: 'lax'
  });

  cookies.set('sb-refresh-token', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  });

  // Ensure profile exists. Preserve existing is_enabled status on subsequent logins
  // so admin activations are not reset. Only set display_name on first login.
  const isAdmin = user.email === ADMIN_EMAIL;
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_enabled, display_name')
    .eq('id', user.id)
    .maybeSingle() as { data: { is_enabled: boolean; display_name: string | null } | null; error: Error | null };

  const isNewUser = !existingProfile;
  const displayName = isNewUser
    ? ((user.user_metadata?.full_name as string | undefined)
        ?? (user.user_metadata?.name as string | undefined)
        ?? 'Jugador')
    : existingProfile.display_name;

  await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name: displayName,
    avatar_url: avatarUrl,
    is_enabled: existingProfile?.is_enabled ?? isAdmin
  }, { onConflict: 'id' });

  return redirect(redirectTo);
};
