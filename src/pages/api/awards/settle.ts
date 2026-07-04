import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

interface SettleBody {
  champion: string;
  topScorer: string;
  bestGoalkeeper: string;
}

const ADMIN_EMAIL = 'andresdmf55@gmail.com';
const MULTIPLIER = 3;

/**
 * POST /api/awards/settle
 * Settles all award predictions. Admin only.
 * Body: { champion: string, topScorer: string, bestGoalkeeper: string }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
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

  if (sessionData.session.user.email !== ADMIN_EMAIL) {
    return new Response('Admin only', { status: 403 });
  }

  let body: SettleBody;
  try {
    body = (await request.json()) as SettleBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { champion, topScorer, bestGoalkeeper } = body;

  if (!champion || !topScorer || !bestGoalkeeper) {
    return new Response('Missing required fields', { status: 400 });
  }

  const { data: allPredictions, error: predictionsError } = await supabaseAdmin
    .from('award_predictions')
    .select('*');

  if (predictionsError) {
    return new Response(JSON.stringify({ error: predictionsError.message }), { status: 500 });
  }

  const winners: Record<string, string> = {
    champion,
    top_scorer: topScorer,
    best_goalkeeper: bestGoalkeeper
  };

  const pointsToAward: Record<string, { userId: string; points: number }[]> = {};

  for (const prediction of allPredictions ?? []) {
    const actualWinner = winners[prediction.award_type];
    const isWinner = prediction.prediction === actualWinner;

    await supabaseAdmin
      .from('award_predictions')
      .update({
        is_winner: isWinner,
        settled_at: new Date().toISOString()
      })
      .eq('id', prediction.id);

    if (isWinner) {
      const pointsEarned = prediction.points_wagered * MULTIPLIER;

      if (!pointsToAward[prediction.user_id]) {
        pointsToAward[prediction.user_id] = [];
      }
      pointsToAward[prediction.user_id].push({
        userId: prediction.user_id,
        points: pointsEarned
      });

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('available_points')
        .eq('id', prediction.user_id)
        .single();

      if (profile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            available_points: (profile.available_points ?? 0) + pointsEarned
          })
          .eq('id', prediction.user_id);
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      settled: allPredictions?.length ?? 0,
      winners: Object.entries(pointsToAward).map(([userId, awards]) => ({
        userId,
        totalPoints: awards.reduce((sum, a) => sum + a.points, 0)
      }))
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
