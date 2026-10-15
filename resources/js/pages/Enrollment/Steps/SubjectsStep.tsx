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
            <h2 className="font-serif text-xl font-semibold text-ink mb-3">Subjects</h2>
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/5 px-3 py-1.5 text-sm font-medium text-brand-ink transition-colors hover:border-brand/40 hover:bg-brand/10 disabled:cursor-not-allowed disabled:border-ink/10 disabled:bg-ink/[0.03] disabled:text-ink/45"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Select all
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={noneSelected}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.03] px-3 py-1.5 text-sm font-medium text-ink/75 transition-colors hover:border-ink/25 hover:bg-ink/10 disabled:cursor-not-allowed disabled:text-ink/40"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                    <span className="ml-1 text-xs text-ink/70" aria-live="polite">
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
                                    ? 'border-brand/40 bg-brand/5'
                                    : 'border-ink/10 hover:bg-ink/[0.03]'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSubject(subject.id)}
                                className="h-4 w-4 shrink-0 rounded border-ink/15 text-brand-ink accent-brand focus:ring-brand/30"
                            />
                            <span className="text-sm text-ink/80">{subject.name}</span>
                        </label>
                    );
                })}
            </fieldset>

            {errors.subject_ids && (
                <p id="subject_ids-error" className="mt-2 text-sm text-danger-ink">
                    {errors.subject_ids}
                </p>
            )}
        </div>
    );
}
