import { useEffect, useState } from 'react';

interface StatusResponse {
  isOpen: boolean;
  closesAt: string;
  closesAtTimestamp: number;
  nowTimestamp: number;
}

interface CountdownTimerProps {
  className?: string;
}

/**
 * Displays a countdown timer for the award predictions window.
 * Only renders when the window is open.
 */
export function CountdownTimer({ className = '' }: CountdownTimerProps): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    async function checkStatus(): Promise<void> {
      try {
        const response = await fetch('/api/awards/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = (await response.json()) as StatusResponse;
        setIsOpen(data.isOpen);

        if (data.isOpen) {
          const updateCountdown = (): void => {
            const now = Date.now();
            const diff = data.closesAtTimestamp - now;

            if (diff <= 0) {
              setIsOpen(false);
              setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
              return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
          };

          updateCountdown();
          interval = setInterval(updateCountdown, 1000);
        }
      } catch (error) {
        console.error('Error checking award status:', error);
      } finally {
        setLoading(false);
      }
    }

    void checkStatus();

    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, []);

  if (loading) {
    return (
      <a href="/premios" className={`bg-gradient-to-r from-[#DC2626] to-[#F97316] rounded-2xl p-4 ${className}`}>
        <div className="animate-pulse h-12 bg-white/10 rounded-lg" />
      </a>
    );
  }

  if (isOpen === false) {
    return (
      <div
        className={`bg-[rgba(2,48,71,0.08)] border border-[rgba(2,48,71,0.12)] rounded-2xl p-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-bold text-[#023047]">Apuestas de premios cerradas</p>
            <p className="text-sm text-[#6B7280]">La ventana de predicciones ha terminado</p>
          </div>
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const formatNumber = (n: number): string => n.toString().padStart(2, '0');

  return (
    <a
      href="/premios"
      className={`bg-gradient-to-r from-[#DC2626] to-[#F97316] rounded-2xl p-4 shadow-lg shadow-[rgba(220,38,38,0.3)] ${className} hover:shadow-xl hover:shadow-[rgba(220,38,38,0.4)] transition-shadow cursor-pointer block`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎯</span>
        <div className="flex-1">
          <p className="text-white/90 text-sm font-semibold">¡Apuesta en los Premios!</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-white">{formatNumber(timeLeft.hours)}</span>
              <span className="text-white/60 text-xs">h</span>
            </div>
            <span className="text-white/60 text-lg font-bold">:</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-white">{formatNumber(timeLeft.minutes)}</span>
              <span className="text-white/60 text-xs">m</span>
            </div>
            <span className="text-white/60 text-lg font-bold">:</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-white">{formatNumber(timeLeft.seconds)}</span>
              <span className="text-white/60 text-xs">s</span>
            </div>
          </div>
        </div>
        <div className="bg-white/20 rounded-xl px-3 py-2">
          <p className="text-white text-xs font-medium">16avos</p>
          <p className="text-white/80 text-[10px]">4 Jul 00:00</p>
        </div>
      </div>
    </a>
  );
}
