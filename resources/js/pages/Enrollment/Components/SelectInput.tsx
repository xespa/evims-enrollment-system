export default function SelectInput({ label, name, value, onChange, error, options, required = false }) {
    const errorId = `${name}-error`;

    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                {label} {required && <span className="text-[#C6473B]" aria-hidden="true">*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={value ?? ''}
                onChange={(e) => onChange(name, e.target.value)}
                aria-required={required || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`min-h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1F2A24] shadow-sm transition-colors focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none ${
                    error ? 'border-[#C6473B] bg-[#C6473B]/[0.03]' : 'border-[#1F2A24]/15'
                }`}
            >
                <option value="" className="text-[#1F2A24] bg-white">-- Select --</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-[#1F2A24] bg-white">
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p id={errorId} className="mt-1 text-sm text-[#C6473B]">
                    {error}
                </p>
            )}
        </div>
    );
}
