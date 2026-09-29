function CheckboxRow({ label, name, checked, onChange }) {
    return (
        <label className="-mx-2 flex min-h-10 cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-[#1F2A24]/[0.03]">
            <input
                type="checkbox"
                checked={!!checked}
                onChange={(e) => onChange(name, e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#1F2A24]/15 text-[#2F6F4E] accent-[#2F6F4E] focus:ring-[#2F6F4E]/30"
            />
            <span className="text-sm text-[#1F2A24]/80">{label}</span>
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
            <h2 className="font-serif text-xl font-semibold text-[#1F2A24] mb-1">Vital Information</h2>
            <p className="text-sm text-[#1F2A24]/70 mb-4">Please check all that apply to the student.</p>

            <fieldset className="rounded-xl border border-[#1F2A24]/10 p-4">
                <legend className="sr-only">Student history checklist</legend>
                {checklist.map(([name, label]) => (
                    <CheckboxRow key={name} label={label} name={name} checked={data[name]} onChange={setData} />
                ))}
            </fieldset>

            {anyChecked && (
                <div className="mt-4">
                    <label htmlFor="history_particulars" className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                        Please provide details for any items checked above <span className="text-[#C6473B]" aria-hidden="true">*</span>
                    </label>
                    <textarea
                        id="history_particulars"
                        rows={3}
                        aria-required="true"
                        aria-invalid={errors.history_particulars ? true : undefined}
                        aria-describedby={errors.history_particulars ? 'history_particulars-error' : undefined}
                        value={data.history_particulars ?? ''}
                        onChange={(e) => setData('history_particulars', e.target.value)}
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1F2A24] shadow-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none ${
                            errors.history_particulars ? 'border-[#C6473B]' : 'border-[#1F2A24]/15'
                        }`}
                    />
                    {errors.history_particulars && <p id="history_particulars-error" className="mt-1 text-sm text-[#C6473B]">{errors.history_particulars}</p>}
                </div>
            )}

            <div className="mt-4">
                <label htmlFor="special_health_problems" className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">Special Health Problems / Allergies / Conditions</label>
                <textarea
                    id="special_health_problems"
                    rows={3}
                    value={data.special_health_problems ?? ''}
                    onChange={(e) => setData('special_health_problems', e.target.value)}
                    placeholder="e.g. Asthma, peanut allergy, none"
                    className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] placeholder-[#1F2A24]/40 shadow-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                />
            </div>
        </div>
    );
}
