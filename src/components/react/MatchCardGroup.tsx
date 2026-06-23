import { formatUtcMinus5 } from '../../lib/timezone';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { getGroupLabel, type Match } from './MatchCard';

interface MatchCardGroupProps {
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
 * Match card specifically designed for the group stage.
 */
export function MatchCardGroup({
  match,
  homePrediction,
  awayPrediction,
  isLocked = false,
  hasPrediction = false,
  onHomeScoreChange,
  onAwayScoreChange,
  onSave,
  isSaving = false
}: MatchCardGroupProps): React.JSX.Element {
  const isFinished = match.status === 'FINISHED';
  const hasOfficialScore = match.home_score !== null && match.away_score !== null;

  return (
    <Card variant="group" className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary">Grupo {getGroupLabel(match.group_name)}</Badge>
          {isLocked && <Badge variant="danger">Bloqueado</Badge>}
          {hasPrediction && !isLocked && <Badge variant="success">Pronosticado</Badge>}
          {!hasPrediction && !isLocked && <Badge variant="warning">Pendiente</Badge>}
        </div>
        <span className="text-xs font-medium text-[#6B7280]">
          {formatUtcMinus5(match.scheduled_at)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <img
            src={match.home_flag}
            alt={match.home_team}
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
          <span className="font-semibold text-[#1A1A2E] truncate">{match.home_team}</span>
        </div>

        <div className="flex items-center gap-2">
          {isFinished && hasOfficialScore ? (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(2,48,71,0.06)] rounded-xl">
              <span className="text-xl font-bold tabular-nums text-[#1A1A2E]">
                {match.home_score}
              </span>
              <span className="text-[#6B7280] font-bold">-</span>
              <span className="text-xl font-bold tabular-nums text-[#1A1A2E]">
                {match.away_score}
              </span>
            </div>
          ) : (
            <>
              <input
                type="number"
                min={0}
                disabled={isLocked}
                value={homePrediction ?? ''}
                onChange={(event) => onHomeScoreChange?.(event.target.value)}
                className="w-12 h-11 text-center border-2 border-[rgba(255,183,3,0.4)] rounded-xl text-lg font-bold text-[#1A1A2E] bg-white focus:border-[#FFB703] focus:ring-2 focus:ring-[rgba(255,183,3,0.25)] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] transition-all"
              />
              <span className="text-[#6B7280] font-bold">-</span>
              <input
                type="number"
                min={0}
                disabled={isLocked}
                value={awayPrediction ?? ''}
                onChange={(event) => onAwayScoreChange?.(event.target.value)}
                className="w-12 h-11 text-center border-2 border-[rgba(255,183,3,0.4)] rounded-xl text-lg font-bold text-[#1A1A2E] bg-white focus:border-[#FFB703] focus:ring-2 focus:ring-[rgba(255,183,3,0.25)] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] transition-all"
              />
            </>
          )}
        </div>

        <div className="flex-1 flex items-center gap-3 justify-end min-w-0">
          <span className="font-semibold text-[#1A1A2E] truncate text-right">
            {match.away_team}
          </span>
          <img
            src={match.away_flag}
            alt={match.away_team}
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {!isFinished && onSave && (
        <button
          onClick={onSave}
          disabled={isLocked || isSaving}
          className="w-full mt-4 bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#1A1A2E] rounded-xl py-2.5 text-sm font-bold hover:shadow-md hover:shadow-[rgba(251,133,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
        >
          {isSaving ? 'Guardando...' : hasPrediction ? 'Actualizar pronóstico' : 'Guardar pronóstico'}
        </button>
      )}

      {isFinished && (
        <div className="mt-3 text-center text-xs text-[#6B7280] font-medium">
          Partido finalizado - pronóstico cerrado
        </div>
      )}
    </Card>
  );
}
