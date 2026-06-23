import { defineMiddleware } from 'astro:middleware';
import { supabase } from '../lib/supabase';

/**
 * Validates the Supabase session from cookies on each request.
 * Redirects unauthenticated users to the login page for protected routes.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const publicRoutes: string[] = ['/login', '/api/auth/signin', '/api/auth/callback', '/api/auth/signout'];
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

  context.locals.user = data.session.user;
  return next();
});
