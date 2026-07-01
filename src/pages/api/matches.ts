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

    const existingByExternalId = new Map<string, MatchRecord>();
    if (cachedMatches) {
      for (const m of cachedMatches) {
        existingByExternalId.set(m.external_id, m);
      }
    }

    const upsertPayload: MatchPayload[] = [];

    for (const match of apiResponse.matches) {
      const scheduledAt: string = match.utcDate;
      const utcMinus5At: Date = toUtcMinus5(scheduledAt);

      const apiHomeTeam = match.homeTeam?.name ?? null;
      const apiAwayTeam = match.awayTeam?.name ?? null;
      const apiHomeFlag = match.homeTeam?.crest ?? null;
      const apiAwayFlag = match.awayTeam?.crest ?? null;

      const existing = existingByExternalId.get(String(match.id));

      if (!apiHomeTeam || !apiAwayTeam) {
        console.warn(`Teams not yet defined for match ${match.id}, stage: ${match.stage}`);
      }

      let regularHome: number | null;
      let regularAway: number | null;

      if (match.score.regularTime?.home !== null && match.score.regularTime?.away !== null) {
        regularHome = match.score.regularTime!.home;
        regularAway = match.score.regularTime!.away;
      } else if (match.score.duration === 'PENALTY_SHOOTOUT') {
        regularHome = (match.score.fullTime.home ?? 0) - (match.score.extraTime?.home ?? 0) - (match.score.penalties?.home ?? 0);
        regularAway = (match.score.fullTime.away ?? 0) - (match.score.extraTime?.away ?? 0) - (match.score.penalties?.away ?? 0);
      } else if (match.score.duration === 'EXTRA_TIME') {
        regularHome = (match.score.fullTime.home ?? 0) - (match.score.extraTime?.home ?? 0);
        regularAway = (match.score.fullTime.away ?? 0) - (match.score.extraTime?.away ?? 0);
      } else {
        regularHome = match.score.fullTime.home;
        regularAway = match.score.fullTime.away;
      }

      const extraTimeHome = match.score.extraTime?.home ?? null;
      const extraTimeAway = match.score.extraTime?.away ?? null;

      let penaltiesHome: number | null = null;
      let penaltiesAway: number | null = null;

      if (match.score.duration === 'PENALTY_SHOOTOUT') {
        penaltiesHome = (match.score.fullTime.home ?? 0) - (regularHome ?? 0) - (extraTimeHome ?? 0);
        penaltiesAway = (match.score.fullTime.away ?? 0) - (regularAway ?? 0) - (extraTimeAway ?? 0);
      }

      upsertPayload.push({
        external_id: String(match.id),
        stage: match.stage,
        group_name: match.group,
        home_team: apiHomeTeam ?? existing?.home_team ?? null,
        away_team: apiAwayTeam ?? existing?.away_team ?? null,
        home_flag: apiHomeFlag ?? existing?.home_flag ?? null,
        away_flag: apiAwayFlag ?? existing?.away_flag ?? null,
        home_score: regularHome,
        away_score: regularAway,
        home_final_score: match.score.fullTime.home,
        away_final_score: match.score.fullTime.away,
        extra_time_home: extraTimeHome,
        extra_time_away: extraTimeAway,
        penalties_home: penaltiesHome,
        penalties_away: penaltiesAway,
        winner: mapWinner(match.score.winner),
        duration: match.score.duration,
        status: match.status,
        scheduled_at: scheduledAt,
        utc_minus_5_at: utcMinus5At.toISOString(),
        last_synced_at: new Date().toISOString()
      });
    }

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
