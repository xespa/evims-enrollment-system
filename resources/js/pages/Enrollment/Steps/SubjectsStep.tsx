export default function SubjectsStep({ data, setData, errors, gradeLevels }) {
    const selectedGrade = gradeLevels.find((g) => String(g.id) === String(data.grade_level_id));
    const subjects = selectedGrade?.subjects ?? [];

    const toggleSubject = (subjectId) => {
        const current = data.subject_ids ?? [];
        const exists = current.includes(subjectId);
        const updated = exists ? current.filter((id) => id !== subjectId) : [...current, subjectId];
        setData('subject_ids', updated);
    };

    const selectAll = () => setData('subject_ids', subjects.map((s) => s.id));
    const clearAll = () => setData('subject_ids', []);

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Subjects</h2>
            <p className="text-sm text-gray-500 mb-4">
                Showing subjects for <span className="font-medium">{selectedGrade?.name ?? '—'}</span>.
                {!selectedGrade && ' Please go back and select a grade level first.'}
            </p>

            {subjects.length > 0 && (
                <div className="mb-3 flex gap-3 text-sm">
                    <button type="button" onClick={selectAll} className="text-blue-600 hover:underline">Select all</button>
                    <button type="button" onClick={clearAll} className="text-gray-500 hover:underline">Clear</button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {subjects.map((subject) => (
                    <label key={subject.id} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input
                            type="checkbox"
                            checked={(data.subject_ids ?? []).includes(subject.id)}
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
