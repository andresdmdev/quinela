import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { fetchMatchDetails, type FootballMatchDetails } from '../../../lib/football-data';
import type { MatchRecord } from '../matches';

const DETAILS_CACHE_TTL_MS: number = 10 * 60 * 1000;

/**
 * In-memory cache for match details fetched from football-data.org.
 * Keys are external match ids. This cache is local to the server instance;
 * for a multi-instance deployment the API may fetch details once per instance.
 */
const detailsCache = new Map<number, { data: FootballMatchDetails; timestamp: number }>();

interface MatchDetailsResponse {
  match: MatchRecord;
  details: FootballMatchDetails | null;
  rate_limited: boolean;
}

/**
 * Returns a single match from the database plus detailed information from football-data.org.
 * Detailed data includes lineups, coach, captain, goals, bookings and substitutions.
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const matchId: string | undefined = params.id;

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match id is required' }), { status: 400 });
    }

    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single() as { data: MatchRecord | null; error: Error | null };

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404 });
    }

    const externalId: number = parseInt(match.external_id, 10);
    const cached = detailsCache.get(externalId);

    let details: FootballMatchDetails | null = null;
    let rateLimited = false;

    if (cached && Date.now() - cached.timestamp < DETAILS_CACHE_TTL_MS) {
      details = cached.data;
    } else {
      const apiDetails = await fetchMatchDetails(externalId);

      if (apiDetails === null) {
        rateLimited = true;
      } else {
        details = apiDetails;
        detailsCache.set(externalId, { data: apiDetails, timestamp: Date.now() });
      }
    }

    const response: MatchDetailsResponse = {
      match,
      details,
      rate_limited: rateLimited
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    const statusCode: number = message.includes('FOOTBALL_DATA_API_KEY') ? 503 : 500;
    return new Response(JSON.stringify({ error: message }), { status: statusCode });
  }
};
