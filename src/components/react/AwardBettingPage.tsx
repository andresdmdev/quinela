import { useState, useEffect } from 'react';
import { AwardSummary } from './AwardSummary';
import { AwardPredictionForm } from './AwardPredictionForm';

const INITIAL_WAGERED = {
  champion: 0,
  top_scorer: 0,
  best_goalkeeper: 0
};

export function AwardBettingPage(): React.JSX.Element {
  const [pointsWagered, setPointsWagered] = useState<Record<string, number>>(INITIAL_WAGERED);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);

  const totalWagered = Object.values(pointsWagered).reduce((sum, p) => sum + p, 0);
  const potentialWinnings = totalWagered * 3;

  useEffect(() => {
    async function loadAvailablePoints(): Promise<void> {
      try {
        const profileRes = await fetch('/api/profile/me');
        if (!profileRes.ok) return;
        const profileData = await profileRes.json() as { available_points?: number };
        setAvailablePoints(profileData.available_points ?? 0);
      } catch {
        // Silently fail
      }
    }

    void loadAvailablePoints();
  }, []);

  const handlePointsChange = (newPointsWagered: Record<string, number>, newAvailablePoints: number): void => {
    setPointsWagered(newPointsWagered);
  };

  const handleProfileLoaded = (loadedAvailablePoints: number): void => {
    setProfileLoaded(true);
  };

  const handlePredictionMade = (): void => {
    void fetch('/api/profile/me')
      .then((res) => res.json())
      .then((data) => {
        setAvailablePoints(data.available_points ?? 0);
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
        onPointsChange={handlePointsChange}
        onPredictionMade={handlePredictionMade}
        onProfileLoaded={handleProfileLoaded}
      />
    </div>
  );
}
