import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import type { MatchRecord } from './matches';

export interface PredictionRecord {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number | null;
  away_score: number | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

const GROUP_STAGE_CUTOFF_UTC_MINUS_5: string = '2026-06-10T23:59:00-05:00';

/**
 * Returns the predictions for the authenticated user.
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

  const { data: predictions, error } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('user_id', data.session.user.id) as { data: PredictionRecord[] | null; error: Error | null };

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ predictions: predictions ?? [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

/**
 * Creates or updates a prediction for the authenticated user.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
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

  const body = await request.json();
  const matchId: string | undefined = body.matchId;
  const homeScore: number | undefined = body.homeScore;
  const awayScore: number | undefined = body.awayScore;

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return new Response('Missing fields', { status: 400 });
  }

  const { data: match, error: matchError } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single() as { data: MatchRecord | null; error: Error | null };

  if (matchError || !match) {
    return new Response('Match not found', { status: 404 });
  }

  if (isPredictionLocked(match)) {
    return new Response('Prediction is locked', { status: 403 });
  }

  const { error: upsertError } = await supabaseAdmin
    .from('predictions')
    .upsert(
      {
        user_id: data.session.user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id, match_id' }
    );

  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

/**
 * Determines whether a prediction for a match is locked.
 */
function isPredictionLocked(match: MatchRecord): boolean {
  const now: Date = new Date();
  const matchTime: Date = new Date(match.utc_minus_5_at);
  const lockTime: Date = new Date(matchTime.getTime() - 60 * 60 * 1000);

  if (now >= lockTime) {
    return true;
  }

  if (match.stage === 'GROUP_STAGE') {
    const cutoff: Date = new Date(GROUP_STAGE_CUTOFF_UTC_MINUS_5);
    if (now >= cutoff) {
      return true;
    }
  }

  return false;
}
