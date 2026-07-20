export default function SelectInput({ label, name, value, onChange, error, options, required = false }) {
    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={value ?? ''}
                onChange={(e) => onChange(name, e.target.value)}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    error ? 'border-red-500' : 'border-gray-300'
                }`}
            >
                <option value="" className="text-gray-900 bg-white">-- Select --</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
