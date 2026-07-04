import { useEffect, useState } from 'react';

interface ExistingPrediction {
  award_type: string;
  prediction: string;
  points_wagered: number;
  prediction_name: string;
  prediction_flag?: string;
  award_name: string;
  is_winner: boolean | null;
}

interface AwardPredictionsModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal to display a user's award predictions.
 */
export function AwardPredictionsModal({
  userId,
  userName,
  isOpen,
  onClose
}: AwardPredictionsModalProps): React.JSX.Element | null {
  const [predictions, setPredictions] = useState<ExistingPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect((): void => {
    if (!isOpen || !userId) return;

    async function fetchPredictions(): Promise<void> {
      setLoading(true);
      try {
        const response = await fetch(`/api/awards/predictions?user_id=${userId}`);
        const data = (await response.json()) as { predictions: ExistingPrediction[] };
        setPredictions(data.predictions);
      } catch (err) {
        console.error('Error fetching predictions:', err);
      } finally {
        setLoading(false);
      }
    }

    void fetchPredictions();
  }, [isOpen, userId]);

  if (!isOpen) {
    return null;
  }

  const awardIcons: Record<string, string> = {
    champion: '🏆',
    top_scorer: '⚽',
    best_goalkeeper: '🧤'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#023047] to-[#03496b] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{userName}</h2>
              <p className="text-white/70 text-sm">Apuestas de premios</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse h-20 bg-[rgba(2,48,71,0.06)] rounded-xl" />
              <div className="animate-pulse h-20 bg-[rgba(2,48,71,0.06)] rounded-xl" />
              <div className="animate-pulse h-20 bg-[rgba(2,48,71,0.06)] rounded-xl" />
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">🎯</span>
              <p className="text-[#6B7280]">Este usuario aún no ha hecho apuestas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((pred) => (
                <div
                  key={pred.award_type}
                  className="bg-[rgba(2,48,71,0.04)] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{awardIcons[pred.award_type] || '🎯'}</span>
                    <div>
                      <p className="font-bold text-[#023047] text-sm">{pred.award_name}</p>
                      <p className="text-xs text-[#6B7280]">
                        {pred.points_wagered} pts apostados
                      </p>
                    </div>
                  </div>
                  <div className="ml-11">
                    <p className="font-semibold text-[#1A1A2E]">
                      {pred.prediction_flag && <span className="mr-2">{pred.prediction_flag}</span>}
                      {pred.prediction_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
