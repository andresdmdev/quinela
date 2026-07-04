import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { calculatePoints } from '../../lib/points';
import type { MatchRecord } from './matches';
import type { PredictionRecord } from './predictions';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  matchPoints: number;
  awardPoints: number;
  exactScores: number;
  trends: number;
}

/**
 * Calculates points for all finished matches and returns the leaderboard.
 */
export const GET: APIRoute = async () => {
  try {
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'FINISHED') as { data: MatchRecord[] | null; error: Error | null };

    if (matchesError) {
      return new Response(JSON.stringify({ error: matchesError.message }), { status: 500 });
    }

    const { data: predictions, error: predictionsError } = await supabaseAdmin
      .from('predictions')
      .select('*') as { data: PredictionRecord[] | null; error: Error | null };

    if (predictionsError) {
      return new Response(JSON.stringify({ error: predictionsError.message }), { status: 500 });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*') as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null; error: Error | null };

    if (profilesError) {
      return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
    }

    const allMatches: MatchRecord[] = matches ?? [];
    const allPredictions: PredictionRecord[] = predictions ?? [];
    const allProfiles = profiles ?? [];

    const { data: awardPredictions, error: awardError } = await supabaseAdmin
      .from('award_predictions')
      .select('user_id, award_type, prediction, points_wagered, is_winner')
      .not('is_winner', 'is', null);

    if (awardError) {
      return new Response(JSON.stringify({ error: awardError.message }), { status: 500 });
    }

    const awardPointsByUser: Record<string, number> = {};
    for (const ap of awardPredictions ?? []) {
      if (ap.is_winner === true) {
        awardPointsByUser[ap.user_id] = (awardPointsByUser[ap.user_id] ?? 0) + ap.points_wagered * 5;
      }
    }

    const pointsUpsert: {
      user_id: string;
      match_id: string;
      points: number;
      exact_score: boolean;
      trend: boolean;
    }[] = [];

    const scoreByUser: Record<string, LeaderboardEntry> = {};

    for (const profile of allProfiles) {
      const awardPoints = awardPointsByUser[profile.id] ?? 0;
      scoreByUser[profile.id] = {
        userId: profile.id,
        displayName: profile.display_name ?? 'Jugador',
        avatarUrl: profile.avatar_url,
        totalPoints: awardPoints,
        matchPoints: 0,
        awardPoints: awardPoints,
        exactScores: 0,
        trends: 0
      };
    }

    for (const match of allMatches) {
      const matchPredictions = allPredictions.filter(
        (prediction: PredictionRecord) => prediction.match_id === match.id
      );

      for (const prediction of matchPredictions) {
        const result = calculatePoints(match, prediction);

        pointsUpsert.push({
          user_id: prediction.user_id,
          match_id: match.id,
          points: result.points,
          exact_score: result.exactScore,
          trend: result.trend
        });

        const entry = scoreByUser[prediction.user_id];
        if (entry) {
          entry.matchPoints += result.points;
          entry.totalPoints += result.points;
          if (result.exactScore) entry.exactScores += 1;
          if (result.trend && !result.exactScore) entry.trends += 1;
        }
      }
    }

    if (pointsUpsert.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('match_points')
        .upsert(pointsUpsert, { onConflict: 'user_id, match_id' });

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
      }
    }

    const leaderboard: LeaderboardEntry[] = Object.values(scoreByUser).sort(
      (a: LeaderboardEntry, b: LeaderboardEntry) => b.totalPoints - a.totalPoints
    );

    return new Response(JSON.stringify({ leaderboard }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
