import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import StepperNav from './Components/StepperNav';
import StudentInfoStep from './Steps/StudentInfoStep';
import AddressStep from './Steps/AddressStep';
import ParentInfoStep from './Steps/ParentInfoStep';
import AcademicHistoryStep from './Steps/AcademicHistoryStep';
import VitalInfoStep from './Steps/VitalInfoStep';
import SubjectsStep from './Steps/SubjectsStep';
import BillingStep from './Steps/BillingStep';
import ReviewStep from './Steps/ReviewStep';


// Fields required to proceed past each step (client-side gatekeeping only —
// the server re-validates everything again in StoreEnrollmentRequest).
const STEP_REQUIRED_FIELDS = {
    1: ['student_type', 'grade_level_id', 'last_name', 'first_name', 'date_of_birth', 'sex', 'school_year', 'date_of_application', 'age', 'session_time_preference'],
    2: ['barangay', 'city_municipality', 'province', 'country'],
    3: [],
    4: [],
    5: [],
    6: ['subject_ids'],
    7: ['payment_option', 'payment_channel'],
    8: [],
};

const FIELD_TO_STEP = {
    student_type: 1, grade_level_id: 1, lrn: 1, psa_birth_cert_no: 1,
    last_name: 1, first_name: 1, middle_name: 1, extension_name: 1,
    date_of_birth: 1, age: 1, sex: 1, school_year: 1,
    date_of_application: 1, session_time_preference: 1,

    house_number_street: 2, barangay: 2, city_municipality: 2,
    province: 2, country: 2, zip_code: 2,

    father_last_name: 3, father_first_name: 3, father_middle_name: 3,
    father_occupation: 3, father_name_of_office: 3, father_mobile_no: 3,
    mother_maiden_last_name: 3, mother_first_name: 3, mother_middle_name: 3,
    mother_occupation: 3, mother_name_of_office: 3, mother_mobile_no: 3,

    last_grade_level_completed: 4, last_school_year_completed: 4,
    previous_school_name: 4, previous_school_id: 4, previous_school_address: 4,

    has_attended_summer_school: 5, has_emotional_mental_physical_difficulties: 5,
    has_learning_difficulties: 5, has_extended_absences: 5,
    shows_special_abilities_interests: 5, has_been_expelled: 5,
    has_been_suspended: 5, has_repeated_a_grade: 5,
    history_particulars: 5, special_health_problems: 5,

    subject_ids: 6,

    payment_option: 7, scanned_contract: 7,
};

export default function Create({ gradeLevels, schoolGcash }) {
    const [step, setStep] = useState(1);

    const { data, setData, post, processing, errors, transform } = useForm({
        // Student
        student_type: '',
        lrn: '',
        psa_birth_cert_no: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        extension_name: '',
        date_of_birth: '',
        age: '',
        sex: '',
        session_time_preference: '',
        grade_level_id: '',
        school_year: '2026-2027',
        date_of_application: new Date().toISOString().slice(0, 10),

        // Address
        house_number_street: '',
        barangay: '',
        city_municipality: '',
        province: '',
        country: 'Philippines',
        zip_code: '',

        // Parents
        father_last_name: '', father_first_name: '', father_middle_name: '',
        father_occupation: '', father_name_of_office: '', father_mobile_no: '',
        mother_maiden_last_name: '', mother_first_name: '', mother_middle_name: '',
        mother_occupation: '', mother_name_of_office: '', mother_mobile_no: '',

        // Academic history
        last_grade_level_completed: '', last_school_year_completed: '',
        previous_school_name: '', previous_school_id: '', previous_school_address: '',

        // Vital info
        has_attended_summer_school: false,
        has_emotional_mental_physical_difficulties: false,
        has_learning_difficulties: false,
        has_extended_absences: false,
        shows_special_abilities_interests: false,
        has_been_expelled: false,
        has_been_suspended: false,
        has_repeated_a_grade: false,
        history_particulars: '',
        special_health_problems: '',

        // Subjects
        subject_ids: [],

        // Billing
        payment_option: '',
        scanned_contract: null,
    });

    const totalSteps = 8;

    const isStepValid = () => {
        const required = STEP_REQUIRED_FIELDS[step];
        return required.every((field) => {
            const value = data[field];
            if (Array.isArray(value)) return value.length > 0;
            return value !== '' && value !== null && value !== undefined;
        });
    };

    const goNext = () => {
        if (!isStepValid()) return;
        setStep((s) => Math.min(s + 1, totalSteps));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setStep((s) => Math.max(s - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('enrollment.store'), {
            forceFormData: true,
            onError: (formErrors) => {
                const errorFields = Object.keys(formErrors);
                if (errorFields.length > 0) {
                    const stepsWithErrors = errorFields.map((f) => FIELD_TO_STEP[f] ?? totalSteps);
                    const earliestStep = Math.min(...stepsWithErrors);
                    setStep(earliestStep);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const stepProps = { data, setData, errors, gradeLevels, schoolGcash };

    return (
        <>
            <Head title="Enrollment Application" />

            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-6 text-2xl font-bold text-gray-900">EVIMS Enrollment Application</h1>

                    {Object.keys(errors).length > 0 && (
                        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Please fix the highlighted errors below before submitting.
                        </div>
                    )}

                    <StepperNav currentStep={step} />

                    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
                        {step === 1 && <StudentInfoStep {...stepProps} />}
                        {step === 2 && <AddressStep {...stepProps} />}
                        {step === 3 && <ParentInfoStep {...stepProps} />}
                        {step === 4 && <AcademicHistoryStep {...stepProps} />}
                        {step === 5 && <VitalInfoStep {...stepProps} />}
                        {step === 6 && <SubjectsStep {...stepProps} />}
                        {step === 7 && <BillingStep {...stepProps} />}
                        {step === 8 && <ReviewStep {...stepProps} />}

                        <div className="mt-6 flex justify-between border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={goBack}
                                disabled={step === 1}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
                            >
                                Back
                            </button>

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {processing ? 'Submitting...' : 'Submit Application'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
