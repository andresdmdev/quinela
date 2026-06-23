import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { fetchWorldCupMatches, type FootballMatch } from '../../lib/football-data';
import { toUtcMinus5 } from '../../lib/timezone';

const CACHE_TTL_MS: number = 3 * 60 * 1000;

export interface MatchRecord {
  id: string;
  external_id: string;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_score: number | null;
  away_score: number | null;
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

      return {
        external_id: String(match.id),
        stage: match.stage,
        group_name: match.group,
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        home_flag: match.homeTeam.crest,
        away_flag: match.awayTeam.crest,
        home_score: match.score.fullTime.home,
        away_score: match.score.fullTime.away,
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
