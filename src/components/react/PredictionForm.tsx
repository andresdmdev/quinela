import { useEffect, useMemo, useState } from 'react';
import { MatchCardGroup } from './MatchCardGroup';
import { MatchCardKnockout } from './MatchCardKnockout';
import { EmptyState } from './ui/EmptyState';
import { Toast } from './ui/Toast';
import type { Match } from './MatchCard';

type TabType = 'upcoming' | 'locked' | 'finished';
type StageFilter = 'all' | 'GROUP_STAGE' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

interface Prediction {
  match_id: string;
  home_score: number | null;
  away_score: number | null;
}

interface MatchApiResponse {
  matches: Match[];
  rate_limited: boolean;
}

interface PredictionsApiResponse {
  predictions: Prediction[];
}

const MATCHES_CACHE_KEY = 'quinela_matches_cache';
const PREDICTIONS_CACHE_KEY = 'quinela_predictions_cache';
const CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Renders the full predictions form with tabs, filters and stage-aware cards.
 */
export function PredictionForm(): React.JSX.Element {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    async function loadData(): Promise<void> {
      try {
        let matchesData: MatchApiResponse | null = null;
        let predictionsData: PredictionsApiResponse | null = null;

        const matchesCached = sessionStorage.getItem(MATCHES_CACHE_KEY);
        const predictionsCached = sessionStorage.getItem(PREDICTIONS_CACHE_KEY);

        if (matchesCached) {
          const parsed = JSON.parse(matchesCached) as { data: MatchApiResponse; timestamp: number };
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            matchesData = parsed.data;
          }
        }

        if (predictionsCached) {
          const parsed = JSON.parse(predictionsCached) as PredictionsApiResponse;
          predictionsData = parsed;
        }

        const promises: Promise<void>[] = [];

        if (!matchesData) {
          promises.push(
            (async () => {
              const response = await fetch('/api/matches');
              const data = (await response.json()) as MatchApiResponse;
              if (!response.ok) throw new Error('Error loading matches');
              matchesData = data;
              sessionStorage.setItem(
                MATCHES_CACHE_KEY,
                JSON.stringify({ data, timestamp: Date.now() })
              );
            })()
          );
        }

        if (!predictionsData) {
          promises.push(
            (async () => {
              const response = await fetch('/api/predictions');
              const data = (await response.json()) as PredictionsApiResponse;
              if (!response.ok) throw new Error('Error loading predictions');
              predictionsData = data;
              sessionStorage.setItem(PREDICTIONS_CACHE_KEY, JSON.stringify(data));
            })()
          );
        }

        await Promise.all(promises);

        const predictionsMap: Record<string, Prediction> = {};
        for (const prediction of predictionsData?.predictions ?? []) {
          predictionsMap[prediction.match_id] = prediction;
        }

        setMatches(matchesData?.matches ?? []);
        setPredictions(predictionsMap);
        setRateLimited(matchesData?.rate_limited ?? false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function handleScoreChange(matchId: string, field: 'home' | 'away', value: string): void {
    const numberValue = value === '' ? null : parseInt(value, 10);

    setPredictions((previous) => ({
      ...previous,
      [matchId]: {
        match_id: matchId,
        home_score: field === 'home' ? numberValue : (previous[matchId]?.home_score ?? null),
        away_score: field === 'away' ? numberValue : (previous[matchId]?.away_score ?? null)
      }
    }));
  }

  async function savePrediction(matchId: string): Promise<void> {
    const prediction = predictions[matchId];

    if (!prediction || prediction.home_score === null || prediction.away_score === null) {
      setToast({ message: 'Ingresa ambos marcadores', type: 'error' });
      return;
    }

    setSaving((previous) => ({ ...previous, [matchId]: true }));

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          homeScore: prediction.home_score,
          awayScore: prediction.away_score
        })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Error saving prediction');
      }

      const predictionsResponse = await fetch('/api/predictions');
      const predictionsData = (await predictionsResponse.json()) as PredictionsApiResponse;
      sessionStorage.setItem(PREDICTIONS_CACHE_KEY, JSON.stringify(predictionsData));

      const predictionsMap: Record<string, Prediction> = {};
      for (const p of predictionsData.predictions) {
        predictionsMap[p.match_id] = p;
      }
      setPredictions(predictionsMap);

      setToast({ message: 'Pronóstico guardado', type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setToast({ message, type: 'error' });
    } finally {
      setSaving((previous) => ({ ...previous, [matchId]: false }));
    }
  }

  function isLocked(match: Match): boolean {
    const now = new Date();
    const matchTime = new Date(match.utc_minus_5_at);
    const lockTime = new Date(matchTime.getTime() - 60 * 60 * 1000);

    if (now >= lockTime) return true;

    if (match.status !== 'SCHEDULED') return true;

    if (match.stage === 'GROUP_STAGE') {
      const cutoff = new Date('2026-06-10T23:59:00-05:00');
      if (now >= cutoff) return true;
    }

    return false;
  }

  const filteredMatches = useMemo(() => {
    let filtered = matches;

    if (activeTab === 'upcoming') {
      filtered = matches.filter((m) => m.status === 'SCHEDULED' && !isLocked(m));
    } else if (activeTab === 'locked') {
      filtered = matches.filter((m) => (m.status === 'SCHEDULED' && isLocked(m)) || m.status === 'IN_PLAY' || m.status === 'PAUSED');
    } else if (activeTab === 'finished') {
      filtered = matches.filter((m) => m.status === 'FINISHED');
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter((m) => m.stage === stageFilter);
    }

    return filtered.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [matches, activeTab, stageFilter]);

  const pendingCount = useMemo(() => {
    return matches.filter((m) => m.status === 'SCHEDULED' && !isLocked(m) && !predictions[m.id]).length;
  }, [matches, predictions]);

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'upcoming', label: 'Próximos', count: pendingCount },
    { key: 'locked', label: 'Bloqueados' },
    { key: 'finished', label: 'Finalizados' }
  ];

  const stageOptions: { value: StageFilter; label: string }[] = [
    { value: 'all', label: 'Todas las fases' },
    { value: 'GROUP_STAGE', label: 'Fase de Grupos' },
    { value: 'ROUND_OF_16', label: 'Octavos' },
    { value: 'QUARTER_FINAL', label: 'Cuartos' },
    { value: 'SEMI_FINAL', label: 'Semis' },
    { value: 'FINAL', label: 'Final' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFB703]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[rgba(239,71,111,0.08)] border border-[rgba(239,71,111,0.2)] rounded-2xl p-6 text-center">
        <p className="text-[#EF476F] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {rateLimited && (
        <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#B45309] rounded-xl p-3 text-sm font-medium flex items-center gap-2">
          <span>⚠️</span>
          La API de football-data.org está limitada. Mostrando datos en caché.
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#1A1A2E] shadow-md shadow-[rgba(251,133,0,0.3)]'
                : 'bg-white text-[#6B7280] hover:text-[#1A1A2E] border border-[rgba(2,48,71,0.08)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-[#1A1A2E] text-white text-xs rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative">
        <select
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value as StageFilter)}
          className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-[rgba(2,48,71,0.12)] bg-white text-sm font-semibold text-[#1A1A2E] focus:border-[#FFB703] focus:ring-2 focus:ring-[rgba(255,183,3,0.25)]"
        >
          {stageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <EmptyState
          title="No hay partidos en esta sección"
          description={
            activeTab === 'upcoming'
              ? 'Todos los partidos disponibles ya fueron pronosticados o están bloqueados.'
              : activeTab === 'locked'
              ? 'No hay partidos bloqueados o en juego en este momento.'
              : 'Aún no hay partidos finalizados.'
          }
          icon="⚽"
        />
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const prediction = predictions[match.id];
            const locked = isLocked(match);
            const hasPrediction = prediction?.home_score !== null && prediction?.away_score !== null;

            const commonProps = {
              match,
              homePrediction: prediction?.home_score ?? null,
              awayPrediction: prediction?.away_score ?? null,
              isLocked: locked,
              hasPrediction,
              onHomeScoreChange: (value: string) => handleScoreChange(match.id, 'home', value),
              onAwayScoreChange: (value: string) => handleScoreChange(match.id, 'away', value),
              onSave: () => void savePrediction(match.id),
              isSaving: saving[match.id] ?? false
            };

            return match.stage === 'GROUP_STAGE' ? (
              <MatchCardGroup key={match.id} {...commonProps} />
            ) : (
              <MatchCardKnockout key={match.id} {...commonProps} />
            );
          })}
        </div>
      )}
    </div>
  );
}
