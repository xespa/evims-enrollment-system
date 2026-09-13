import { useRef } from 'react';
import { Calendar } from 'lucide-react';

export default function TextInput({ label, name, value, onChange, error, type = 'text', required = false, ...rest }) {
    const inputRef = useRef(null);
    const isDate = type === 'date';

    const openPicker = () => {
        inputRef.current?.showPicker?.();
        inputRef.current?.focus();
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                {label} {required && <span className="text-[#C6473B]">*</span>}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    id={name}
                    name={name}
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => onChange(name, e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1F2A24] placeholder-[#1F2A24]/30 shadow-sm transition-colors focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none ${
                        isDate ? 'pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0' : ''
                    } ${
                        error ? 'border-[#C6473B]' : 'border-[#1F2A24]/15'
                    }`}
                    {...rest}
                />
                {isDate && (
                    <button
                        type="button"
                        onClick={openPicker}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#1F2A24]/40 hover:text-[#2F6F4E]"
                        aria-label="Open calendar"
                    >
                        <Calendar className="h-4 w-4" />
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-[#C6473B]">{error}</p>}
        </div>
    );
}
