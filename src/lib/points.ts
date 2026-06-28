import type { MatchRecord } from '../pages/api/matches';
import type { PredictionRecord } from '../pages/api/predictions';

export interface PointsResult {
  points: number;
  exactScore: boolean;
  trend: boolean;
}

/**
 * Calculates the points awarded for a prediction on a finished match.
 *
 * Group stage:
 *   - Exact score: 5 points
 *   - Correct trend (winner or draw): 2 points
 *   - Incorrect: 0 points
 *
 * Knockout stage:
 *   - 90 minutes: exact score 5 points, correct trend 2 points
 *   - Extra time (120 min): exact score 3 points (only if match reached extra time)
 *   - Penalties: exact score 6 points (only if match reached penalties)
 *
 * Each stage is evaluated independently. Stages that the match did not reach do not award points.
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

  // Group stage uses the 90-minute result only.
  if (match.stage === 'GROUP_STAGE') {
    return calculateGroupStagePoints(match, prediction);
  }

  return calculateKnockoutPoints(match, prediction);
}

function calculateGroupStagePoints(
  match: MatchRecord,
  prediction: PredictionRecord
): PointsResult {
  if (
    prediction.home_score === null ||
    prediction.away_score === null ||
    match.home_score === null ||
    match.away_score === null
  ) {
    return { points: 0, exactScore: false, trend: false };
  }

  const exactScore =
    prediction.home_score === match.home_score && prediction.away_score === match.away_score;

  const trendCorrect = isTrendCorrect(
    prediction.home_score,
    prediction.away_score,
    match.home_score,
    match.away_score
  );

  if (exactScore) {
    return { points: 5, exactScore: true, trend: true };
  }

  if (trendCorrect) {
    return { points: 2, exactScore: false, trend: true };
  }

  return { points: 0, exactScore: false, trend: false };
}

function calculateKnockoutPoints(
  match: MatchRecord,
  prediction: PredictionRecord
): PointsResult {
  let totalPoints = 0;
  let exactScoreCount = 0;
  let trendCount = 0;

  // 90 minutes - always evaluated.
  if (
    prediction.home_score === null ||
    prediction.away_score === null ||
    match.home_score === null ||
    match.away_score === null
  ) {
    return { points: 0, exactScore: false, trend: false };
  }

  const regularExact =
    prediction.home_score === match.home_score && prediction.away_score === match.away_score;

  const regularTrend = isTrendCorrect(
    prediction.home_score,
    prediction.away_score,
    match.home_score,
    match.away_score
  );

  if (regularExact) {
    totalPoints += 5;
    exactScoreCount += 1;
    trendCount += 1;
  } else if (regularTrend) {
    totalPoints += 2;
    trendCount += 1;
  }

  // Extra time - evaluated only if the match reached extra time or penalties.
  if (match.duration === 'EXTRA_TIME' || match.duration === 'PENALTY_SHOOTOUT') {
    if (
      prediction.extra_time_home !== null &&
      prediction.extra_time_away !== null &&
      match.extra_time_home !== null &&
      match.extra_time_away !== null
    ) {
      const extraExact =
        prediction.extra_time_home === match.extra_time_home &&
        prediction.extra_time_away === match.extra_time_away;

      const extraTrend = isTrendCorrect(
        prediction.extra_time_home,
        prediction.extra_time_away,
        match.extra_time_home,
        match.extra_time_away
      );

      if (extraExact) {
        totalPoints += 3;
        exactScoreCount += 1;
        trendCount += 1;
      } else if (extraTrend) {
        totalPoints += 2;
        trendCount += 1;
      }
    }
  }

  // Penalties - evaluated only if the match reached penalties.
  if (match.duration === 'PENALTY_SHOOTOUT') {
    if (
      prediction.penalties_home !== null &&
      prediction.penalties_away !== null &&
      match.penalties_home !== null &&
      match.penalties_away !== null
    ) {
      const penaltiesExact =
        prediction.penalties_home === match.penalties_home &&
        prediction.penalties_away === match.penalties_away;

      const penaltiesTrend = isTrendCorrect(
        prediction.penalties_home,
        prediction.penalties_away,
        match.penalties_home,
        match.penalties_away
      );

      if (penaltiesExact) {
        totalPoints += 6;
        exactScoreCount += 1;
        trendCount += 1;
      } else if (penaltiesTrend) {
        totalPoints += 2;
        trendCount += 1;
      }
    }
  }

  return {
    points: totalPoints,
    exactScore: exactScoreCount > 0,
    trend: trendCount > 0
  };
}

/**
 * Returns true if the predicted trend matches the actual trend.
 */
function isTrendCorrect(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): boolean {
  const predictedHomeWins = predictedHome > predictedAway;
  const predictedAwayWins = predictedAway > predictedHome;
  const predictedDraw = predictedHome === predictedAway;

  const actualHomeWins = actualHome > actualAway;
  const actualAwayWins = actualAway > actualHome;
  const actualDraw = actualHome === actualAway;

  return (
    (predictedHomeWins && actualHomeWins) ||
    (predictedAwayWins && actualAwayWins) ||
    (predictedDraw && actualDraw)
  );
}
