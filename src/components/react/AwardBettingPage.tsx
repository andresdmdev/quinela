import { useState, useEffect } from 'react';
import { AwardSummary } from './AwardSummary';
import { AwardPredictionForm } from './AwardPredictionForm';
import type { LeaderboardEntry } from './Leaderboard';

const INITIAL_WAGERED = {
  champion: 0,
  top_scorer: 0,
  best_goalkeeper: 0
};

const RANKING_STORAGE_KEY = 'quinela_ranking';

/**
 * Loads the leaderboard from localStorage cache.
 */
function loadRankingFromStorage(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(RANKING_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the leaderboard to localStorage cache.
 */
function saveRankingToStorage(leaderboard: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(leaderboard));
  } catch {
    // localStorage not available
  }
}

/**
 * Returns the current user's available points from the ranking entry.
 * totalPoints already reflects matchPoints + awardPoints - activeWagers.
 */
function getAvailablePointsFromRanking(leaderboard: LeaderboardEntry[], userId?: string): number {
  if (!userId) return 0;
  const entry = leaderboard.find((e) => e.userId === userId);
  return entry?.totalPoints ?? 0;
}

export function AwardBettingPage(): React.JSX.Element {
  const [pointsWagered, setPointsWagered] = useState<Record<string, number>>(INITIAL_WAGERED);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);

  const totalWagered = Object.values(pointsWagered).reduce((sum, p) => sum + p, 0);
  const potentialWinnings = totalWagered * 3;

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        // Load current user id
        const profileRes = await fetch('/api/profile/me');
        const profileData = (await profileRes.json()) as { id?: string };
        const userId = profileData.id;
        setCurrentUserId(userId);

        // Try localStorage first
        const cachedLeaderboard = loadRankingFromStorage();
        if (cachedLeaderboard.length > 0) {
          setAvailablePoints(getAvailablePointsFromRanking(cachedLeaderboard, userId));
        }

        // Refresh from API
        const leaderboardRes = await fetch('/api/leaderboard');
        if (leaderboardRes.ok) {
          const leaderboardData = (await leaderboardRes.json()) as { leaderboard: LeaderboardEntry[] };
          saveRankingToStorage(leaderboardData.leaderboard);
          setAvailablePoints(getAvailablePointsFromRanking(leaderboardData.leaderboard, userId));
        }
      } catch {
        // Silently fail
      }
    }

    void loadData();
  }, []);

  const handlePointsChange = (newPointsWagered: Record<string, number>): void => {
    setPointsWagered(newPointsWagered);
  };

  const handleProfileLoaded = (): void => {
    setProfileLoaded(true);
  };

  const handlePredictionMade = (): void => {
    // Refresh ranking after a prediction to keep localStorage and UI in sync
    void fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        const leaderboard = (data as { leaderboard: LeaderboardEntry[] }).leaderboard;
        saveRankingToStorage(leaderboard);
        setAvailablePoints(getAvailablePointsFromRanking(leaderboard, currentUserId));
      })
      .catch(() => {});
  };

  return (
    <div className="mb-8">
      <AwardSummary
        availablePoints={availablePoints}
        totalWagered={totalWagered}
        potentialWinnings={potentialWinnings}
      />
      <AwardPredictionForm
        availablePoints={availablePoints}
        onPointsChange={handlePointsChange}
        onPredictionMade={handlePredictionMade}
        onProfileLoaded={handleProfileLoaded}
      />
    </div>
  );
}
