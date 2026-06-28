import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { fetchWorldCupMatches, type FootballMatch } from '../../lib/football-data';
import { toUtcMinus5 } from '../../lib/timezone';

const CACHE_TTL_MS: number = 3 * 60 * 1000;

/**
 * Maps the API winner value to our internal representation.
 */
function mapWinner(
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
): 'HOME' | 'AWAY' | 'DRAW' | null {
  if (winner === 'HOME_TEAM') return 'HOME';
  if (winner === 'AWAY_TEAM') return 'AWAY';
  if (winner === 'DRAW') return 'DRAW';
  return null;
}

export interface MatchRecord {
  id: string;
  external_id: string;
  stage: string;
  group_name: string | null;
  home_team: string | null;
  away_team: string | null;
  home_flag: string | null;
  away_flag: string | null;
  home_score: number | null;
  away_score: number | null;
  home_final_score: number | null;
  away_final_score: number | null;
  extra_time_home: number | null;
  extra_time_away: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
  winner: 'HOME' | 'AWAY' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | null;
  status: string;
  scheduled_at: string;
  utc_minus_5_at: string;
  last_synced_at: string;
}

export type MatchPayload = Omit<MatchRecord, 'id'>;

/**
 * Returns cached matches from Supabase if the last sync is within the TTL.
 * Otherwise fetches from football-data.org and refreshes the cache.
 */
export const GET: APIRoute = async () => {
  try {
    const { data: cachedMatches, error: cacheError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .order('scheduled_at', { ascending: true }) as { data: MatchRecord[] | null; error: Error | null };

    if (cacheError) {
      return new Response(JSON.stringify({ error: cacheError.message }), { status: 500 });
    }

    const now: number = Date.now();
    const lastSync: string | null = cachedMatches?.[0]?.last_synced_at ?? null;
    const cacheAge: number = lastSync ? now - new Date(lastSync).getTime() : Infinity;

    if (cachedMatches && cachedMatches.length > 0 && cacheAge < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ matches: cachedMatches, rate_limited: false, source: 'cache' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiResponse = await fetchWorldCupMatches();

    if (apiResponse === null) {
      return new Response(
        JSON.stringify({
          matches: cachedMatches ?? [],
          rate_limited: true,
          source: 'stale'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const upsertPayload = apiResponse.matches.map((match: FootballMatch): MatchPayload => {
      const scheduledAt: string = match.utcDate;
      const utcMinus5At: Date = toUtcMinus5(scheduledAt);

      if (!match.homeTeam || !match.awayTeam) {
        console.warn(`Teams not yet defined for match ${match.id}, stage: ${match.stage}`);
      }

      // fullTime is the final score (includes extra time and penalties).
      // regularTime holds the 90-minute score when extra time/penalties occurred.
      const regularHome = match.score.regularTime?.home ?? match.score.fullTime.home;
      const regularAway = match.score.regularTime?.away ?? match.score.fullTime.away;

      return {
        external_id: String(match.id),
        stage: match.stage,
        group_name: match.group,
        home_team: match.homeTeam?.name ?? null,
        away_team: match.awayTeam?.name ?? null,
        home_flag: match.homeTeam?.crest ?? null,
        away_flag: match.awayTeam?.crest ?? null,
        home_score: regularHome,
        away_score: regularAway,
        home_final_score: match.score.fullTime.home,
        away_final_score: match.score.fullTime.away,
        extra_time_home: match.score.extraTime?.home ?? null,
        extra_time_away: match.score.extraTime?.away ?? null,
        penalties_home: match.score.penalties?.home ?? null,
        penalties_away: match.score.penalties?.away ?? null,
        winner: mapWinner(match.score.winner),
        duration: match.score.duration,
        status: match.status,
        scheduled_at: scheduledAt,
        utc_minus_5_at: utcMinus5At.toISOString(),
        last_synced_at: new Date().toISOString()
      };
    });

    const { data: freshMatches, error: upsertError } = await supabaseAdmin
      .from('matches')
      .upsert(upsertPayload, { onConflict: 'external_id' })
      .select('*')
      .order('scheduled_at', { ascending: true }) as { data: MatchRecord[] | null; error: Error | null };

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ matches: freshMatches, rate_limited: false, source: 'api' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    const statusCode: number = message.includes('FOOTBALL_DATA_API_KEY') ? 503 : 500;
    return new Response(JSON.stringify({ error: message }), { status: statusCode });
  }
};
