import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Reusable button component with multiple variants and sizes.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variantStyles = {
    primary:
      'bg-[#FFB703] text-[#1A1A2E] hover:bg-[#FB8500] focus:ring-[#FFB703] shadow-md shadow-[rgba(255,183,3,0.3)]',
    secondary:
      'bg-[#023047] text-white hover:bg-[#03496b] focus:ring-[#023047] shadow-md shadow-[rgba(2,48,71,0.2)]',
    ghost:
      'bg-transparent text-[#023047] hover:bg-[rgba(2,48,71,0.06)] focus:ring-[#023047] border border-[rgba(2,48,71,0.12)]',
    danger:
      'bg-[#EF476F] text-white hover:bg-[#d93a5f] focus:ring-[#EF476F] shadow-md shadow-[rgba(239,71,111,0.3)]'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Cargando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
