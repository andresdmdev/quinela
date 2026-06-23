import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

/**
 * Initiates the Google OAuth sign-in flow.
 */
export const POST: APIRoute = async ({ request, redirect }) => {
  const formData: FormData = await request.formData();
  const provider: string | null = formData.get('provider')?.toString() ?? null;
  const redirectTo: string = formData.get('redirectTo')?.toString() ?? '/';

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
