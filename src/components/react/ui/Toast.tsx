import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

/**
 * Temporary toast notification component.
 */
export function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose
}: ToastProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect((): (() => void) => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return <></>;
  }

  const styles = {
    success: 'bg-[#06D6A0] text-white',
    error: 'bg-[#EF476F] text-white',
    info: 'bg-[#023047] text-white'
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg ${styles[type]} animate-in fade-in slide-in-from-top-2`}
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-sm font-bold">
          {icons[type]}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
