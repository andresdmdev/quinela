interface AwardSummaryProps {
  availablePoints: number;
  totalWagered: number;
  potentialWinnings: number;
  totalEarned: number;
}

export function AwardSummary({
  availablePoints,
  totalWagered,
  potentialWinnings,
  totalEarned
}: AwardSummaryProps): React.JSX.Element {
  return (
    <div className="bg-gradient-to-br from-[#023047] to-[#034569] rounded-3xl p-5 text-white shadow-lg shadow-[rgba(2,48,71,0.3)] mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <h2 className="text-base font-bold">Tu resumen de apuestas</h2>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-2xl font-black">{totalWagered}</p>
          <p className="text-xs text-white/70">Pts apostados</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-2xl font-black">{availablePoints}</p>
          <p className="text-xs text-white/70">Disponibles</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-2xl font-black text-[#06A77D]">{totalEarned}</p>
          <p className="text-xs text-white/70">Ganados</p>
        </div>
        <div className="bg-[#06A77D]/30 rounded-xl p-3 border border-[#06A77D]/50">
          <p className="text-2xl font-black text-[#06A77D]">+{potentialWinnings}</p>
          <p className="text-xs text-white/70">Si aciertas</p>
        </div>
      </div>
    </div>
  );
}
