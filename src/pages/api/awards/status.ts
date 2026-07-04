import type { APIRoute } from 'astro';

const WINDOW_CLOSE_TIMESTAMP = new Date('2026-07-04T18:00:00Z').getTime();

interface StatusResponse {
  isOpen: boolean;
  closesAt: string;
  closesAtTimestamp: number;
  nowTimestamp: number;
}

/**
 * GET /api/awards/status
 * Returns whether the award prediction window is open or closed.
 */
export const GET: APIRoute = async () => {
  try {
    const now = Date.now();
    const isOpen = now < WINDOW_CLOSE_TIMESTAMP;

    const response: StatusResponse = {
      isOpen,
      closesAt: new Date(WINDOW_CLOSE_TIMESTAMP).toISOString(),
      closesAtTimestamp: WINDOW_CLOSE_TIMESTAMP,
      nowTimestamp: now
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message: string = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
