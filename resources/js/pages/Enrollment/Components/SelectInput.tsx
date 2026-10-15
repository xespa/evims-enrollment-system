export default function SelectInput({ label, name, value, onChange, error, options, required = false, disabled = false, hint = null }) {
    const errorId = `${name}-error`;
    const hintId = `${name}-hint`;

    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink/80">
                {label} {required && <span className="text-danger-ink" aria-hidden="true">*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={value ?? ''}
                onChange={(e) => onChange(name, e.target.value)}
                disabled={disabled}
                aria-required={required || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : hint ? hintId : undefined}
                className={`min-h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/70 ${
                    error ? 'border-danger bg-danger/[0.03]' : 'border-ink/15'
                }`}
            >
                <option value="" className="text-ink bg-surface">-- Select --</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled} className="text-ink bg-surface">
                        {opt.label}
                    </option>
                ))}
            </select>
            {error ? (
                <p id={errorId} className="mt-1 text-sm text-danger-ink">
                    {error}
                </p>
            ) : (
                hint && (
                    <p id={hintId} className="mt-1 text-xs text-ink/60">
                        {hint}
                    </p>
                )
            )}
        </div>
    );
}
