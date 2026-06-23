import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Reusable input component with label and error support.
 */
export function Input({ label, error, className = '', ...props }: InputProps): React.JSX.Element {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-xl border bg-white text-[#1A1A2E] font-semibold
          placeholder:text-[#9CA3AF]
          border-[rgba(2,48,71,0.12)]
          focus:border-[#FFB703] focus:ring-2 focus:ring-[rgba(255,183,3,0.25)]
          disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-[#EF476F] focus:border-[#EF476F] focus:ring-[rgba(239,71,111,0.25)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[#EF476F]">{error}</p>}
    </div>
  );
}
