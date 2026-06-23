import { useEffect, useState } from 'react';
import { formatUtcMinus5 } from '../../lib/timezone';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { getGroupLabel, getStageLabel } from './MatchCard';
import type { UserPrediction } from '../../pages/api/users/[id]/predictions';
import type { LeaderboardEntry } from './Leaderboard';

interface UserPredictionsModalProps {
  user: LeaderboardEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserPredictionsApiResponse {
  predictions: UserPrediction[];
}

/**
 * Modal that displays the predictions of a selected user for finished or locked matches.
 * Promotes transparency by letting anyone see what others predicted once results are public.
 */
export function UserPredictionsModal({
  user,
  isOpen,
  onClose
}: UserPredictionsModalProps): React.JSX.Element | null {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    if (!isOpen || !user) {
      return;
    }

    const currentUser = user;

    async function loadPredictions(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${currentUser.userId}/predictions`);

        if (!response.ok) {
          throw new Error('Error loading user predictions');
        }

        const data = (await response.json()) as UserPredictionsApiResponse;
        setPredictions(data.predictions);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadPredictions();
  }, [isOpen, user?.userId]);

  useEffect((): (() => void) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return (): void => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl shadow-[rgba(2,48,71,0.25)] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6B7280] hover:bg-[rgba(2,48,71,0.06)] hover:text-[#1A1A2E] transition-colors z-10"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-[rgba(2,48,71,0.08)] flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFB703] to-[#FB8500] flex items-center justify-center font-bold text-white text-2xl shadow-sm">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-xl font-black text-[#1A1A2E]">{user.displayName}</h2>
            <p className="text-sm text-[#6B7280]">
              {user.totalPoints} pts · {user.exactScores} exactos · {user.trends} tendencias
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFB703]"></div>
            </div>
          ) : error ? (
            <div className="bg-[rgba(239,71,111,0.08)] border border-[rgba(239,71,111,0.2)] rounded-2xl p-4 text-center">
              <p className="text-[#EF476F] text-sm font-medium">{error}</p>
            </div>
          ) : predictions.length === 0 ? (
            <EmptyState
              title="Sin pronósticos visibles"
              description="Este usuario aún no tiene pronósticos en partidos finalizados o bloqueados."
              icon="🥅"
            />
          ) : (
            <div className="space-y-4">
              {predictions.map((item) => (
                <PredictionSummaryCard key={item.prediction.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[rgba(2,48,71,0.08)]">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PredictionSummaryCardProps {
  item: UserPrediction;
}

/**
 * Compact card that summarizes a single user prediction, the actual result and earned points.
 */
function PredictionSummaryCard({ item }: PredictionSummaryCardProps): React.JSX.Element {
  const { prediction, match, points, exactScore, trend } = item;
  const isFinished = match.status === 'FINISHED';

  const actualHomeScore = match.stage === 'GROUP_STAGE' ? match.home_score : match.home_final_score;
  const actualAwayScore = match.stage === 'GROUP_STAGE' ? match.away_score : match.away_final_score;
  const hasActualScore = actualHomeScore !== null && actualAwayScore !== null;

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
    <div className="bg-[rgba(2,48,71,0.03)] rounded-2xl p-4 border border-[rgba(2,48,71,0.06)]">
      <div className="flex items-center justify-between mb-3">
        {match.stage === 'GROUP_STAGE' ? (
          <Badge variant="primary">Grupo {getGroupLabel(match.group_name)}</Badge>
        ) : (
          <Badge variant="secondary">{getStageLabel(match.stage)}</Badge>
        )}
        <Badge variant={pointsBadge.variant}>{pointsBadge.label}</Badge>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex flex-col items-center flex-1 min-w-0">
          <img
            src={match.home_flag}
            alt={match.home_team}
            className="w-10 h-10 object-contain drop-shadow-sm mb-1"
          />
          <span className="text-xs font-semibold text-[#1A1A2E] text-center truncate w-full">
            {match.home_team}
          </span>
        </div>

        <div className="flex flex-col items-center px-2 min-w-[80px]">
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-[rgba(2,48,71,0.08)]">
            <span className="text-lg font-bold tabular-nums text-[#1A1A2E]">
              {prediction.home_score ?? '-'}
            </span>
            <span className="text-[#6B7280] font-bold">-</span>
            <span className="text-lg font-bold tabular-nums text-[#1A1A2E]">
              {prediction.away_score ?? '-'}
            </span>
          </div>
          <span className="text-[10px] text-[#6B7280] mt-1">Pronóstico</span>
        </div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          <img
            src={match.away_flag}
            alt={match.away_team}
            className="w-10 h-10 object-contain drop-shadow-sm mb-1"
          />
          <span className="text-xs font-semibold text-[#1A1A2E] text-center truncate w-full">
            {match.away_team}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm bg-white rounded-xl p-2.5">
        <div>
          <span className="text-[#6B7280]">Resultado: </span>
          <span className="font-bold text-[#1A1A2E]">
            {hasActualScore ? `${actualHomeScore} - ${actualAwayScore}` : '-'}
          </span>
        </div>

        <div>
          {isFinished && exactScore && (
            <span className="text-xs font-bold text-[#06D6A0]">✓ Exacto</span>
          )}
          {isFinished && !exactScore && trend && (
            <span className="text-xs font-bold text-[#FFB703]">→ Tendencia</span>
          )}
          {isFinished && !exactScore && !trend && (
            <span className="text-xs font-bold text-[#6B7280]">✗ Fallado</span>
          )}
          {!isFinished && <span className="text-xs font-bold text-[#B45309]">🔒 Bloqueado</span>}
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs text-[#6B7280]">{formatUtcMinus5(match.scheduled_at)}</span>
      </div>
    </div>
  );
}
