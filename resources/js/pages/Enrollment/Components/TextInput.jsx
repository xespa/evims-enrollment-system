export default function TextInput({ label, name, value, onChange, error, type = 'text', required = false, ...rest }) {
    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(name, e.target.value)}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    error ? 'border-red-500' : 'border-gray-300'
                }`}
                {...rest}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
