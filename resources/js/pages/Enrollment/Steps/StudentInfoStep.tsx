import TextInput from '../Components/TextInput';
import SelectInput from '../Components/SelectInput';

// Offers one school year back through two years ahead of the current one —
// enough room for late enrollees and early applications, without listing
// every year that's ever existed.
function generateSchoolYearOptions() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentStart = month >= 6 ? now.getFullYear() : now.getFullYear() - 1;

    const years = [];
    for (let start = currentStart - 1; start <= currentStart + 2; start++) {
        years.push(`${start}-${start + 1}`);
    }
    return years.map((y) => ({ value: y, label: y }));
}

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';

    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

    if (!hasHadBirthdayThisYear) age -= 1;

    return age >= 0 ? age : '';
}

export default function StudentInfoStep({ data, setData, errors, gradeLevels }) {
    const gradeOptions = gradeLevels.map((g) => ({ value: g.id, label: g.name }));
    const schoolYearOptions = generateSchoolYearOptions();

    const handleDateOfBirthChange = (name, value) => {
        setData((prevData) => ({
            ...prevData,
            date_of_birth: value,
            age: calculateAge(value),
        }));
    };

    const handleGradeLevelChange = (name, value) => {
        const selected = gradeLevels.find((g) => String(g.id) === String(value));
        const isKinder = selected?.name === 'Kinder';

        setData((prevData) => ({
            ...prevData,
            grade_level_id: value,
            student_type: isKinder ? 'NO_LRN' : prevData.student_type,
        }));
    };

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
                    onChange={handleGradeLevelChange}
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
                label="PSA Birth Certificate No./BReN"
                name="psa_birth_cert_no"
                value={data.psa_birth_cert_no}
                onChange={setData}
                error={errors.psa_birth_cert_no}
            />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <TextInput label="Last Name" name="last_name" value={data.last_name} onChange={setData} error={errors.last_name} required />
                <TextInput label="First Name" name="first_name" value={data.first_name} onChange={setData} error={errors.first_name} required />
                <TextInput label="Middle Name" name="middle_name" value={data.middle_name} onChange={setData} error={errors.middle_name} />
                <SelectInput
                    label="Extension Name"
                    name="extension_name"
                    value={data.extension_name}
                    onChange={setData}
                    error={errors.extension_name}
                    options={[
                        { value: 'N/A', label: 'N/A' },
                        { value: 'Jr.', label: 'Jr.' },
                        { value: 'Sr.', label: 'Sr.' },
                        { value: 'II', label: 'II' },
                        { value: 'III', label: 'III' },
                        { value: 'IV', label: 'IV' },
                        { value: 'V', label: 'V' },
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
                <TextInput label="Date of Birth" name="date_of_birth" type="date" value={data.date_of_birth} onChange={handleDateOfBirthChange} error={errors.date_of_birth} required />
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
                <SelectInput
                    label="School Year"
                    name="school_year"
                    value={data.school_year}
                    onChange={setData}
                    error={errors.school_year}
                    required
                    options={schoolYearOptions}
                />
                <TextInput label="Date of Application" name="date_of_application" type="date" value={data.date_of_application} onChange={setData} error={errors.date_of_application} required />
            </div>

            <TextInput
                label="Email Address (for status updates)"
                name="email"
                type="email"
                value={data.email}
                onChange={setData}
                error={errors.email}
                required
            />

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
