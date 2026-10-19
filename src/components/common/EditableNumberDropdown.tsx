import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface EditableNumberDropdownProps {
  label: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  options: number[];
  min?: number;
  max?: number;
  disabled?: boolean;
  allowDecimals?: boolean;
  suffix?: string;
  prefix?: string;
  subtitle?: React.ReactNode;
  allowAutomatic?: boolean;
  automaticLabel?: string;
  quickOptions?: number[];
}

export const EditableNumberDropdown: React.FC<EditableNumberDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  min = 1,
  max = 1000000,
  disabled = false,
  allowDecimals = false,
  suffix,
  prefix,
  subtitle,
  allowAutomatic = false,
  automaticLabel = 'Automatic',
  quickOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAutomatic = allowAutomatic && value === 0;

  const [text, setText] = useState<string>(() => {
    if (allowAutomatic && value === 0) return automaticLabel;
    if (value === undefined || value === null || isNaN(value)) return min.toString();
    return value.toString();
  });
  const isFocusedRef = useRef(false);

  // Sync external value changes into local input string when not actively typing
  useEffect(() => {
    if (isFocusedRef.current) return;
    if (allowAutomatic && value === 0) {
      setText(automaticLabel);
      return;
    }
    const parsed = parseFloat(text);
    if (isNaN(parsed) || Math.abs(parsed - value) > 0.0001) {
      setText(value > 0 ? (allowDecimals ? value.toString() : Math.round(value).toString()) : '');
    }
  }, [value, allowDecimals, allowAutomatic, automaticLabel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (raw === '') {
      setText('');
      return;
    }

    if (allowAutomatic && (raw.toLowerCase().startsWith('a') || raw.toLowerCase() === 'auto' || raw.toLowerCase() === 'automatic')) {
      setText(automaticLabel);
      onChange(0);
      return;
    }

    if (allowDecimals) {
      if (!/^\d*\.?\d*$/.test(raw)) return;
    } else {
      if (!/^\d*$/.test(raw)) return;
    }

    setText(raw);

    if (!raw.endsWith('.')) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= min) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (allowAutomatic && (text.toLowerCase() === 'auto' || text.toLowerCase() === 'automatic' || text === automaticLabel)) {
      setText(automaticLabel);
      onChange(0);
      return;
    }

    if (text === '' || text === '.') {
      const fallback = allowAutomatic ? 0 : min;
      setText(fallback === 0 ? automaticLabel : fallback.toString());
      onChange(fallback);
      return;
    }

    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed < min) {
      const fallback = allowAutomatic && parsed === 0 ? 0 : min;
      setText(fallback === 0 ? automaticLabel : fallback.toString());
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

  return (
    <div className="flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-200 block">
          {label}
        </label>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-mono-numbers">
            {subtitle}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="flex items-center bg-slate-950 border border-slate-700 focus-within:border-emerald-500 rounded-xl overflow-hidden">
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
            onChange={handleInputChange}
            onFocus={() => {
              isFocusedRef.current = true;
              if (allowAutomatic && value === 0) {
                setText('');
              }
            }}
            onBlur={handleBlur}
            placeholder={allowAutomatic ? automaticLabel : min.toString()}
            className="w-full bg-transparent px-3 py-2 text-sm font-bold font-mono-numbers text-slate-100 outline-none min-w-0"
          />

          {suffix && !isAutomatic && (
            <span className="text-xs text-slate-400 font-mono-numbers pr-2 select-none shrink-0">
              {suffix}
            </span>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(prev => !prev)}
            className="px-2.5 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-l border-slate-800 transition-colors cursor-pointer shrink-0"
            title="Choose from list"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && !disabled && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl py-1 z-50 max-h-56 overflow-y-auto">
              {allowAutomatic && (
                <button
                  type="button"
                  onClick={() => {
                    setText(automaticLabel);
                    onChange(0);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs text-left border-b border-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between ${
                    value === 0 ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Automatic</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Recommended)</span>
                  </div>
                  {value === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              )}

              {options.filter(opt => opt > 0).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setText(opt.toString());
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left font-mono-numbers hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between ${
                    value === opt ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-300'
                  }`}
                >
                  <span>{prefix}{opt}{suffix ? ` ${suffix}` : ''}</span>
                  {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {quickOptions && quickOptions.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {allowAutomatic && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setText(automaticLabel);
                onChange(0);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                value === 0
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Automatic (Recommended)
            </button>
          )}
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
              {prefix}{opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
