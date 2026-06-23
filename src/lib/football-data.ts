export interface FootballMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: {
    id: number;
    name: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    crest: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface FootballMatchesResponse {
  matches: FootballMatch[];
}

/**
 * Fetches World Cup matches from football-data.org.
 * Returns null if the rate limit is exceeded.
 */
export async function fetchWorldCupMatches(): Promise<FootballMatchesResponse | null> {
  const apiKey: string = import.meta.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured');
  }

  const response: Response = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches',
    {
      headers: {
        'X-Auth-Token': apiKey
      }
    }
  );

  if (response.status === 429) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`football-data.org error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as FootballMatchesResponse;
}
