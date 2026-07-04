import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import worldCupData from '../../../data/worldcup-2026.json';

interface AwardPrediction {
  id: string;
  user_id: string;
  award_type: string;
  prediction: string;
  points_wagered: number;
  is_winner: boolean | null;
  created_at: string;
}

interface PredictionWithDetails extends AwardPrediction {
  prediction_name: string;
  prediction_flag?: string;
  award_name: string;
}

interface WorldCupData {
  teams: {
    id: string;
    name: string;
    group: string;
    flag: string;
    players: {
      id: string;
      name: string;
      position: string;
      isGoalkeeper: boolean;
    }[];
  }[];
}

/**
 * GET /api/awards/predictions
 * Returns the predictions for the authenticated user.
 * Query params:
 *   - user_id: to view another user's predictions (admin only)
 */
export const GET: APIRoute = async ({ cookies, url }) => {
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

  const targetUserId = url.searchParams.get('user_id') || sessionData.session.user.id;

  const { data: predictions, error } = await supabaseAdmin
    .from('award_predictions')
    .select('*')
    .eq('user_id', targetUserId) as { data: AwardPrediction[] | null; error: Error | null };

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const data = worldCupData as WorldCupData;
  const predictionsWithDetails: PredictionWithDetails[] = (predictions ?? []).map((pred) => {
    const awardNames: Record<string, string> = {
      champion: 'Campeón',
      top_scorer: 'Máximo Goleador',
      best_goalkeeper: 'Mejor Portero'
    };

    let predictionName = pred.prediction;
    let predictionFlag: string | undefined;

    if (pred.award_type === 'champion') {
      const team = data.teams.find((t) => t.id === pred.prediction);
      if (team) {
        predictionName = team.name;
        predictionFlag = team.flag;
      }
    } else {
      for (const team of data.teams) {
        const player = team.players.find((p) => p.id === pred.prediction);
        if (player) {
          predictionName = `${player.name} (${team.name})`;
          predictionFlag = team.flag;
          break;
        }
      }
    }

    return {
      ...pred,
      prediction_name: predictionName,
      prediction_flag: predictionFlag,
      award_name: awardNames[pred.award_type] || pred.award_type
    };
  });

  return new Response(JSON.stringify({ predictions: predictionsWithDetails }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
