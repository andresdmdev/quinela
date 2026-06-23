import { defineMiddleware } from 'astro:middleware';
import { supabase, supabaseAdmin } from '../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';
const publicRoutes: string[] = [
  '/login',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/signout',
  '/no-habilitado',
  '/api/profile/me'
];

/**
 * Validates the Supabase session from cookies on each request.
 * Redirects unauthenticated users to the login page.
 * Redirects non-enabled users (except admin) to the no-access page.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const pathname: string = context.url.pathname;

  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return next();
  }

  const accessToken: string | undefined = context.cookies.get('sb-access-token')?.value;
  const refreshToken: string | undefined = context.cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return context.redirect('/login');
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (error || !data.session) {
    context.cookies.delete('sb-access-token', { path: '/' });
    context.cookies.delete('sb-refresh-token', { path: '/' });
    return context.redirect('/login');
  }

  const user = data.session.user;
  const isAdmin = user.email === ADMIN_EMAIL;

  if (!isAdmin) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_enabled')
      .eq('id', user.id)
      .single() as { data: { is_enabled: boolean } | null; error: Error | null };

    if (profileError || !profile || !profile.is_enabled) {
      return context.redirect('/no-habilitado');
    }
  }

  context.locals.user = user;
  return next();
});
