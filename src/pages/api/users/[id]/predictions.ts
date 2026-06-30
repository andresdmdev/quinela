import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';
import { calculatePoints } from '../../../../lib/points';
import type { PredictionRecord } from '../../predictions';
import type { MatchRecord } from '../../matches';

const LOCK_WINDOW_MS: number = 10 * 60 * 1000;

export interface UserPrediction {
  prediction: PredictionRecord;
  match: MatchRecord;
  points: number;
  exactScore: boolean;
  trend: boolean;
  isLocked: boolean;
}

interface UserPredictionsResponse {
  predictions: UserPrediction[];
}

/**
 * Determines whether a prediction for a match is locked based on the current time.
 * A prediction locks 10 minutes before the match start time.
 */
function isPredictionLocked(match: MatchRecord): boolean {
  const now: Date = new Date();
  const matchTime: Date = new Date(match.scheduled_at);
  const lockTime: Date = new Date(matchTime.getTime() - LOCK_WINDOW_MS);

  return now >= lockTime;
}

/**
 * Returns a user's predictions for matches that are finished or have their predictions locked.
 * This endpoint bypasses RLS because the predictions are intended to be public for leaderboard transparency.
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
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

    const userId: string | undefined = params.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User id is required' }), { status: 400 });
    }

    const { data: predictions, error: predictionsError } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('user_id', userId) as { data: PredictionRecord[] | null; error: Error | null };

    if (predictionsError) {
      return new Response(JSON.stringify({ error: predictionsError.message }), { status: 500 });
    }

    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ predictions: [] }), {
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

    const requestingUserId: string | undefined = data.session?.user.id;

    const userPredictions: UserPrediction[] = predictions
      .map((prediction: PredictionRecord): UserPrediction | null => {
        const match: MatchRecord | undefined = matchesMap.get(prediction.match_id);

        if (!match) {
          return null;
        }

        const isOwner: boolean = requestingUserId === userId;
        const locked: boolean = match.status !== 'TIMED' || isPredictionLocked(match);

        const showPrediction: boolean =
          match.status === 'FINISHED' || locked || isOwner;

        if (!showPrediction) {
          return null;
        }

        const result = calculatePoints(match, prediction);

        return {
          prediction,
          match,
          points: result.points,
          exactScore: result.exactScore,
          trend: result.trend,
          isLocked: locked
        };
      })
      .filter((item: UserPrediction | null): item is UserPrediction => item !== null)
      .sort(
        (a: UserPrediction, b: UserPrediction) =>
          new Date(b.match.scheduled_at).getTime() - new Date(a.match.scheduled_at).getTime()
      );

    const response: UserPredictionsResponse = { predictions: userPredictions };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
