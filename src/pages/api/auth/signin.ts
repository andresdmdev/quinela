import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

/**
 * Returns a safe redirect path for use after OAuth.
 * Only relative paths starting with '/' are allowed.
 */
function getSafeRedirectPath(redirectTo: string | null): string {
  if (!redirectTo || !redirectTo.startsWith('/')) {
    return '/';
  }

  return redirectTo;
}

/**
 * Initiates the Google OAuth sign-in flow.
 */
export const POST: APIRoute = async ({ request, redirect }) => {
  const formData: FormData = await request.formData();
  const provider: string | null = formData.get('provider')?.toString() ?? null;
  const rawRedirectTo: string | null = formData.get('redirectTo')?.toString() ?? null;
  const redirectTo: string = getSafeRedirectPath(rawRedirectTo);

  if (provider !== 'google') {
    return new Response('Invalid provider', { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${new URL(request.url).origin}/api/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
    }
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect(data.url);
};
