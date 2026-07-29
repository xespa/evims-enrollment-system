export default function TextInput({ label, name, value, onChange, error, type = 'text', required = false, ...rest }) {
    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                {label} {required && <span className="text-[#C6473B]">*</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(name, e.target.value)}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1F2A24] placeholder-[#1F2A24]/30 shadow-sm transition-colors focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none ${
                    error ? 'border-[#C6473B]' : 'border-[#1F2A24]/15'
                }`}
                {...rest}
            />
            {error && <p className="mt-1 text-sm text-[#C6473B]">{error}</p>}
        </div>
    );
}
