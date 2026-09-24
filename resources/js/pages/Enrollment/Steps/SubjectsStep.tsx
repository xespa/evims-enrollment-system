import { Check, X } from 'lucide-react';

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
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Subjects</h2>
            <p className="text-sm text-gray-500 mb-4">
                Showing subjects for <span className="font-medium">{selectedGrade?.name ?? '—'}</span>.
                {!selectedGrade && ' Please go back and select a grade level first.'}
            </p>

            {subjects.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={selectAll}
                        disabled={allSelected}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Select all
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={noneSelected}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                    <span className="ml-1 text-xs text-gray-400">
                        {selectedIds.length} of {subjects.length} selected
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {subjects.map((subject) => (
                    <label key={subject.id} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(subject.id)}
                            onChange={() => toggleSubject(subject.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{subject.name}</span>
                    </label>
                ))}
            </div>

            {errors.subject_ids && <p className="mt-2 text-sm text-red-600">{errors.subject_ids}</p>}
        </div>
    );
}
