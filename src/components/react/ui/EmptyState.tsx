import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Empty state component for lists without data.
 */
export function EmptyState({
  title,
  description,
  icon,
  action
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(255,183,3,0.15)] to-[rgba(251,133,0,0.08)] flex items-center justify-center mb-4 text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#6B7280] max-w-xs mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
