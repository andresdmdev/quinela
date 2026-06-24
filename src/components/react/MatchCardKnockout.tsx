import { formatUtcMinus5 } from '../../lib/timezone';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import type { Match } from './MatchCard';

interface MatchCardKnockoutProps {
  match: Match;
  homePrediction?: number | null;
  awayPrediction?: number | null;
  extraTimeHomePrediction?: number | null;
  extraTimeAwayPrediction?: number | null;
  penaltiesHomePrediction?: number | null;
  penaltiesAwayPrediction?: number | null;
  isLocked?: boolean;
  hasPrediction?: boolean;
  showOpen?: boolean;
  onClick?: () => void;
}

/**
 * Knockout stage match card that opens the prediction modal when clicked.
 */
export function MatchCardKnockout({
  match,
  homePrediction,
  awayPrediction,
  extraTimeHomePrediction,
  extraTimeAwayPrediction,
  penaltiesHomePrediction,
  penaltiesAwayPrediction,
  isLocked = false,
  hasPrediction = false,
  showOpen = false,
  onClick
}: MatchCardKnockoutProps): React.JSX.Element {
  const isFinished = match.status === 'FINISHED';
  const hasOfficialScore = match.home_final_score !== null && match.away_final_score !== null;
  const clickable = onClick !== undefined;

  const displayHomeScore = isFinished && hasOfficialScore ? match.home_final_score : hasPrediction ? homePrediction : null;
  const displayAwayScore = isFinished && hasOfficialScore ? match.away_final_score : hasPrediction ? awayPrediction : null;
  const hasDisplayScore = displayHomeScore !== null && displayAwayScore !== null;

  const hasExtraPrediction =
    hasPrediction && extraTimeHomePrediction !== null && extraTimeAwayPrediction !== null;
  const hasPenaltiesPrediction =
    hasPrediction && penaltiesHomePrediction !== null && penaltiesAwayPrediction !== null;

  function getRoundLabel(stage: string): string {
    switch (stage) {
      case 'ROUND_OF_16':
        return 'Octavos de Final';
      case 'QUARTER_FINAL':
        return 'Cuartos de Final';
      case 'SEMI_FINAL':
        return 'Semifinal';
      case 'THIRD_PLACE':
        return 'Tercer Lugar';
      case 'FINAL':
        return 'Gran Final';
      default:
        return 'Eliminatoria';
    }
  }

  function getStatusBadge(): React.JSX.Element {
    if (isFinished) {
      return <Badge variant="default">Finalizado</Badge>;
    }
    if (isLocked) {
      return <Badge variant="danger">Bloqueado</Badge>;
    }
    if (showOpen && hasPrediction) {
      return <Badge variant="success">Abierto</Badge>;
    }
    if (hasPrediction) {
      return <Badge variant="success">Pronosticado</Badge>;
    }
    return <Badge variant="warning">Sin pronóstico</Badge>;
  }

  const roundLabel = getRoundLabel(match.stage);
  const isFinal = match.stage === 'FINAL';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Card
        variant="knockout"
        className={`relative overflow-hidden ${clickable ? 'hover:shadow-lg hover:border-[rgba(2,48,71,0.2)] transition-all' : ''}`}
      >
        {isFinal && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFB703] via-[#FB8500] to-[#FFB703]" />
        )}

        <div className="flex items-center justify-between mb-4">
          <Badge variant={isFinal ? 'primary' : 'secondary'} size="md">
            {isFinal ? '🏆 ' : ''}
            {roundLabel}
          </Badge>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm shadow-[rgba(2,48,71,0.08)] p-2 mb-2">
              <img
                src={match.home_flag}
                alt={match.home_team}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[#1A1A2E] text-center text-sm truncate w-full">
              {match.home_team}
            </span>
            <span className="text-xs text-[#6B7280]">Local</span>
          </div>

          <div className="flex flex-col items-center px-2 min-w-[120px]">
            {hasDisplayScore ? (
              <div className="px-4 py-2 bg-[#023047] rounded-2xl mb-2">
                <span className="text-3xl font-black tabular-nums text-white tracking-wider">
                  {displayHomeScore} - {displayAwayScore}
                </span>
              </div>
            ) : (
              <span className="text-4xl font-black text-[#FFB703] tracking-wider mb-2">VS</span>
            )}
            <span className="text-xs font-medium text-[#6B7280]">
              {formatUtcMinus5(match.scheduled_at)}
            </span>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm shadow-[rgba(2,48,71,0.08)] p-2 mb-2">
              <img
                src={match.away_flag}
                alt={match.away_team}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[#1A1A2E] text-center text-sm truncate w-full">
              {match.away_team}
            </span>
            <span className="text-xs text-[#6B7280]">Visitante</span>
          </div>
        </div>

        {hasPrediction && !isFinished && (
          <div className="mt-4 text-center">
            <span className="text-xs font-medium text-[#6B7280]">
              {hasPenaltiesPrediction
                ? 'Pronóstico: 90\', 120\' y penales'
                : hasExtraPrediction
                ? "Pronóstico: 90' y 120'"
                : "Pronóstico: 90'"}
            </span>
          </div>
        )}

        {isFinished && (
          <div className="mt-4 text-center text-xs text-[#6B7280] font-medium bg-[rgba(2,48,71,0.04)] rounded-lg py-2">
            Eliminación directa - pronóstico cerrado
          </div>
        )}
      </Card>
    </button>
  );
}
