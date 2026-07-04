import type { APIRoute } from 'astro';
import worldCupData from '../../../data/worldcup-2026.json';

interface Team {
  id: string;
  name: string;
  group: string;
  flag: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  isGoalkeeper: boolean;
}

interface WorldCupData {
  teams: {
    id: string;
    name: string;
    group: string;
    flag: string;
    players: Player[];
  }[];
}

const data = worldCupData as WorldCupData;

/**
 * GET /api/awards/teams
 * Returns all 48 teams with their basic info.
 */
export const GET: APIRoute = async () => {
  try {
    const teams: Team[] = data.teams.map((team) => ({
      id: team.id,
      name: team.name,
      group: team.group,
      flag: team.flag
    }));

    return new Response(JSON.stringify({ teams }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
