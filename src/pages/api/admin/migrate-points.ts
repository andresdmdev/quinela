import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';

/**
 * POST /api/admin/migrate-points
 * Admin-only endpoint to synchronize available_points with match_points + award_winnings.
 * This fixes any discrepancies between the two point systems.
 */
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (user.email !== ADMIN_EMAIL) {
    return new Response('Admin only', { status: 403 });
  }

  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_enabled', true);

    if (profilesError) {
      return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
    }

    const { data: matchPointsData, error: matchPointsError } = await supabaseAdmin
      .from('match_points')
      .select('user_id, points');

    if (matchPointsError) {
      return new Response(JSON.stringify({ error: matchPointsError.message }), { status: 500 });
    }

    const { data: awardPredictions, error: awardError } = await supabaseAdmin
      .from('award_predictions')
      .select('user_id, points_wagered, is_winner')
      .eq('is_winner', true);

    if (awardError) {
      return new Response(JSON.stringify({ error: awardError.message }), { status: 500 });
    }

    const userMatchPoints: Record<string, number> = {};
    for (const mp of matchPointsData ?? []) {
      userMatchPoints[mp.user_id] = (userMatchPoints[mp.user_id] ?? 0) + mp.points;
    }

    const userAwardWinnings: Record<string, number> = {};
    for (const ap of awardPredictions ?? []) {
      userAwardWinnings[ap.user_id] = (userAwardWinnings[ap.user_id] ?? 0) + ap.points_wagered * 5;
    }

    const results: { userId: string; matchPoints: number; awardWinnings: number; newAvailable: number }[] = [];
    const errors: { userId: string; error: string }[] = [];

    for (const profile of profiles ?? []) {
      const matchPoints = userMatchPoints[profile.id] ?? 0;
      const awardWinnings = userAwardWinnings[profile.id] ?? 0;
      const newAvailable = matchPoints + awardWinnings;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ available_points: newAvailable })
        .eq('id', profile.id);

      if (updateError) {
        errors.push({ userId: profile.id, error: updateError.message });
      } else {
        results.push({
          userId: profile.id,
          matchPoints,
          awardWinnings,
          newAvailable
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        migrated: results.length,
        errors: errors.length > 0 ? errors : undefined,
        details: results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
