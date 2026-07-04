import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

const WINDOW_CLOSE_TIMESTAMP = new Date('2026-07-04T18:00:00Z').getTime();
const MIN_POINTS = 2;
const MAX_POINTS = 5;
const VALID_AWARD_TYPES = ['champion', 'top_scorer', 'best_goalkeeper'];

interface PredictBody {
  awardType: string;
  prediction: string;
  pointsWagered: number;
}

/**
 * POST /api/awards/predict
 * Creates or updates an award prediction for the authenticated user.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = Date.now();
  if (now >= WINDOW_CLOSE_TIMESTAMP) {
    return new Response(
      JSON.stringify({ error: 'Prediction window is closed' }),
      { status: 403 }
    );
  }

  let body: PredictBody;
  try {
    body = (await request.json()) as PredictBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { awardType, prediction, pointsWagered } = body;

  if (!awardType || !prediction || pointsWagered === undefined) {
    return new Response('Missing required fields', { status: 400 });
  }

  if (!VALID_AWARD_TYPES.includes(awardType)) {
    return new Response('Invalid award type', { status: 400 });
  }

  if (pointsWagered < MIN_POINTS || pointsWagered > MAX_POINTS) {
    return new Response(`Points wagered must be between ${MIN_POINTS} and ${MAX_POINTS}`, {
      status: 400
    });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('available_points')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return new Response('Profile not found', { status: 404 });
  }

  const { data: existingPrediction } = await supabaseAdmin
    .from('award_predictions')
    .select('points_wagered')
    .eq('user_id', user.id)
    .eq('award_type', awardType)
    .single();

  const currentWagered = existingPrediction?.points_wagered ?? 0;
  const pointsNeeded = pointsWagered - currentWagered;

  if (pointsNeeded > 0) {
    const availablePoints = profile.available_points ?? 0;
    if (availablePoints < pointsNeeded) {
      return new Response(
        JSON.stringify({
          error: `Not enough points. You need ${pointsNeeded} points but only have ${availablePoints}`
        }),
        { status: 400 }
      );
    }

    const { error: deductError } = await supabaseAdmin
      .from('profiles')
      .update({ available_points: availablePoints - pointsNeeded })
      .eq('id', user.id);

    if (deductError) {
      return new Response(JSON.stringify({ error: deductError.message }), { status: 500 });
    }
  } else if (pointsNeeded < 0) {
    const refund = Math.abs(pointsNeeded);
    const { error: refundError } = await supabaseAdmin
      .from('profiles')
      .update({ available_points: (profile.available_points ?? 0) + refund })
      .eq('id', user.id);

    if (refundError) {
      return new Response(JSON.stringify({ error: refundError.message }), { status: 500 });
    }
  }

  const { error: upsertError } = await supabaseAdmin
    .from('award_predictions')
    .upsert(
      {
        user_id: user.id,
        award_type: awardType,
        prediction,
        points_wagered: pointsWagered
      },
      { onConflict: 'user_id, award_type' }
    );

  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
