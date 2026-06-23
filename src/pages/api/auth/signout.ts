import type { APIRoute } from 'astro';

/**
 * Clears the session cookies and redirects to the login page.
 */
export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  return redirect('/login');
};
