import type { APIRoute } from 'astro';
import worldCupData from '../../../data/worldcup-2026.json';

interface Player {
  id: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
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
    players: {
      id: string;
      name: string;
      position: string;
      isGoalkeeper: boolean;
    }[];
  }[];
}

/**
 * GET /api/awards/players
 * Query params:
 *   - team_id: filter by team
 *   - goalkeepers_only: "true" to return only goalkeepers
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const teamId = url.searchParams.get('team_id');
    const goalkeepersOnly = url.searchParams.get('goalkeepers_only') === 'true';

    const data = worldCupData as WorldCupData;
    let players: Player[] = [];

    for (const team of data.teams) {
      for (const player of team.players) {
        if (goalkeepersOnly && !player.isGoalkeeper) {
          continue;
        }

        if (teamId && team.id !== teamId) {
          continue;
        }

        players.push({
          id: player.id,
          teamId: team.id,
          teamName: team.name,
          teamFlag: team.flag,
          name: player.name,
          position: player.position,
          isGoalkeeper: player.isGoalkeeper
        });
      }
    }

    return new Response(JSON.stringify({ players }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
