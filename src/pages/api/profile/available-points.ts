import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

interface Body {
  available_points: number;
}

/**
 * PUT /api/profile/available-points
 * Updates the user's available_points in the profile.
 * Used for syncing ranking points to the database.
 */
export const PUT: APIRoute = async ({ request, cookies }) => {
  const accessToken: string | undefined = cookies.get('sb-access-token')?.value;
  const refreshToken: string | undefined = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (sessionError || !sessionData.session) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { available_points } = body;

  if (typeof available_points !== 'number' || available_points < 0) {
    return new Response('Invalid available_points: must be a non-negative number', { status: 400 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('available_points')
    .eq('id', sessionData.session.user.id)
    .single();

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), { status: 500 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ available_points })
    .eq('id', sessionData.session.user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      new_points: available_points,
      previous_points: profile?.available_points ?? 0
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
