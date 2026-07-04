import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

const ADMIN_EMAIL = 'andresdmf55@gmail.com';
const AWARD_MULTIPLIER = 3;

/**
 * Recomputes available_points for a user from the source of truth tables.
 * Formula: matchPoints + settledAwardWinnings - activeAwardWagers
 */
async function computeAvailablePoints(userId: string): Promise<number> {
  const { data: matchPointsData } = await supabaseAdmin
    .from('match_points')
    .select('points')
    .eq('user_id', userId);

  const { data: settledAwards } = await supabaseAdmin
    .from('award_predictions')
    .select('points_wagered')
    .eq('user_id', userId)
    .eq('is_winner', true);

  const { data: activeWagers } = await supabaseAdmin
    .from('award_predictions')
    .select('points_wagered')
    .eq('user_id', userId)
    .is('is_winner', null);

  const matchPoints = (matchPointsData ?? []).reduce((sum, mp) => sum + mp.points, 0);
  const settledWinnings = (settledAwards ?? []).reduce((sum, ap) => sum + ap.points_wagered * AWARD_MULTIPLIER, 0);
  const activeWagered = (activeWagers ?? []).reduce((sum, ap) => sum + ap.points_wagered, 0);

  return matchPoints + settledWinnings - activeWagered;
}

/**
 * Resets available_points to the correct computed value for all enabled users.
 * Uses the source of truth: match_points and award_predictions tables.
 */
async function runMigration(): Promise<Response> {
  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_enabled', true);

    if (profilesError) {
      return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
    }

    const results: { userId: string; newAvailable: number }[] = [];
    const errors: { userId: string; error: string }[] = [];

    for (const profile of profiles ?? []) {
      const newAvailable = await computeAvailablePoints(profile.id);

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ available_points: newAvailable })
        .eq('id', profile.id);

      if (updateError) {
        errors.push({ userId: profile.id, error: updateError.message });
      } else {
        results.push({
          userId: profile.id,
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
}

/**
 * GET /api/admin/migrate-points
 * Admin-only endpoint to reset available_points from source tables.
 */
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (user.email !== ADMIN_EMAIL) {
    return new Response('Admin only', { status: 403 });
  }

  return runMigration();
};

/**
 * POST /api/admin/migrate-points
 * Admin-only endpoint to reset available_points from source tables.
 */
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (user.email !== ADMIN_EMAIL) {
    return new Response('Admin only', { status: 403 });
  }

  return runMigration();
};
