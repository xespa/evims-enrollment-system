import { useRef } from 'react';
import { Calendar } from 'lucide-react';

export default function TextInput({ label, name, value, onChange, error, type = 'text', required = false, disabled = false, ...rest }) {
    const inputRef = useRef(null);
    const isDate = type === 'date';
    const errorId = `${name}-error`;

    const openPicker = () => {
        inputRef.current?.showPicker?.();
        inputRef.current?.focus();
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink/80">
                {label} {required && <span className="text-danger-ink" aria-hidden="true">*</span>}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    id={name}
                    name={name}
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => onChange(name, e.target.value)}
                    disabled={disabled}
                    aria-required={required || undefined}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`min-h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder-ink/40 shadow-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none disabled:bg-ink/5 disabled:text-ink/70 ${
                        isDate ? 'pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0' : ''
                    } ${
                        error ? 'border-danger bg-danger/[0.03]' : 'border-ink/15'
                    }`}
                    {...rest}
                />
                {isDate && !disabled && (
                    <button
                        type="button"
                        onClick={openPicker}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink/65 hover:text-brand-ink"
                        aria-label="Open calendar"
                    >
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>
            {error && (
                <p id={errorId} className="mt-1 text-sm text-danger-ink">
                    {error}
                </p>
            )}
        </div>
    );
}
