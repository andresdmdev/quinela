import type { MatchRecord } from '../pages/api/matches';
import type { PredictionRecord } from '../pages/api/predictions';

export interface StageResult {
  points: number;
  exact: boolean;
  trend: boolean;
  label: string;
}

export interface StageBreakdown {
  ninety: StageResult;
  extraTime?: StageResult;
  penalties?: StageResult;
}

export interface PointsResult {
  points: number;
  exactScore: boolean;
  trend: boolean;
  breakdown: StageBreakdown;
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
    return {
      points: 0,
      exactScore: false,
      trend: false,
      breakdown: {
        ninety: { points: 0, exact: false, trend: false, label: "90'" }
      }
    };
  }

  if (
    prediction.home_score === null ||
    prediction.away_score === null ||
    match.home_score === null ||
    match.away_score === null
  ) {
    return {
      points: 0,
      exactScore: false,
      trend: false,
      breakdown: {
        ninety: { points: 0, exact: false, trend: false, label: "90'" }
      }
    };
  }

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
    return {
      points: 0,
      exactScore: false,
      trend: false,
      breakdown: {
        ninety: { points: 0, exact: false, trend: false, label: "90'" }
      }
    };
  }

  const exactScore =
    prediction.home_score === match.home_score && prediction.away_score === match.away_score;

  const trendCorrect = isTrendCorrect(
    prediction.home_score,
    prediction.away_score,
    match.home_score,
    match.away_score
  );

  const ninetyPoints = exactScore ? 5 : trendCorrect ? 2 : 0;

  return {
    points: ninetyPoints,
    exactScore: exactScore,
    trend: trendCorrect,
    breakdown: {
      ninety: {
        points: ninetyPoints,
        exact: exactScore,
        trend: trendCorrect,
        label: "90'"
      }
    }
  };
}

function calculateKnockoutPoints(
  match: MatchRecord,
  prediction: PredictionRecord
): PointsResult {
  let totalPoints = 0;
  let exactScoreCount = 0;
  let trendCount = 0;

  if (
    prediction.home_score === null ||
    prediction.away_score === null ||
    match.home_score === null ||
    match.away_score === null
  ) {
    return {
      points: 0,
      exactScore: false,
      trend: false,
      breakdown: {
        ninety: { points: 0, exact: false, trend: false, label: "90'" }
      }
    };
  }

  const ninetyExact =
    prediction.home_score === match.home_score && prediction.away_score === match.away_score;

  const ninetyTrend = isTrendCorrect(
    prediction.home_score,
    prediction.away_score,
    match.home_score,
    match.away_score
  );

  const ninetyPoints = ninetyExact ? 5 : ninetyTrend ? 2 : 0;
  totalPoints += ninetyPoints;
  if (ninetyExact) exactScoreCount += 1;
  if (ninetyTrend) trendCount += 1;

  const ninetyResult: StageResult = {
    points: ninetyPoints,
    exact: ninetyExact,
    trend: ninetyTrend,
    label: "90'"
  };

  let extraTimeResult: StageResult | undefined;

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

      const extraPoints = extraExact ? 3 : extraTrend ? 2 : 0;
      totalPoints += extraPoints;
      if (extraExact) exactScoreCount += 1;
      if (extraTrend) trendCount += 1;

      extraTimeResult = {
        points: extraPoints,
        exact: extraExact,
        trend: extraTrend,
        label: "120'"
      };
    }
  }

  let penaltiesResult: StageResult | undefined;

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

      const penaltiesPoints = penaltiesExact ? 6 : penaltiesTrend ? 2 : 0;
      totalPoints += penaltiesPoints;
      if (penaltiesExact) exactScoreCount += 1;
      if (penaltiesTrend) trendCount += 1;

      penaltiesResult = {
        points: penaltiesPoints,
        exact: penaltiesExact,
        trend: penaltiesTrend,
        label: "Penales"
      };
    }
  }

  return {
    points: totalPoints,
    exactScore: exactScoreCount > 0,
    trend: trendCount > 0,
    breakdown: {
      ninety: ninetyResult,
      ...(extraTimeResult && { extraTime: extraTimeResult }),
      ...(penaltiesResult && { penalties: penaltiesResult })
    }
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
