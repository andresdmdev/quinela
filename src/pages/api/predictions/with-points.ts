import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { calculatePoints } from '../../../lib/points';
import type { PredictionRecord } from '../predictions';
import type { MatchRecord } from '../matches';

interface PredictionWithPoints {
  prediction: PredictionRecord;
  match: MatchRecord;
  points: number;
  exactScore: boolean;
  trend: boolean;
}

/**
 * Returns all predictions for the authenticated user enriched with match data
 * and calculated points. Results are sorted by match date descending (most recent first).
 */
export const GET: APIRoute = async ({ cookies }) => {
  const accessToken: string | undefined = cookies.get('sb-access-token')?.value;
  const refreshToken: string | undefined = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (sessionError || !data.session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: predictions, error: predictionsError } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('user_id', data.session.user.id) as { data: PredictionRecord[] | null; error: Error | null };

  if (predictionsError) {
    return new Response(JSON.stringify({ error: predictionsError.message }), { status: 500 });
  }

  if (!predictions || predictions.length === 0) {
    return new Response(JSON.stringify({ predictions_with_points: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const matchIds: string[] = predictions.map((prediction: PredictionRecord) => prediction.match_id);

  const { data: matches, error: matchesError } = await supabaseAdmin
    .from('matches')
    .select('*')
    .in('id', matchIds) as { data: MatchRecord[] | null; error: Error | null };

  if (matchesError) {
    return new Response(JSON.stringify({ error: matchesError.message }), { status: 500 });
  }

  const matchesMap: Map<string, MatchRecord> = new Map(
    (matches ?? []).map((match: MatchRecord) => [match.id, match])
  );

  const predictionsWithPoints: PredictionWithPoints[] = predictions
    .map((prediction: PredictionRecord): PredictionWithPoints | null => {
      const match: MatchRecord | undefined = matchesMap.get(prediction.match_id);

      if (!match) {
        return null;
      }

      const result = calculatePoints(match, prediction);

      return {
        prediction,
        match,
        points: result.points,
        exactScore: result.exactScore,
        trend: result.trend
      };
    })
    .filter((item: PredictionWithPoints | null): item is PredictionWithPoints => item !== null)
    .sort(
      (a: PredictionWithPoints, b: PredictionWithPoints) =>
        new Date(b.match.scheduled_at).getTime() - new Date(a.match.scheduled_at).getTime()
    );

  return new Response(JSON.stringify({ predictions_with_points: predictionsWithPoints }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
