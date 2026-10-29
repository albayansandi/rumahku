import React from 'react';
import { parseRupiahInput } from '../../lib/calculations/financial';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0',
  disabled = false,
  required = false,
  error,
  className = '',
}) => {
  const displayValue = value ? value.toLocaleString('id-ID') : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiahInput(raw);
    onChange(parsed);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-xl bg-slate-800/90 border pl-9 pr-3 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono-numbers ${
            error ? 'border-rose-500/80' : 'border-slate-700/80 hover:border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <span className="text-xs text-rose-400 mt-0.5">{error}</span>}
    </div>
  );
};
