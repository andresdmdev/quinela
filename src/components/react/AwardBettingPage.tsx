import { useState, useEffect } from 'react';
import { AwardSummary } from './AwardSummary';
import { AwardPredictionForm } from './AwardPredictionForm';

const INITIAL_WAGERED = {
  champion: 0,
  top_scorer: 0,
  best_goalkeeper: 0
};

interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  matchPoints: number;
  awardPoints: number;
}

export function AwardBettingPage(): React.JSX.Element {
  const [pointsWagered, setPointsWagered] = useState<Record<string, number>>(INITIAL_WAGERED);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);

  const totalWagered = Object.values(pointsWagered).reduce((sum, p) => sum + p, 0);
  const potentialWinnings = totalWagered * 3;

  useEffect(() => {
    async function loadRankingPoints(): Promise<void> {
      try {
        const profileRes = await fetch('/api/profile/me');
        if (!profileRes.ok) return;
        const profileData = await profileRes.json() as { id?: string };
        const userId = profileData.id;

        if (!userId) return;

        const leaderboardRes = await fetch('/api/leaderboard');
        if (!leaderboardRes.ok) return;
        const leaderboardData = await leaderboardRes.json() as { leaderboard: LeaderboardEntry[] };

        const userEntry = leaderboardData.leaderboard.find((entry) => entry.userId === userId);
        if (userEntry) {
          setTotalEarned(userEntry.matchPoints + userEntry.awardPoints);
        }
      } catch {
        // Silently fail
      }
    }

    void loadRankingPoints();
  }, []);

  const handlePointsChange = (newPointsWagered: Record<string, number>, newAvailablePoints: number): void => {
    setPointsWagered(newPointsWagered);
    setAvailablePoints(newAvailablePoints);
  };

  const handleProfileLoaded = (loadedAvailablePoints: number): void => {
    setAvailablePoints(loadedAvailablePoints);
    setProfileLoaded(true);
  };

  const handlePredictionMade = (): void => {
    void fetch('/api/profile/me')
      .then((res) => res.json())
      .then((data: { available_points?: number }) => {
        if (data.available_points !== undefined) {
          setAvailablePoints(data.available_points);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="mb-8">
      <AwardSummary
        availablePoints={availablePoints}
        totalWagered={totalWagered}
        potentialWinnings={potentialWinnings}
        totalEarned={totalEarned}
      />
      <AwardPredictionForm
        onPointsChange={handlePointsChange}
        onPredictionMade={handlePredictionMade}
        onProfileLoaded={handleProfileLoaded}
      />
    </div>
  );
}
