import { useEffect, useState } from 'react';
import { MatchCard, type Match } from './MatchCard';
import { EmptyState } from './ui/EmptyState';
import { PredictionModal } from './PredictionModal';

interface MatchListProps {
  filter?: 'upcoming' | 'finished' | 'all';
  limit?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

interface MatchApiResponse {
  matches: Match[];
  rate_limited: boolean;
  source?: string;
}

const CACHE_KEY = 'quinela_matches_cache';
const CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Fetches and displays a list of matches with browser-side caching.
 */
export function MatchList({
  filter = 'all',
  limit,
  emptyTitle = 'No hay partidos disponibles',
  emptyDescription = 'Vuelve más tarde para ver los próximos encuentros.'
}: MatchListProps): React.JSX.Element {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect((): void => {
    async function loadMatches(): Promise<void> {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);

        if (cached) {
          const parsed: { data: MatchApiResponse; timestamp: number } = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;

          if (age < CACHE_TTL_MS) {
            setMatches(filterMatches(parsed.data.matches));
            setRateLimited(parsed.data.rate_limited);
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/matches');
        const data: MatchApiResponse = (await response.json()) as MatchApiResponse;

        if (!response.ok) {
          throw new Error(data.matches ? 'Error loading matches' : 'Unknown error');
        }

        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );

        setMatches(filterMatches(data.matches));
        setRateLimited(data.rate_limited);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    function filterMatches(allMatches: Match[]): Match[] {
      let filtered = allMatches;

      if (filter === 'upcoming') {
        filtered = allMatches.filter((m) => m.status === 'TIMED');
      } else if (filter === 'finished') {
        filtered = allMatches.filter((m) => m.status === 'FINISHED');
      }

      if (limit) {
        filtered = filtered.slice(0, limit);
      }

      return filtered;
    }

    void loadMatches();
  }, [filter, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB703]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[rgba(239,71,111,0.08)] border border-[rgba(239,71,111,0.2)] rounded-2xl p-4 text-center">
        <p className="text-[#EF476F] text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rateLimited && (
        <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#B45309] rounded-xl p-3 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          La API de football-data.org está limitada. Mostrando datos en caché.
        </div>
      )}

      {matches.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon="⚽"
        />
      ) : (
        matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={() => setSelectedMatch(match)}
          />
        ))
      )}

      <PredictionModal
        match={selectedMatch}
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
