import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

/**
 * Reusable badge component for labels and status indicators.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'sm'
}: BadgeProps): React.JSX.Element {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full';

  const variantStyles = {
    default: 'bg-[rgba(2,48,71,0.08)] text-[#023047]',
    primary: 'bg-[rgba(255,183,3,0.18)] text-[#9a6b00]',
    secondary: 'bg-[rgba(251,133,0,0.14)] text-[#c25e00]',
    success: 'bg-[rgba(6,214,160,0.15)] text-[#059669]',
    danger: 'bg-[rgba(239,71,111,0.12)] text-[#be123c]',
    warning: 'bg-[rgba(245,158,11,0.14)] text-[#b45309]',
    info: 'bg-[rgba(2,48,71,0.1)] text-[#023047]'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}>{children}</span>;
}
