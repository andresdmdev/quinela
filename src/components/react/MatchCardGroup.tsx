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
  onClick?: () => void;
}

/**
 * Group stage match card that opens the prediction modal when clicked.
 */
export function MatchCardGroup({
  match,
  homePrediction,
  awayPrediction,
  isLocked = false,
  hasPrediction = false,
  onClick
}: MatchCardGroupProps): React.JSX.Element {
  const isFinished = match.status === 'FINISHED';
  const hasOfficialScore = match.home_score !== null && match.away_score !== null;
  const clickable = onClick !== undefined;

  const displayHomeScore = isFinished && hasOfficialScore ? match.home_score : hasPrediction ? homePrediction : null;
  const displayAwayScore = isFinished && hasOfficialScore ? match.away_score : hasPrediction ? awayPrediction : null;
  const hasDisplayScore = displayHomeScore !== null && displayAwayScore !== null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Card
        variant="group"
        className={`relative overflow-hidden ${clickable ? 'hover:shadow-lg hover:border-[rgba(255,183,3,0.4)] transition-all' : ''}`}
      >
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

          <div className="flex flex-col items-center min-w-[80px]">
            {hasDisplayScore ? (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(2,48,71,0.06)] rounded-xl">
                <span className="text-xl font-bold tabular-nums text-[#1A1A2E]">
                  {displayHomeScore}
                </span>
                <span className="text-[#6B7280] font-bold">-</span>
                <span className="text-xl font-bold tabular-nums text-[#1A1A2E]">
                  {displayAwayScore}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-black text-[#FFB703] tracking-wider">VS</span>
            )}
            <span className="text-[10px] font-medium text-[#6B7280] mt-1 uppercase tracking-wide">
              {isFinished ? 'Resultado oficial' : hasPrediction ? 'Tu pronóstico' : 'Sin pronóstico'}
            </span>
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
      </Card>
    </button>
  );
}
