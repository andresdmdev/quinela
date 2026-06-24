import { formatUtcMinus5 } from '../../lib/timezone';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { getGroupLabel, getStageLabel, type Match } from './MatchCard';

interface PredictionScores {
  home_score: number | null;
  away_score: number | null;
  extra_time_home: number | null;
  extra_time_away: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
}

interface MyPredictionCardProps {
  match: Match;
  prediction: PredictionScores;
  points: number;
  exactScore: boolean;
  trend: boolean;
  isLocked?: boolean;
  onClick: () => void;
}

/**
 * Card that displays a user's prediction along with the actual result and earned points.
 * Clicking opens the prediction modal for detailed information.
 */
export function MyPredictionCard({
  match,
  prediction,
  points,
  exactScore,
  trend,
  isLocked = false,
  onClick
}: MyPredictionCardProps): React.JSX.Element {
  const isFinished = match.status === 'FINISHED';

  const actualHomeScore = match.stage === 'GROUP_STAGE' ? match.home_score : match.home_final_score;
  const actualAwayScore = match.stage === 'GROUP_STAGE' ? match.away_score : match.away_final_score;
  const hasActualScore = actualHomeScore !== null && actualAwayScore !== null;

  const predictedHomeScore = prediction.home_score ?? 0;
  const predictedAwayScore = prediction.away_score ?? 0;

  function getStatusBadge(): React.JSX.Element {
    if (isFinished) {
      return <Badge variant="default">Finalizado</Badge>;
    }
    if (isLocked) {
      return <Badge variant="danger">Bloqueado</Badge>;
    }
    return <Badge variant="success">Abierto</Badge>;
  }

  function getPointsBadge(): { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' } {
    if (!isFinished) {
      return { label: 'Pendiente', variant: 'warning' };
    }

    if (points > 0) {
      return { label: `+${points} pts`, variant: 'primary' };
    }

    return { label: '+0 pts', variant: 'default' };
  }

  const pointsBadge = getPointsBadge();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left cursor-pointer"
    >
      <Card
        variant="default"
        className="relative overflow-hidden hover:shadow-lg hover:border-[rgba(255,183,3,0.3)] transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {match.stage === 'GROUP_STAGE' ? (
              <Badge variant="primary">Grupo {getGroupLabel(match.group_name)}</Badge>
            ) : (
              <Badge variant="secondary">{getStageLabel(match.stage)}</Badge>
            )}
            {getStatusBadge()}
          </div>
          <Badge variant={pointsBadge.variant}>{pointsBadge.label}</Badge>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <img
              src={match.home_flag}
              alt={match.home_team}
              className="w-12 h-12 object-contain drop-shadow-sm mb-2"
            />
            <span className="text-sm font-semibold text-[#1A1A2E] text-center truncate w-full">
              {match.home_team}
            </span>
          </div>

          <div className="flex flex-col items-center px-2 min-w-[80px]">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(255,183,3,0.12)] rounded-xl">
              <span className="text-xl font-bold tabular-nums text-[#1A1A2E]">
                {predictedHomeScore}
              </span>
              <span className="text-[#6B7280] font-bold">-</span>
              <span className="text-xl font-bold tabular-nums text-[#1A1A2E]">
                {predictedAwayScore}
              </span>
            </div>
            <span className="text-xs text-[#6B7280] mt-1 font-medium">Tu pronóstico</span>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-0">
            <img
              src={match.away_flag}
              alt={match.away_team}
              className="w-12 h-12 object-contain drop-shadow-sm mb-2"
            />
            <span className="text-sm font-semibold text-[#1A1A2E] text-center truncate w-full">
              {match.away_team}
            </span>
          </div>
        </div>

        <div className="bg-[rgba(2,48,71,0.03)] rounded-xl p-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-[#6B7280] font-medium">Resultado: </span>
            <span className="font-bold text-[#1A1A2E]">
              {hasActualScore ? `${actualHomeScore} - ${actualAwayScore}` : '-'}
            </span>
          </div>

          {isFinished && (
            <div className="flex items-center gap-2">
              {exactScore && (
                <span className="text-xs font-bold text-[#06D6A0]">✓ Exacto</span>
              )}
              {!exactScore && trend && (
                <span className="text-xs font-bold text-[#FFB703]">→ Tendencia</span>
              )}
              {!exactScore && !trend && (
                <span className="text-xs font-bold text-[#6B7280]">✗ Fallado</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-[#6B7280]">
            {formatUtcMinus5(match.scheduled_at)}
          </span>
        </div>
      </Card>
    </button>
  );
}
