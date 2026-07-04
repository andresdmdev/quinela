import { useState } from 'react';
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
      />
      <AwardPredictionForm
        onPointsChange={handlePointsChange}
        onPredictionMade={handlePredictionMade}
        onProfileLoaded={handleProfileLoaded}
      />
    </div>
  );
}
