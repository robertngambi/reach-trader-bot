import React, { useState, useEffect, useRef } from 'react';

interface EditableNumberInputProps {
  label: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  allowDecimals?: boolean;
  disabled?: boolean;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  accentColor?: 'emerald' | 'cyan' | 'rose' | 'amber' | 'slate';
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  quickOptions?: number[];
  quickOptionPrefix?: string;
}

export const EditableNumberInput: React.FC<EditableNumberInputProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 10000000,
  step = 'any',
  allowDecimals = true,
  disabled = false,
  suffix,
  prefix,
  placeholder = '1',
  className = '',
  inputClassName = '',
  accentColor = 'cyan',
  subtitle,
  icon,
  quickOptions,
  quickOptionPrefix = '',
}) => {
  const [text, setText] = useState<string>(() => {
    if (value === undefined || value === null || isNaN(value)) return '1';
    return allowDecimals ? value.toString() : Math.round(value).toString();
  });

  const isFocusedRef = useRef(false);

  // Sync internal text state with external prop changes when not typing or when value changes externally
  useEffect(() => {
    const currentParsed = parseFloat(text);
    if (isNaN(currentParsed) || Math.abs(currentParsed - value) > 0.0001) {
      if (value > 0) {
        setText(allowDecimals ? value.toString() : Math.round(value).toString());
      } else {
        setText('');
      }
    }
  }, [value, allowDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow user to empty the input to type from scratch
    if (raw === '') {
      setText('');
      return;
    }

    // Check validity according to decimals rule
    if (allowDecimals) {
      // Allow digits and at most one decimal point (e.g. "1.", "1.5")
      if (!/^\d*\.?\d*$/.test(raw)) return;
    } else {
      // Integers only
      if (!/^\d*$/.test(raw)) return;
    }

    setText(raw);

    // If string ends with decimal dot (e.g. "1."), let user continue typing before parsing
    if (!raw.endsWith('.')) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= min) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (text === '' || text === '.') {
      const fallback = min;
      setText(fallback.toString());
      onChange(fallback);
      return;
    }

    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed < min) {
      const fallback = min;
      setText(fallback.toString());
      onChange(fallback);
    } else if (max !== undefined && parsed > max) {
      setText(max.toString());
      onChange(max);
    } else {
      const formatted = allowDecimals ? parsed.toString() : Math.round(parsed).toString();
      setText(formatted);
      onChange(parsed);
    }
  };

  // Border & focus color classes based on accentColor
  const borderFocusClasses = {
    emerald: 'border-slate-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30',
    cyan: 'border-slate-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30',
    rose: 'border-slate-700 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30',
    amber: 'border-slate-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30',
    slate: 'border-slate-700 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400/30',
  }[accentColor];

  const textColorClass = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-300',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    slate: 'text-slate-100',
  }[accentColor];

  return (
    <div className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
          {icon}
          {label}
        </label>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-mono-numbers">
            {subtitle}
          </span>
        )}
      </div>

      <div className="relative">
        <div
          className={`flex items-center bg-slate-950 border rounded-xl overflow-hidden transition-all ${borderFocusClasses} ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {prefix && (
            <span className="pl-3 text-xs font-bold text-slate-400 select-none">
              {prefix}
            </span>
          )}

          <input
            type="text"
            inputMode={allowDecimals ? 'decimal' : 'numeric'}
            disabled={disabled}
            value={text}
            onChange={handleChange}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
            step={step}
            className={`w-full bg-transparent px-3 py-2 text-sm font-bold font-mono-numbers outline-none transition-colors ${textColorClass} ${inputClassName}`}
          />

          {suffix && (
            <span className="pr-3 text-xs font-bold text-slate-400 select-none shrink-0">
              {suffix}
            </span>
          )}
        </div>
      </div>

      {quickOptions && quickOptions.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {quickOptions.map(opt => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => {
                setText(opt.toString());
                onChange(opt);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono-numbers border transition-all cursor-pointer ${
                Math.abs(value - opt) < 0.01
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {quickOptionPrefix}{opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
