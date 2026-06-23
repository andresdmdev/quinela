import { formatUtcMinus5 } from '../../lib/timezone';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import type { Match } from './MatchCard';

interface MatchCardKnockoutProps {
  match: Match;
  homePrediction?: number | null;
  awayPrediction?: number | null;
  isLocked?: boolean;
  hasPrediction?: boolean;
  onHomeScoreChange?: (value: string) => void;
  onAwayScoreChange?: (value: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

/**
 * Match card specifically designed for knockout stages.
 */
export function MatchCardKnockout({
  match,
  homePrediction,
  awayPrediction,
  isLocked = false,
  hasPrediction = false,
  onHomeScoreChange,
  onAwayScoreChange,
  onSave,
  isSaving = false
}: MatchCardKnockoutProps): React.JSX.Element {
  const isFinished = match.status === 'FINISHED';
  const hasOfficialScore = match.home_score !== null && match.away_score !== null;

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

  const roundLabel = getRoundLabel(match.stage);
  const isFinal = match.stage === 'FINAL';

  return (
    <Card variant="knockout" className="relative overflow-hidden">
      {isFinal && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFB703] via-[#FB8500] to-[#FFB703]" />
      )}

      <div className="flex items-center justify-between mb-4">
        <Badge variant={isFinal ? 'primary' : 'secondary'} size="md">
          {isFinal ? '🏆 ' : ''}
          {roundLabel}
        </Badge>
        <div className="flex items-center gap-2">
          {isLocked && <Badge variant="danger">Bloqueado</Badge>}
          {hasPrediction && !isLocked && <Badge variant="success">Pronosticado</Badge>}
          {!hasPrediction && !isLocked && <Badge variant="warning">Pendiente</Badge>}
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

        <div className="flex flex-col items-center px-2">
          {isFinished && hasOfficialScore ? (
            <div className="px-4 py-2 bg-[#023047] rounded-2xl mb-2">
              <span className="text-3xl font-black tabular-nums text-white tracking-wider">
                {match.home_score} - {match.away_score}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min={0}
                disabled={isLocked}
                value={homePrediction ?? ''}
                onChange={(event) => onHomeScoreChange?.(event.target.value)}
                className="w-14 h-14 text-center border-2 border-[rgba(251,133,0,0.5)] rounded-2xl text-2xl font-black text-[#1A1A2E] bg-white focus:border-[#FB8500] focus:ring-2 focus:ring-[rgba(251,133,0,0.25)] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] transition-all shadow-sm"
              />
              <span className="text-xl font-black text-[#FB8500]">-</span>
              <input
                type="number"
                min={0}
                disabled={isLocked}
                value={awayPrediction ?? ''}
                onChange={(event) => onAwayScoreChange?.(event.target.value)}
                className="w-14 h-14 text-center border-2 border-[rgba(251,133,0,0.5)] rounded-2xl text-2xl font-black text-[#1A1A2E] bg-white focus:border-[#FB8500] focus:ring-2 focus:ring-[rgba(251,133,0,0.25)] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] transition-all shadow-sm"
              />
            </div>
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

      {!isFinished && onSave && (
        <button
          onClick={onSave}
          disabled={isLocked || isSaving}
          className="w-full mt-5 bg-gradient-to-r from-[#023047] to-[#03496b] text-white rounded-xl py-3 text-sm font-bold hover:shadow-lg hover:shadow-[rgba(2,48,71,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
        >
          {isSaving ? 'Guardando...' : hasPrediction ? 'Actualizar pronóstico' : 'Guardar pronóstico'}
        </button>
      )}

      {isFinished && (
        <div className="mt-4 text-center text-xs text-[#6B7280] font-medium bg-[rgba(2,48,71,0.04)] rounded-lg py-2">
          Eliminación directa - pronóstico cerrado
        </div>
      )}
    </Card>
  );
}
