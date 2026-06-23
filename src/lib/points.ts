import type { MatchRecord } from '../pages/api/matches';
import type { PredictionRecord } from '../pages/api/predictions';

export interface PointsResult {
  points: number;
  exactScore: boolean;
  trend: boolean;
}

/**
 * Calculates the points awarded for a prediction on a finished match.
 */
export function calculatePoints(match: MatchRecord, prediction: PredictionRecord): PointsResult {
  if (match.status !== 'FINISHED') {
    return { points: 0, exactScore: false, trend: false };
  }

  if (
    prediction.home_score === null ||
    prediction.away_score === null ||
    match.home_score === null ||
    match.away_score === null
  ) {
    return { points: 0, exactScore: false, trend: false };
  }

  const predictedHomeWins: boolean = prediction.home_score > prediction.away_score;
  const predictedAwayWins: boolean = prediction.away_score > prediction.home_score;
  const predictedDraw: boolean = prediction.home_score === prediction.away_score;

  const actualHomeWins: boolean = match.home_score > match.away_score;
  const actualAwayWins: boolean = match.away_score > match.home_score;
  const actualDraw: boolean = match.home_score === match.away_score;

  const trendCorrect: boolean =
    (predictedHomeWins && actualHomeWins) ||
    (predictedAwayWins && actualAwayWins) ||
    (predictedDraw && actualDraw);

  const exactScore: boolean =
    prediction.home_score === match.home_score && prediction.away_score === match.away_score;

  if (match.stage === 'GROUP_STAGE') {
    if (exactScore) {
      return { points: 3, exactScore: true, trend: true };
    }
    if (trendCorrect) {
      return { points: 1, exactScore: false, trend: true };
    }
    return { points: 0, exactScore: false, trend: false };
  }

  if (!trendCorrect) {
    return { points: 0, exactScore: false, trend: false };
  }

  let basePoints: number;
  switch (match.stage) {
    case 'ROUND_OF_16':
      basePoints = 3;
      break;
    case 'QUARTER_FINAL':
      basePoints = 4;
      break;
    case 'SEMI_FINAL':
      basePoints = 4;
      break;
    case 'FINAL':
      basePoints = 5;
      break;
    default:
      basePoints = 3;
  }

  if (exactScore) {
    const bonus: number = match.stage === 'ROUND_OF_16' ? 2 : 3;
    basePoints += bonus;
  }

  return { points: basePoints, exactScore, trend: true };
}
