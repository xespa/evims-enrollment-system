import TextInput from '../Components/TextInput';
import SelectInput from '../Components/SelectInput';

// Pre-Elementary levels, with the age each one is for.
const PRE_ELEMENTARY_AGES = {
    Nursery: 3,
    'Pre-K 1': 4,
    'Pre-K 2': 5,
};

// Only Nursery students are always new to school, so they never have an
// LRN yet. Must match StoreEnrollmentRequest::NO_LRN_GRADE_LEVEL.
const NO_LRN_GRADE_LEVEL = 'Nursery';

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';

    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthdayThisYear =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() &&
            today.getDate() >= dob.getDate());

    if (!hasHadBirthdayThisYear) age -= 1;

    return age >= 0 ? age : '';
}

export default function StudentInfoStep({
    data,
    setData,
    errors,
    gradeLevels,
    // Only the school years that are open for enrollment.
    schoolYears,
}) {
    const gradeOptions = gradeLevels.map((g) => ({
        value: g.id,
        label:
            g.name in PRE_ELEMENTARY_AGES
                ? `${g.name} (Age ${PRE_ELEMENTARY_AGES[g.name]})`
                : g.name,
    }));
    const schoolYearOptions = schoolYears.map((year) => ({
        value: year,
        label: year,
    }));

    const handleDateOfBirthChange = (name, value) => {
        setData((prevData) => ({
            ...prevData,
            date_of_birth: value,
            age: calculateAge(value),
        }));
    };

    const gradeName = (id) =>
        gradeLevels.find((g) => String(g.id) === String(id))?.name;
    const isNursery = gradeName(data.grade_level_id) === NO_LRN_GRADE_LEVEL;

    const handleGradeLevelChange = (name, value) => {
        const wasNursery =
            gradeName(data.grade_level_id) === NO_LRN_GRADE_LEVEL;
        const becomesNursery = gradeName(value) === NO_LRN_GRADE_LEVEL;

        setData((prevData) => ({
            ...prevData,
            grade_level_id: value,
            student_type: becomesNursery
                ? 'NO_LRN'
                : // Leaving Nursery: the "No LRN" it set was automatic, so
                  // make the parent choose for the new grade level.
                  wasNursery
                  ? ''
                  : prevData.student_type,
            lrn: becomesNursery ? '' : prevData.lrn,
        }));
    };

    return (
        <div>
            <h2 className="mb-4 font-serif text-xl font-semibold text-[#1F2A24]">
                Student Information
            </h2>

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <SelectInput
                    label="Student Type"
                    name="student_type"
                    value={data.student_type}
                    onChange={setData}
                    error={errors.student_type}
                    required
                    disabled={isNursery}
                    hint={
                        isNursery
                            ? 'Nursery students don’t have an LRN yet.'
                            : null
                    }
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
                <TextInput
                    label="Last Name"
                    name="last_name"
                    value={data.last_name}
                    onChange={setData}
                    error={errors.last_name}
                    required
                />
                <TextInput
                    label="First Name"
                    name="first_name"
                    value={data.first_name}
                    onChange={setData}
                    error={errors.first_name}
                    required
                />
                <TextInput
                    label="Middle Name"
                    name="middle_name"
                    value={data.middle_name}
                    onChange={setData}
                    error={errors.middle_name}
                />
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
                <TextInput
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={data.date_of_birth}
                    onChange={handleDateOfBirthChange}
                    error={errors.date_of_birth}
                    required
                />
                <TextInput
                    label="Age"
                    name="age"
                    type="number"
                    value={data.age}
                    onChange={setData}
                    error={errors.age}
                    required
                />
                <SelectInput
                    label="Sex"
                    name="sex"
                    value={data.sex}
                    onChange={setData}
                    error={errors.sex}
                    required
                    options={[
                        { value: 'MALE', label: 'Male' },
                        { value: 'FEMALE', label: 'Female' },
                    ]}
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
                    disabled
                    options={schoolYearOptions}
                />
                <TextInput
                    label="Date of Application"
                    name="date_of_application"
                    type="date"
                    value={data.date_of_application}
                    onChange={setData}
                    error={errors.date_of_application}
                    required
                    disabled
                />
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
