import TextInput from '../Components/TextInput';
import SelectInput from '../Components/SelectInput';

// Generates recent school years like "2025-2026", "2024-2025", etc.
function generateSchoolYearOptions(count = 10) {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < count; i++) {
        const start = currentYear - i;
        years.push(`${start}-${start + 1}`);
    }
    return years.map((y) => ({ value: y, label: y }));
}

export default function AcademicHistoryStep({ data, setData, errors, gradeLevels }) {
    const gradeOptions = gradeLevels.map((g) => ({ value: g.name, label: g.name }));
    const schoolYearOptions = generateSchoolYearOptions();

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Academic History</h2>
            <p className="text-sm text-gray-500 mb-4">Required for returnees and transferees. Skip if this is a first-time enrollment.</p>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <SelectInput
                    label="Last Grade Level Completed"
                    name="last_grade_level_completed"
                    value={data.last_grade_level_completed}
                    onChange={setData}
                    error={errors.last_grade_level_completed}
                    options={gradeOptions}
                />
                <SelectInput
                    label="Last School Year Completed"
                    name="last_school_year_completed"
                    value={data.last_school_year_completed}
                    onChange={setData}
                    error={errors.last_school_year_completed}
                    options={schoolYearOptions}
                />
                <TextInput label="Previous School Name" name="previous_school_name" value={data.previous_school_name} onChange={setData} error={errors.previous_school_name} />
                <TextInput label="Previous School ID" name="previous_school_id" value={data.previous_school_id} onChange={setData} error={errors.previous_school_id} />
            </div>
            <TextInput label="Previous School Address" name="previous_school_address" value={data.previous_school_address} onChange={setData} error={errors.previous_school_address} />
        </div>
    );
}
