import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'group' | 'knockout' | 'highlight';
}

/**
 * Reusable card component with World Cup themed variants.
 */
export function Card({
  children,
  className = '',
  variant = 'default'
}: CardProps): React.JSX.Element {
  const baseStyles = 'rounded-2xl p-4 transition-all duration-200';

  const variantStyles = {
    default: 'bg-white border border-[rgba(2,48,71,0.08)] shadow-sm shadow-[rgba(255,183,3,0.08)]',
    group: 'bg-white border border-[rgba(255,183,3,0.25)] shadow-sm shadow-[rgba(255,183,3,0.1)]',
    knockout:
      'bg-gradient-to-br from-white to-[rgba(255,183,3,0.06)] border border-[rgba(2,48,71,0.12)] shadow-md shadow-[rgba(255,183,3,0.12)]',
    highlight:
      'bg-gradient-to-br from-[rgba(255,183,3,0.12)] to-[rgba(251,133,0,0.06)] border border-[rgba(255,183,3,0.35)] shadow-gold'
  };

  return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>{children}</div>;
}
