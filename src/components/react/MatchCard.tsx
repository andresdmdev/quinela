import { formatUtcMinus5 } from '../../lib/timezone';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

export interface Match {
  id: string;
  external_id: string;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  scheduled_at: string;
  utc_minus_5_at: string;
}

interface MatchCardProps {
  match: Match;
  children?: React.ReactNode;
}

/**
 * Determines the display status of a match.
 */
export function getMatchStatus(status: string): { label: string; variant: 'default' | 'success' | 'danger' | 'warning' | 'info' } {
  switch (status) {
    case 'FINISHED':
      return { label: 'Finalizado', variant: 'info' };
    case 'IN_PLAY':
      return { label: 'En vivo', variant: 'success' };
    case 'PAUSED':
      return { label: 'Descanso', variant: 'warning' };
    case 'POSTPONED':
      return { label: 'Postergado', variant: 'warning' };
    case 'SCHEDULED':
    default:
      return { label: 'Pendiente', variant: 'default' };
  }
}

/**
 * Formats a stage code into a readable Spanish label.
 */
export function getStageLabel(stage: string): string {
  switch (stage) {
    case 'GROUP_STAGE':
      return 'Fase de Grupos';
    case 'ROUND_OF_16':
      return 'Octavos de Final';
    case 'QUARTER_FINAL':
      return 'Cuartos de Final';
    case 'SEMI_FINAL':
      return 'Semifinal';
    case 'THIRD_PLACE':
      return 'Tercer Lugar';
    case 'FINAL':
      return 'Final';
    default:
      return stage;
  }
}

/**
 * Base match card component with World Cup styling.
 */
export function MatchCard({ match, children }: MatchCardProps): React.JSX.Element {
  const status = getMatchStatus(match.status);
  const stageLabel = getStageLabel(match.stage);
  const hasScore = match.home_score !== null && match.away_score !== null;

  return (
    <Card variant="default" className="overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary">{stageLabel}</Badge>
          {match.group_name && <Badge variant="default">Grupo {match.group_name}</Badge>}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <img
            src={match.home_flag}
            alt={match.home_team}
            className="w-12 h-12 object-contain drop-shadow-sm"
          />
          <span className="text-sm font-semibold text-[#1A1A2E] text-center truncate w-full">
            {match.home_team}
          </span>
        </div>

        <div className="flex flex-col items-center px-4 min-w-[80px]">
          {hasScore || match.status === 'IN_PLAY' || match.status === 'PAUSED' ? (
            <span className="text-3xl font-extrabold tabular-nums text-[#1A1A2E] tracking-tight">
              {match.home_score ?? '-'}:{match.away_score ?? '-'}
            </span>
          ) : (
            <span className="text-2xl font-black text-[#FFB703] tracking-wider">VS</span>
          )}
          <span className="text-xs text-[#6B7280] mt-1 font-medium">
            {formatUtcMinus5(match.scheduled_at)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <img
            src={match.away_flag}
            alt={match.away_team}
            className="w-12 h-12 object-contain drop-shadow-sm"
          />
          <span className="text-sm font-semibold text-[#1A1A2E] text-center truncate w-full">
            {match.away_team}
          </span>
        </div>
      </div>

      {children && <div className="mt-4 pt-4 border-t border-[rgba(2,48,71,0.06)]">{children}</div>}
    </Card>
  );
}
