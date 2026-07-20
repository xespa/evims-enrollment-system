import TextInput from '../Components/TextInput';
import SelectInput from '../Components/SelectInput';

export default function StudentInfoStep({ data, setData, errors, gradeLevels }) {
    const gradeOptions = gradeLevels.map((g) => ({ value: g.id, label: g.name }));

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <SelectInput
                    label="Student Type"
                    name="student_type"
                    value={data.student_type}
                    onChange={setData}
                    error={errors.student_type}
                    required
                    options={[
                        { value: 'NO_LRN', label: 'No LRN' },
                        { value: 'WITH_LRN', label: 'With LRN' },
                        { value: 'RETURNEE', label: 'Returnee' },
                    ]}
                />
                <SelectInput
                    label="Grade Level Applying For"
                    name="grade_level_id"
                    value={data.grade_level_id}
                    onChange={setData}
                    error={errors.grade_level_id}
                    required
                    options={gradeOptions}
                />
            </div>

            {data.student_type !== 'NO_LRN' && (
                <TextInput
                    label="LRN (14-digit)"
                    name="lrn"
                    value={data.lrn}
                    onChange={setData}
                    error={errors.lrn}
                    maxLength={14}
                />
            )}

            <TextInput
                label="PSA Birth Certificate No."
                name="psa_birth_cert_no"
                value={data.psa_birth_cert_no}
                onChange={setData}
                error={errors.psa_birth_cert_no}
            />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <TextInput label="Last Name" name="last_name" value={data.last_name} onChange={setData} error={errors.last_name} required />
                <TextInput label="First Name" name="first_name" value={data.first_name} onChange={setData} error={errors.first_name} required />
                <TextInput label="Middle Name" name="middle_name" value={data.middle_name} onChange={setData} error={errors.middle_name} />
                <TextInput label="Extension Name (Jr., III)" name="extension_name" value={data.extension_name} onChange={setData} error={errors.extension_name} />
            </div>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
                <TextInput label="Date of Birth" name="date_of_birth" type="date" value={data.date_of_birth} onChange={setData} error={errors.date_of_birth} required />
                <TextInput label="Age" name="age" type="number" value={data.age} onChange={setData} error={errors.age} required />
                <SelectInput
                    label="Sex"
                    name="sex"
                    value={data.sex}
                    onChange={setData}
                    error={errors.sex}
                    required
                    options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]}
                />
            </div>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <TextInput label="School Year" name="school_year" value={data.school_year} onChange={setData} error={errors.school_year} placeholder="2026-2027" required />
                <TextInput label="Date of Application" name="date_of_application" type="date" value={data.date_of_application} onChange={setData} error={errors.date_of_application} required />
            </div>

            <SelectInput
                label="Session Time Preference"
                name="session_time_preference"
                value={data.session_time_preference}
                onChange={setData}
                error={errors.session_time_preference}
                required
                options={[
                    { value: 'MORNING_SESSION', label: 'Morning Session' },
                    { value: 'AFTERNOON_SESSION', label: 'Afternoon Session' },
                    { value: 'SCHOOL_SERVICE', label: 'School Service' },
                ]}
            />
        </div>
    );
}
