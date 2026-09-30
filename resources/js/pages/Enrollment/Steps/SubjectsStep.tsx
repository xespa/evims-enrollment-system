import { Check, X } from 'lucide-react';
import StepGuide from '../Components/StepGuide';

export default function SubjectsStep({ data, setData, errors, gradeLevels }) {
    const selectedGrade = gradeLevels.find((g) => String(g.id) === String(data.grade_level_id));
    const subjects = selectedGrade?.subjects ?? [];
    const selectedIds = data.subject_ids ?? [];

    const toggleSubject = (subjectId) => {
        const current = data.subject_ids ?? [];
        const exists = current.includes(subjectId);
        const updated = exists ? current.filter((id) => id !== subjectId) : [...current, subjectId];
        setData('subject_ids', updated);
    };

    const selectAll = () => setData('subject_ids', subjects.map((s) => s.id));
    const clearAll = () => setData('subject_ids', []);

    const allSelected = subjects.length > 0 && subjects.every((s) => selectedIds.includes(s.id));
    const noneSelected = selectedIds.length === 0;

    return (
        <div>
            <h2 className="font-serif text-xl font-semibold text-[#1F2A24] mb-3">Subjects</h2>
            <StepGuide>
                Showing subjects for <span className="font-semibold">{selectedGrade?.name ?? '—'}</span>.
                {!selectedGrade && ' Please go back and select a grade level first.'}
            </StepGuide>

            {subjects.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={selectAll}
                        disabled={allSelected}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-3 py-1.5 text-sm font-medium text-[#2F6F4E] transition-colors hover:border-[#2F6F4E]/40 hover:bg-[#2F6F4E]/10 disabled:cursor-not-allowed disabled:border-[#1F2A24]/10 disabled:bg-[#1F2A24]/[0.03] disabled:text-[#1F2A24]/45"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Select all
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={noneSelected}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#1F2A24]/10 bg-[#1F2A24]/[0.03] px-3 py-1.5 text-sm font-medium text-[#1F2A24]/75 transition-colors hover:border-[#1F2A24]/25 hover:bg-[#1F2A24]/10 disabled:cursor-not-allowed disabled:text-[#1F2A24]/40"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                    <span className="ml-1 text-xs text-[#1F2A24]/70" aria-live="polite">
                        {selectedIds.length} of {subjects.length} selected
                    </span>
                </div>
            )}

            <fieldset
                aria-describedby={errors.subject_ids ? 'subject_ids-error' : undefined}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
                <legend className="sr-only">
                    Subjects for {selectedGrade?.name ?? 'the selected grade'}
                </legend>
                {subjects.map((subject) => {
                    const isChecked = selectedIds.includes(subject.id);

                    return (
                        <label
                            key={subject.id}
                            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                                isChecked
                                    ? 'border-[#2F6F4E]/40 bg-[#2F6F4E]/5'
                                    : 'border-[#1F2A24]/10 hover:bg-[#1F2A24]/[0.03]'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSubject(subject.id)}
                                className="h-4 w-4 shrink-0 rounded border-[#1F2A24]/15 text-[#2F6F4E] accent-[#2F6F4E] focus:ring-[#2F6F4E]/30"
                            />
                            <span className="text-sm text-[#1F2A24]/80">{subject.name}</span>
                        </label>
                    );
                })}
            </fieldset>

            {errors.subject_ids && (
                <p id="subject_ids-error" className="mt-2 text-sm text-[#C6473B]">
                    {errors.subject_ids}
                </p>
            )}
        </div>
    );
}
