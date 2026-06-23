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
  onHomeScoreChange?: (value: string) => void;
  onAwayScoreChange?: (value: string) => void;
  onExtraTimeHomeChange?: (value: string) => void;
  onExtraTimeAwayChange?: (value: string) => void;
  onPenaltiesHomeChange?: (value: string) => void;
  onPenaltiesAwayChange?: (value: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

/**
 * Match card specifically designed for knockout stages.
 * Shows conditional extra time and penalty inputs when the user predicts a draw.
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
  onHomeScoreChange,
  onAwayScoreChange,
  onExtraTimeHomeChange,
  onExtraTimeAwayChange,
  onPenaltiesHomeChange,
  onPenaltiesAwayChange,
  onSave,
  isSaving = false
}: MatchCardKnockoutProps): React.JSX.Element {
  const isFinished = match.status === 'FINISHED';
  const hasOfficialScore = match.home_final_score !== null && match.away_final_score !== null;
  const displayHomeScore = match.home_final_score ?? match.home_score;
  const displayAwayScore = match.away_final_score ?? match.away_score;

  const predictedRegularDraw =
    homePrediction !== undefined &&
    awayPrediction !== undefined &&
    homePrediction !== null &&
    awayPrediction !== null &&
    homePrediction === awayPrediction;

  const predictedExtraTimeDraw =
    predictedRegularDraw &&
    extraTimeHomePrediction !== undefined &&
    extraTimeAwayPrediction !== undefined &&
    extraTimeHomePrediction !== null &&
    extraTimeAwayPrediction !== null &&
    extraTimeHomePrediction === extraTimeAwayPrediction;

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

  const renderScoreInput = (
    value: number | null | undefined,
    onChange: ((value: string) => void) | undefined,
    disabled: boolean,
    large = false
  ): React.JSX.Element => (
    <input
      type="number"
      min={0}
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      className={`text-center border-2 border-[rgba(251,133,0,0.5)] rounded-2xl font-black text-[#1A1A2E] bg-white focus:border-[#FB8500] focus:ring-2 focus:ring-[rgba(251,133,0,0.25)] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] transition-all shadow-sm ${
        large ? 'w-14 h-14 text-2xl' : 'w-11 h-10 text-xl'
      }`}
    />
  );

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

        <div className="flex flex-col items-center px-2 min-w-[120px]">
          {isFinished && hasOfficialScore ? (
            <div className="px-4 py-2 bg-[#023047] rounded-2xl mb-2">
              <span className="text-3xl font-black tabular-nums text-white tracking-wider">
                {displayHomeScore} - {displayAwayScore}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              {renderScoreInput(homePrediction, onHomeScoreChange, isLocked, true)}
              <span className="text-xl font-black text-[#FB8500]">-</span>
              {renderScoreInput(awayPrediction, onAwayScoreChange, isLocked, true)}
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

      {!isFinished && predictedRegularDraw && (
        <div className="mt-4 space-y-3 border-t border-[rgba(2,48,71,0.08)] pt-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-bold text-[#023047]">120&apos;:</span>
            {renderScoreInput(extraTimeHomePrediction, onExtraTimeHomeChange, isLocked)}
            <span className="text-lg font-black text-[#FB8500]">-</span>
            {renderScoreInput(extraTimeAwayPrediction, onExtraTimeAwayChange, isLocked)}
          </div>

          {predictedExtraTimeDraw && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-bold text-[#023047]">Penales:</span>
              {renderScoreInput(penaltiesHomePrediction, onPenaltiesHomeChange, isLocked)}
              <span className="text-lg font-black text-[#FB8500]">-</span>
              {renderScoreInput(penaltiesAwayPrediction, onPenaltiesAwayChange, isLocked)}
            </div>
          )}
        </div>
      )}

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
