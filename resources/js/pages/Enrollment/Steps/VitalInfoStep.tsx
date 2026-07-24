function CheckboxRow({ label, name, checked, onChange }) {
    return (
        <label className="flex items-start gap-2 py-1.5 cursor-pointer">
            <input
                type="checkbox"
                checked={!!checked}
                onChange={(e) => onChange(name, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

export default function VitalInfoStep({ data, setData, errors }) {
    const checklist = [
        ['has_attended_summer_school', 'Has attended summer school'],
        ['has_emotional_mental_physical_difficulties', 'Has emotional, mental, or physical difficulties'],
        ['has_learning_difficulties', 'Has learning difficulties'],
        ['has_extended_absences', 'Has had extended absences'],
        ['shows_special_abilities_interests', 'Shows special abilities or interests'],
        ['has_been_expelled', 'Has been expelled from a previous school'],
        ['has_been_suspended', 'Has been suspended from a previous school'],
        ['has_repeated_a_grade', 'Has repeated a grade level'],
    ];

    const anyChecked = checklist.some(([key]) => data[key]);

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Vital Information</h2>
            <p className="text-sm text-gray-500 mb-4">Please check all that apply to the student.</p>

            <div className="rounded-md border border-gray-200 p-4">
                {checklist.map(([name, label]) => (
                    <CheckboxRow key={name} label={label} name={name} checked={data[name]} onChange={setData} />
                ))}
            </div>

            {anyChecked && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Please provide details for any items checked above <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={data.history_particulars ?? ''}
                        onChange={(e) => setData('history_particulars', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            errors.history_particulars ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.history_particulars && <p className="mt-1 text-sm text-red-600">{errors.history_particulars}</p>}
                </div>
            )}

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Health Problems / Allergies / Conditions</label>
                <textarea
                    rows={3}
                    value={data.special_health_problems ?? ''}
                    onChange={(e) => setData('special_health_problems', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Asthma, peanut allergy, none"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>
        </div>
    );
}
