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
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | null;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime?: {
      home: number | null;
      away: number | null;
    } | null;
    regularTime?: {
      home: number | null;
      away: number | null;
    } | null;
    extraTime?: {
      home: number | null;
      away: number | null;
    } | null;
    penalties?: {
      home: number | null;
      away: number | null;
    } | null;
  };
}

export interface FootballMatchesResponse {
  matches: FootballMatch[];
}

export interface FootballCoach {
  id: number;
  name: string;
  countryOfBirth: string | null;
  nationality: string | null;
}

export interface FootballCaptain {
  id: number;
  name: string;
  shirtNumber: number | null;
}

export interface FootballPlayer {
  id: number;
  name: string;
  position: string | null;
  shirtNumber: number | null;
}

export interface FootballTeamDetails {
  id: number;
  name: string;
  crest: string;
  coach?: FootballCoach | null;
  captain?: FootballCaptain | null;
  lineup?: FootballPlayer[];
  bench?: FootballPlayer[];
}

export interface FootballGoal {
  minute: number;
  extraTime: number | null;
  type: string;
  team: { id: number; name: string };
  scorer: { id: number; name: string };
  assist: { id: number; name: string } | null;
}

export interface FootballBooking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string };
  card: 'YELLOW_CARD' | 'RED_CARD' | string;
}

export interface FootballSubstitution {
  minute: number;
  team: { id: number; name: string };
  playerOut: { id: number; name: string };
  playerIn: { id: number; name: string };
}

export interface FootballReferee {
  id: number;
  name: string;
  nationality: string | null;
  type?: string;
}

/**
 * Full match resource returned by /matches/{id}.
 * Includes lineups, coach, captain, goals, bookings and substitutions.
 */
export interface FootballMatchDetails extends FootballMatch {
  homeTeam: FootballTeamDetails;
  awayTeam: FootballTeamDetails;
  goals?: FootballGoal[] | null;
  bookings?: FootballBooking[] | null;
  substitutions?: FootballSubstitution[] | null;
  referees?: FootballReferee[] | null;
  attendance?: number | null;
  venue?: string | null;
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

/**
 * Fetches detailed match data from football-data.org by external match id.
 * Includes lineups, coach, captain, goals, bookings and substitutions.
 * Returns null if the rate limit is exceeded.
 */
export async function fetchMatchDetails(externalId: number): Promise<FootballMatchDetails | null> {
  const apiKey: string = import.meta.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured');
  }

  const response: Response = await fetch(
    `https://api.football-data.org/v4/matches/${externalId}`,
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

  return (await response.json()) as FootballMatchDetails;
}
