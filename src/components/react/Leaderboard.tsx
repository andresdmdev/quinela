import { useEffect, useState } from 'react';
import { EmptyState } from './ui/EmptyState';
import { UserPredictionsModal } from './UserPredictionsModal';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactScores: number;
  trends: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

/**
 * Displays the leaderboard with a visual cutoff line after the second place.
 */
export function Leaderboard(): React.JSX.Element {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  useEffect((): void => {
    async function loadLeaderboard(): Promise<void> {
      try {
        const response = await fetch('/api/leaderboard');
        const data = (await response.json()) as LeaderboardResponse;

        if (!response.ok) {
          throw new Error('Error loading leaderboard');
        }

        setLeaderboard(data.leaderboard);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadLeaderboard();
  }, []);

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

  if (leaderboard.length === 0) {
    return (
      <EmptyState
        title="Aún no hay ranking"
        description="El ranking se actualizará cuando haya partidos finalizados y los usuarios tengan puntos."
        icon="🏆"
      />
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((entry, index) => {
        const isWinnerZone = index < 2;
        const isLast = index === leaderboard.length - 1;

        return (
          <div
            key={entry.userId}
            onClick={() => setSelectedUser(entry)}
            className={`relative rounded-2xl p-4 border flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
              isWinnerZone
                ? 'bg-gradient-to-r from-[rgba(255,183,3,0.12)] to-[rgba(251,133,0,0.06)] border-[rgba(255,183,3,0.35)] shadow-sm shadow-[rgba(255,183,3,0.15)]'
                : 'bg-white border-[rgba(2,48,71,0.08)] shadow-sm'
            }`}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg ${
                index === 0
                  ? 'bg-[#FFB703] text-white'
                  : index === 1
                  ? 'bg-[#FB8500] text-white'
                  : 'bg-[rgba(2,48,71,0.08)] text-[#6B7280]'
              }`}
            >
              {index + 1}
            </div>

            {entry.avatarUrl ? (
              <img
                src={entry.avatarUrl}
                alt={entry.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFB703] to-[#FB8500] flex items-center justify-center font-bold text-white shadow-sm">
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1A1A2E] truncate">{entry.displayName}</p>
              <p className="text-xs text-[#6B7280]">
                {entry.exactScores} exactos · {entry.trends} tendencias
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black tabular-nums text-[#1A1A2E]">
                {entry.totalPoints}
              </span>
              <p className="text-xs text-[#6B7280] font-medium">pts</p>
            </div>

            {index === 1 && !isLast && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#EF476F] text-white text-xs font-bold rounded-full shadow-sm whitespace-nowrap">
                  <span>✂️</span> Línea de corte
                </span>
              </div>
            )}
          </div>
        );
      })}

      <UserPredictionsModal
        user={selectedUser}
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
