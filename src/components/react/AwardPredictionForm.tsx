import { useEffect, useState } from 'react';

interface Team {
  id: string;
  name: string;
  group: string;
  flag: string;
}

interface Player {
  id: string;
  teamId: string;
  teamName: string;
  teamFlag: string;
  name: string;
  position: string;
  isGoalkeeper: boolean;
}

interface ExistingPrediction {
  award_type: string;
  prediction: string;
  points_wagered: number;
  prediction_name: string;
  prediction_flag?: string;
  award_name: string;
}

interface StatusResponse {
  isOpen: boolean;
  closesAt: string;
  closesAtTimestamp: number;
  nowTimestamp: number;
}

interface ProfileResponse {
  available_points: number;
}

interface AwardPredictionFormProps {
  onPredictionMade?: () => void;
  onPointsChange?: (pointsWagered: Record<string, number>, availablePoints: number) => void;
}

interface PointsSelectorProps {
  awardType: string;
  value: number;
  onChange: (awardType: string, points: number) => void;
}

function PointsSelector({ awardType, value, onChange }: PointsSelectorProps): React.JSX.Element {
  const decrease = (): void => {
    if (value > 0) {
      onChange(awardType, value - 1);
    }
  };

  const increase = (): void => {
    if (value < 5) {
      onChange(awardType, value + 1);
    }
  };

  return (
    <div className="flex items-center justify-between mt-4 p-3 bg-[rgba(255,183,3,0.1)] rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#9a6b00]">Puntos:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={decrease}
            disabled={value <= 0}
            className="w-8 h-8 rounded-lg bg-[#FB8500] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e67d00] transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-[#023047]">{value}</span>
          <button
            type="button"
            onClick={increase}
            disabled={value >= 5}
            className="w-8 h-8 rounded-lg bg-[#FB8500] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e67d00] transition-colors"
          >
            +
          </button>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold text-[#06A77D]">Si aciertas: +{value * 3} pts</span>
        <span className="text-xs text-[#9a6b00]"> ({value}×3x)</span>
      </div>
    </div>
  );
}

/**
 * Form for making award predictions (champion, top scorer, best goalkeeper).
 */
export function AwardPredictionForm({ onPredictionMade, onPointsChange }: AwardPredictionFormProps): React.JSX.Element {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [champion, setChampion] = useState<string>('');
  const [topScorer, setTopScorer] = useState<string>('');
  const [bestGoalkeeper, setBestGoalkeeper] = useState<string>('');
  const [pointsWagered, setPointsWagered] = useState<Record<string, number>>({
    champion: 0,
    top_scorer: 0,
    best_goalkeeper: 0
  });

  const [existingPredictions, setExistingPredictions] = useState<Record<string, ExistingPrediction>>({});

  useEffect((): void => {
    async function loadData(): Promise<void> {
      try {
        const [teamsRes, playersRes, statusRes, predictionsRes, profileRes] = await Promise.all([
          fetch('/api/awards/teams'),
          fetch('/api/awards/players'),
          fetch('/api/awards/status'),
          fetch('/api/awards/predictions'),
          fetch('/api/profile/me')
        ]);

        const teamsData = (await teamsRes.json()) as { teams: Team[] };
        const playersData = (await playersRes.json()) as { players: Player[] };
        const statusData = (await statusRes.json()) as StatusResponse;
        const predictionsData = (await predictionsRes.json()) as { predictions: ExistingPrediction[] };
        const profileData = (await profileRes.json()) as ProfileResponse;

        setTeams(teamsData.teams);
        setPlayers(playersData.players);
        setIsOpen(statusData.isOpen);
        setAvailablePoints(profileData.available_points ?? 0);

        const predictionsMap: Record<string, ExistingPrediction> = {};
        for (const pred of predictionsData.predictions) {
          predictionsMap[pred.award_type] = pred;
        }
        setExistingPredictions(predictionsMap);

        if (predictionsMap.champion) setChampion(predictionsMap.champion.prediction);
        if (predictionsMap.top_scorer) setTopScorer(predictionsMap.top_scorer.prediction);
        if (predictionsMap.best_goalkeeper) setBestGoalkeeper(predictionsMap.best_goalkeeper.prediction);
        if (predictionsMap.champion) {
          setPointsWagered((prev) => ({ ...prev, champion: predictionsMap.champion!.points_wagered }));
        }
        if (predictionsMap.top_scorer) {
          setPointsWagered((prev) => ({ ...prev, top_scorer: predictionsMap.top_scorer!.points_wagered }));
        }
        if (predictionsMap.best_goalkeeper) {
          setPointsWagered((prev) => ({ ...prev, best_goalkeeper: predictionsMap.best_goalkeeper!.points_wagered }));
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const handlePointsChange = (awardType: string, points: number): void => {
    setPointsWagered((prev) => {
      const newPoints = { ...prev, [awardType]: points };
      onPointsChange?.(newPoints, availablePoints);
      return newPoints;
    });
  };

  const handleSubmit = async (awardType: string, prediction: string): Promise<void> => {
    if (!prediction) {
      setError('Por favor selecciona una opción');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/awards/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awardType,
          prediction,
          pointsWagered: pointsWagered[awardType]
        })
      });

      const data = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la predicción');
      }

      setSuccess('¡Predicción guardada!');

      const predictionsRes = await fetch('/api/awards/predictions');
      const predictionsData = (await predictionsRes.json()) as { predictions: ExistingPrediction[] };
      const predictionsMap: Record<string, ExistingPrediction> = {};
      for (const pred of predictionsData.predictions) {
        predictionsMap[pred.award_type] = pred;
      }
      setExistingPredictions(predictionsMap);

      const profileRes = await fetch('/api/profile/me');
      const profileData = (await profileRes.json()) as ProfileResponse;
      const newAvailablePoints = profileData.available_points ?? 0;
      setAvailablePoints(newAvailablePoints);
      onPointsChange?.(pointsWagered, newAvailablePoints);

      onPredictionMade?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const goalkeepers = players.filter((p) => p.isGoalkeeper);
  const outfieldPlayers = players.filter((p) => !p.isGoalkeeper);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-[rgba(2,48,71,0.06)] rounded-2xl" />
        <div className="animate-pulse h-32 bg-[rgba(2,48,71,0,06)] rounded-2xl" />
        <div className="animate-pulse h-32 bg-[rgba(2,48,71,0.06)] rounded-2xl" />
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="bg-[rgba(239,71,111,0.08)] border border-[rgba(239,71,111,0.2)] rounded-2xl p-6 text-center">
        <span className="text-4xl mb-3 block">🔒</span>
        <h3 className="font-bold text-[#EF476F] text-lg">Apuestas cerradas</h3>
        <p className="text-sm text-[#6B7280] mt-2">
          La ventana de predicciones ha terminado. ¡Muy pronto se revelarán los ganadores!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-[rgba(239,71,111,0.1)] border border-[rgba(239,71,111,0.3)] rounded-xl p-4">
          <p className="text-[#EF476F] text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-[rgba(6,214,160,0.1)] border border-[rgba(6,214,160,0.3)] rounded-xl p-4">
          <p className="text-[#06A77D] text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[rgba(2,48,71,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏆</span>
          <div>
            <h3 className="font-bold text-[#023047]">Campeón del Mundial</h3>
            <p className="text-xs text-[#6B7280]">¿Qué país ganará el torneo?</p>
          </div>
        </div>

        {existingPredictions.champion && (
          <div className="bg-[rgba(6,214,160,0.08)] rounded-xl p-3 mb-4">
            <p className="text-sm text-[#06A77D]">
              <span className="font-semibold">Apostado:</span> {existingPredictions.champion.prediction_name}{' '}
              ({existingPredictions.champion.points_wagered} pts)
            </p>
          </div>
        )}

        <select
          value={champion}
          onChange={(e) => setChampion(e.target.value)}
          className="w-full p-3 rounded-xl border border-[rgba(2,48,71,0.12)] bg-white text-[#023047] font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500] focus:border-transparent"
        >
          <option value="">Selecciona un país</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.flag} {team.name}
            </option>
          ))}
        </select>

        <PointsSelector
          awardType="champion"
          value={pointsWagered.champion}
          onChange={handlePointsChange}
        />

        <button
          type="button"
          onClick={() => handleSubmit('champion', champion)}
          disabled={!champion || pointsWagered.champion === 0 || submitting}
          className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FFB703] to-[#FB8500] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Guardando...' : 'Apostar'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[rgba(2,48,71,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚽</span>
          <div>
            <h3 className="font-bold text-[#023047]">Máximo Goleador</h3>
            <p className="text-xs text-[#6B7280]">¿Quién marcará más goles?</p>
          </div>
        </div>

        {existingPredictions.top_scorer && (
          <div className="bg-[rgba(6,214,160,0.08)] rounded-xl p-3 mb-4">
            <p className="text-sm text-[#06A77D]">
              <span className="font-semibold">Apostado:</span> {existingPredictions.top_scorer.prediction_name}{' '}
              ({existingPredictions.top_scorer.points_wagered} pts)
            </p>
          </div>
        )}

        <select
          value={topScorer}
          onChange={(e) => setTopScorer(e.target.value)}
          className="w-full p-3 rounded-xl border border-[rgba(2,48,71,0.12)] bg-white text-[#023047] font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500] focus:border-transparent"
        >
          <option value="">Selecciona un jugador</option>
          {outfieldPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.teamFlag} {player.name} ({player.teamName})
            </option>
          ))}
        </select>

        <PointsSelector
          awardType="top_scorer"
          value={pointsWagered.top_scorer}
          onChange={handlePointsChange}
        />

        <button
          type="button"
          onClick={() => handleSubmit('top_scorer', topScorer)}
          disabled={!topScorer || pointsWagered.top_scorer === 0 || submitting}
          className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FFB703] to-[#FB8500] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Guardando...' : 'Apostar'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[rgba(2,48,71,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🧤</span>
          <div>
            <h3 className="font-bold text-[#023047]">Mejor Portero</h3>
            <p className="text-xs text-[#6B7280]">¿Quién será el mejor arquero?</p>
          </div>
        </div>

        {existingPredictions.best_goalkeeper && (
          <div className="bg-[rgba(6,214,160,0.08)] rounded-xl p-3 mb-4">
            <p className="text-sm text-[#06A77D]">
              <span className="font-semibold">Apostado:</span>{' '}
              {existingPredictions.best_goalkeeper.prediction_name} (
              {existingPredictions.best_goalkeeper.points_wagered} pts)
            </p>
          </div>
        )}

        <select
          value={bestGoalkeeper}
          onChange={(e) => setBestGoalkeeper(e.target.value)}
          className="w-full p-3 rounded-xl border border-[rgba(2,48,71,0.12)] bg-white text-[#023047] font-medium focus:outline-none focus:ring-2 focus:ring-[#FB8500] focus:border-transparent"
        >
          <option value="">Selecciona un portero</option>
          {goalkeepers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.teamFlag} {player.name} ({player.teamName})
            </option>
          ))}
        </select>

        <PointsSelector
          awardType="best_goalkeeper"
          value={pointsWagered.best_goalkeeper}
          onChange={handlePointsChange}
        />

        <button
          type="button"
          onClick={() => handleSubmit('best_goalkeeper', bestGoalkeeper)}
          disabled={!bestGoalkeeper || pointsWagered.best_goalkeeper === 0 || submitting}
          className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FFB703] to-[#FB8500] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Guardando...' : 'Apostar'}
        </button>
      </div>
    </div>
  );
}
