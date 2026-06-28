import { useEffect, useState } from 'react';
import { formatUtcMinus5 } from '../../lib/timezone';
import { calculatePoints, type PointsResult } from '../../lib/points';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Toast } from './ui/Toast';
import { getGroupLabel, type Match } from './MatchCard';
import type { FootballMatchDetails, FootballPlayer, FootballReferee, FootballTeamDetails } from '../../lib/football-data';
import type { MatchRecord } from '../../pages/api/matches';
import type { PredictionRecord } from '../../pages/api/predictions';

interface PredictionModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface PredictionState {
  home_score: number | null;
  away_score: number | null;
  extra_time_home: number | null;
  extra_time_away: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
}

interface MatchDetailsApiResponse {
  match: Match;
  details: FootballMatchDetails | null;
  rate_limited: boolean;
}

interface PredictionsApiResponse {
  predictions: Array<{
    match_id: string;
    home_score: number | null;
    away_score: number | null;
    extra_time_home: number | null;
    extra_time_away: number | null;
    penalties_home: number | null;
    penalties_away: number | null;
  }>;
}

/**
 * Determines whether predictions for a match are locked.
 * Predictions lock 1 hour before the scheduled kick-off or when the match is no longer TIMED.
 */
function isMatchLocked(match: Match): boolean {
  const now = new Date();
  const matchTime = new Date(match.scheduled_at);
  const lockTime = new Date(matchTime.getTime() - 10 * 60 * 1000);

  if (now >= lockTime) return true;
  if (match.status !== 'TIMED') return true;

  return false;
}

/**
 * Returns a readable Spanish label for a knockout round.
 */
function getRoundLabel(stage: string): string {
  switch (stage) {
    case 'LAST_32':
      return 'Ronda de 32';
    case 'LAST_16':
      return 'Octavos de Final';
    case 'QUARTER_FINALS':
      return 'Cuartos de Final';
    case 'SEMI_FINALS':
      return 'Semifinal';
    case 'THIRD_PLACE':
      return 'Tercer Lugar';
    case 'FINAL':
      return 'Gran Final';
    default:
      return 'Eliminatoria';
  }
}

/**
 * Modal that displays match information, team lineups and allows entering or updating a prediction.
 */
export function PredictionModal({
  match,
  isOpen,
  onClose,
  onSaved
}: PredictionModalProps): React.JSX.Element | null {
  const [details, setDetails] = useState<FootballMatchDetails | null>(null);
  const [prediction, setPrediction] = useState<PredictionState>({
    home_score: null,
    away_score: null,
    extra_time_home: null,
    extra_time_away: null,
    penalties_home: null,
    penalties_away: null
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pointsResult, setPointsResult] = useState<PointsResult | null>(null);

  const isKnockout = match ? match.stage !== 'GROUP_STAGE' : false;
  const locked = match ? isMatchLocked(match) : false;

  const predictedRegularDraw =
    prediction.home_score !== null &&
    prediction.away_score !== null &&
    prediction.home_score === prediction.away_score;

  const predictedExtraTimeDraw =
    predictedRegularDraw &&
    prediction.extra_time_home !== null &&
    prediction.extra_time_away !== null &&
    prediction.extra_time_home === prediction.extra_time_away;

  useEffect((): void => {
    if (!isOpen || !match) {
      return;
    }

    const currentMatch = match;

    async function loadData(): Promise<void> {
      setLoading(true);
      setRateLimited(false);

      try {
        const [detailsResponse, predictionsResponse] = await Promise.all([
          fetch(`/api/matches/${currentMatch.id}`),
          fetch('/api/predictions')
        ]);

        if (!detailsResponse.ok) {
          throw new Error('Error loading match details');
        }

        const detailsData = (await detailsResponse.json()) as MatchDetailsApiResponse;
        setDetails(detailsData.details);
        setRateLimited(detailsData.rate_limited);

        if (predictionsResponse.ok) {
          const predictionsData = (await predictionsResponse.json()) as PredictionsApiResponse;
          const existing = predictionsData.predictions.find((p) => p.match_id === currentMatch.id);

          if (existing) {
            setPrediction({
              home_score: existing.home_score ?? null,
              away_score: existing.away_score ?? null,
              extra_time_home: existing.extra_time_home ?? null,
              extra_time_away: existing.extra_time_away ?? null,
              penalties_home: existing.penalties_home ?? null,
              penalties_away: existing.penalties_away ?? null
            });

            if (currentMatch.status === 'FINISHED') {
              const result = calculatePoints(
                currentMatch as unknown as MatchRecord,
                existing as unknown as PredictionRecord
              );
              setPointsResult(result);
            } else {
              setPointsResult(null);
            }
          } else {
            setPrediction({
              home_score: null,
              away_score: null,
              extra_time_home: null,
              extra_time_away: null,
              penalties_home: null,
              penalties_away: null
            });
            setPointsResult(null);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading match details';
        setToast({ message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [isOpen, match?.id]);

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

  function handleScoreChange(
    field: keyof PredictionState,
    value: string
  ): void {
    const numberValue = value === '' ? null : parseInt(value, 10);

    setPrediction((previous) => {
      const updated: PredictionState = { ...previous, [field]: numberValue };

      if (field === 'home_score' || field === 'away_score') {
        if (updated.home_score !== updated.away_score) {
          updated.extra_time_home = null;
          updated.extra_time_away = null;
          updated.penalties_home = null;
          updated.penalties_away = null;
        }
      }

      if (field === 'extra_time_home' || field === 'extra_time_away') {
        if (updated.extra_time_home !== updated.extra_time_away) {
          updated.penalties_home = null;
          updated.penalties_away = null;
        }
      }

      return updated;
    });
  }

  async function handleSave(): Promise<void> {
    if (!match) return;

    if (prediction.home_score === null || prediction.away_score === null) {
      setToast({ message: 'Ingresa ambos marcadores de los 90 minutos', type: 'error' });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: prediction.home_score,
          awayScore: prediction.away_score,
          extraTimeHome: prediction.extra_time_home,
          extraTimeAway: prediction.extra_time_away,
          penaltiesHome: prediction.penalties_home,
          penaltiesAway: prediction.penalties_away
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Error saving prediction');
      }

      setToast({ message: 'Pronóstico guardado', type: 'success' });
      onSaved?.();

      setTimeout((): void => {
        onClose();
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

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

  const scoreInputClass =
    'w-14 h-14 text-center border-2 border-[rgba(255,183,3,0.5)] rounded-xl text-2xl font-black text-[#1A1A2E] bg-white focus:border-[#FFB703] focus:ring-2 focus:ring-[rgba(255,183,3,0.25)] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] transition-all';

  if (!isOpen || !match) {
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
        aria-labelledby="prediction-modal-title"
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

        <div className="p-6 border-b border-[rgba(2,48,71,0.08)]">
          <div className="flex items-center justify-between mb-3 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              {match.stage === 'GROUP_STAGE' ? (
                <Badge variant="primary">Grupo {getGroupLabel(match.group_name)}</Badge>
              ) : (
                <Badge variant="secondary">{getRoundLabel(match.stage)}</Badge>
              )}
              {locked && <Badge variant="danger">Bloqueado</Badge>}
              {!locked && <Badge variant="success">Abierto</Badge>}
            </div>
            <span className="text-xs font-medium text-[#6B7280]">
              {formatUtcMinus5(match.scheduled_at)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-16 h-16 rounded-xl bg-white shadow-sm shadow-[rgba(2,48,71,0.08)] p-2 mb-2 border border-[rgba(2,48,71,0.06)]">
                <img
                  src={match.home_flag ?? 'https://via.placeholder.com/64?text=?'}
                  alt={match.home_team ?? 'TBD'}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-[#1A1A2E] text-center text-sm truncate w-full">
                {match.home_team ?? 'TBD'}
              </span>
              <span className="text-xs text-[#6B7280]">Local</span>
            </div>

            <div className="flex flex-col items-center px-2 min-w-[80px]">
              <span className="text-3xl font-black text-[#FFB703] tracking-wider">VS</span>
            </div>

            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-16 h-16 rounded-xl bg-white shadow-sm shadow-[rgba(2,48,71,0.08)] p-2 mb-2 border border-[rgba(2,48,71,0.06)]">
                <img
                  src={match.away_flag ?? 'https://via.placeholder.com/64?text=?'}
                  alt={match.away_team ?? 'TBD'}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-[#1A1A2E] text-center text-sm truncate w-full">
                {match.away_team ?? 'TBD'}
              </span>
              <span className="text-xs text-[#6B7280]">Visitante</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

          {rateLimited && (
            <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#B45309] rounded-xl p-3 text-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              La API de football-data.org está limitada. Alineaciones no disponibles en este momento.
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFB703]"></div>
            </div>
          ) : (
            <>
              {details && hasLineupData(details.homeTeam, details.awayTeam) && (
                <LineupSection homeTeam={details.homeTeam} awayTeam={details.awayTeam} />
              )}

              {details && details.referees && details.referees.length > 0 && (
                <RefereesSection referees={details.referees} />
              )}

              <div className="bg-[rgba(255,183,3,0.08)] rounded-2xl p-5 border border-[rgba(255,183,3,0.2)]">
                <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wide mb-4 text-center">
                  Tu pronóstico
                </h3>

                {locked ? (
                  <div className="text-center py-3">
                    <p className="text-xs text-[#9CA3AF] italic">
                      Pronóstico bloqueado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm font-bold text-[#023047]">90&apos;</span>
                      <input
                        type="number"
                        min={0}
                        value={prediction.home_score ?? ''}
                        onChange={(event) => handleScoreChange('home_score', event.target.value)}
                        className={scoreInputClass}
                        aria-label="Goles local 90 minutos"
                      />
                      <span className="text-xl font-black text-[#FB8500]">-</span>
                      <input
                        type="number"
                        min={0}
                        value={prediction.away_score ?? ''}
                        onChange={(event) => handleScoreChange('away_score', event.target.value)}
                        className={scoreInputClass}
                        aria-label="Goles visitante 90 minutos"
                      />
                    </div>

                    {isKnockout && predictedRegularDraw && (
                      <div className="flex items-center justify-center gap-3 border-t border-[rgba(2,48,71,0.08)] pt-4">
                        <span className="text-sm font-bold text-[#023047]">120&apos;</span>
                        <input
                          type="number"
                          min={0}
                          value={prediction.extra_time_home ?? ''}
                          onChange={(event) => handleScoreChange('extra_time_home', event.target.value)}
                          className={scoreInputClass}
                          aria-label="Goles local tiempo extra"
                        />
                        <span className="text-xl font-black text-[#FB8500]">-</span>
                        <input
                          type="number"
                          min={0}
                          value={prediction.extra_time_away ?? ''}
                          onChange={(event) => handleScoreChange('extra_time_away', event.target.value)}
                          className={scoreInputClass}
                          aria-label="Goles visitante tiempo extra"
                        />
                      </div>
                    )}

                    {isKnockout && predictedExtraTimeDraw && (
                      <div className="flex items-center justify-center gap-3 border-t border-[rgba(2,48,71,0.08)] pt-4">
                        <span className="text-sm font-bold text-[#023047]">Penales</span>
                        <input
                          type="number"
                          min={0}
                          value={prediction.penalties_home ?? ''}
                          onChange={(event) => handleScoreChange('penalties_home', event.target.value)}
                          className={scoreInputClass}
                          aria-label="Penales local"
                        />
                        <span className="text-xl font-black text-[#FB8500]">-</span>
                        <input
                          type="number"
                          min={0}
                          value={prediction.penalties_away ?? ''}
                          onChange={(event) => handleScoreChange('penalties_away', event.target.value)}
                          className={scoreInputClass}
                          aria-label="Penales visitante"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {pointsResult && (
                <div className="bg-[rgba(6,214,160,0.08)] rounded-2xl p-5 border border-[rgba(6,214,160,0.2)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wide">
                      Puntos obtenidos
                    </span>
                    <span className="text-3xl font-black text-[#06D6A0]">+{pointsResult.points}</span>
                  </div>
                  <div className="text-sm">
                    {pointsResult.exactScore && (
                      <span className="text-[#06D6A0] font-bold">✓ Marcador exacto</span>
                    )}
                    {!pointsResult.exactScore && pointsResult.trend && (
                      <span className="text-[#FFB703] font-bold">→ Tendencia correcta</span>
                    )}
                    {!pointsResult.exactScore && !pointsResult.trend && (
                      <span className="text-[#6B7280] font-medium">Sin puntos</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-[rgba(2,48,71,0.08)] flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => void handleSave()}
            isLoading={saving}
            disabled={locked || loading}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Checks whether either team has published lineup data (coach, captain or players).
 */
function hasLineupData(homeTeam: FootballTeamDetails, awayTeam: FootballTeamDetails): boolean {
  const hasCoachOrCaptain =
    homeTeam.coach || homeTeam.captain || awayTeam.coach || awayTeam.captain;
  const hasLineup =
    (homeTeam.lineup && homeTeam.lineup.length > 0) ||
    (awayTeam.lineup && awayTeam.lineup.length > 0);

  return Boolean(hasCoachOrCaptain || hasLineup);
}

interface LineupSectionProps {
  homeTeam: FootballTeamDetails;
  awayTeam: FootballTeamDetails;
}

/**
 * Renders both team lineups side by side in the modal.
 */
function LineupSection({ homeTeam, awayTeam }: LineupSectionProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <TeamLineup team={homeTeam} />
      <TeamLineup team={awayTeam} />
    </div>
  );
}

interface TeamLineupProps {
  team: FootballTeamDetails;
}

/**
 * Renders a single team's coach, captain, starting XI and bench.
 */
function TeamLineup({ team }: TeamLineupProps): React.JSX.Element {
  return (
    <div className="bg-[rgba(2,48,71,0.03)] rounded-2xl p-4">
      <h4 className="font-bold text-[#1A1A2E] mb-3 text-center">{team.name}</h4>

      {(team.coach || team.captain) && (
        <div className="mb-3 space-y-1 text-xs text-[#6B7280]">
          {team.coach && (
            <p>
              <span className="font-semibold">DT:</span> {team.coach.name}
            </p>
          )}
          {team.captain && (
            <p>
              <span className="font-semibold">Capitán:</span> {team.captain.name}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1 mb-3">
        <p className="text-xs font-bold text-[#023047] uppercase tracking-wide mb-2">Alineación</p>
        {(team.lineup?.length ?? 0) > 0 ? (
          team.lineup?.map((player: FootballPlayer) => (
            <PlayerRow key={player.id} player={player} />
          ))
        ) : (
          <p className="text-xs text-[#6B7280]">Titulares no disponibles</p>
        )}
      </div>

      {(team.bench?.length ?? 0) > 0 && (
        <div className="space-y-1 pt-3 border-t border-[rgba(2,48,71,0.08)]">
          <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">Suplentes</p>
          {team.bench?.map((player: FootballPlayer) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}

interface RefereesSectionProps {
  referees: FootballReferee[];
}

/**
 * Renders the match referees when available.
 */
function RefereesSection({ referees }: RefereesSectionProps): React.JSX.Element {
  return (
    <div className="bg-[rgba(2,48,71,0.03)] rounded-2xl p-4">
      <p className="text-xs font-bold text-[#023047] uppercase tracking-wide mb-2">Árbitros</p>
      <div className="space-y-1">
        {referees.map((referee: FootballReferee) => (
          <div key={referee.id} className="flex items-center justify-between text-sm">
            <span className="text-[#1A1A2E]">{referee.name}</span>
            <span className="text-xs text-[#6B7280]">
              {referee.type ?? referee.nationality ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PlayerRowProps {
  player: FootballPlayer;
}

/**
 * Renders a single player row with shirt number, name and position.
 */
function PlayerRow({ player }: PlayerRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-xs font-bold text-[#FB8500] tabular-nums">
        {player.shirtNumber ?? '-'}
      </span>
      <span className="flex-1 truncate text-[#1A1A2E]">{player.name}</span>
      <span className="text-xs text-[#6B7280]">{player.position ?? ''}</span>
    </div>
  );
}
