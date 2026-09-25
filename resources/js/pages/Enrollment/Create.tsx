import { useEffect, useState } from 'react';
import { useForm, Head, usePage } from '@inertiajs/react';
import StepperNav from './Components/StepperNav';
import VerifyLrnGate from './Steps/VerifyLrnGate';
import StudentInfoStep from './Steps/StudentInfoStep';
import AddressStep from './Steps/AddressStep';
import ParentInfoStep from './Steps/ParentInfoStep';
import AcademicHistoryStep from './Steps/AcademicHistoryStep';
import VitalInfoStep from './Steps/VitalInfoStep';
import SubjectsStep from './Steps/SubjectsStep';
import DocumentsStep from './Steps/DocumentsStep';
import BillingStep from './Steps/BillingStep';
import ReviewStep from './Steps/ReviewStep';

// Fields required to proceed past each step (client-side gatekeeping only —
// the server re-validates everything again in StoreEnrollmentRequest).
const STEP_REQUIRED_FIELDS = {
    1: [
        'student_type',
        'grade_level_id',
        'last_name',
        'first_name',
        'date_of_birth',
        'sex',
        'school_year',
        'date_of_application',
        'age',
        'session_time_preference',
        'email',
    ],
    2: ['barangay', 'city_municipality', 'province', 'country'],
    3: [],
    4: [],
    5: [],
    6: ['subject_ids'],
    7: [],
    8: ['payment_option', 'payment_channel'],
    9: [],
};

// Human-readable labels for the "please fill in ..." message when Next is
// blocked — only needs entries for fields that actually appear in
// STEP_REQUIRED_FIELDS above.
const FIELD_LABELS = {
    student_type: 'Student Type',
    grade_level_id: 'Grade Level',
    last_name: 'Last Name',
    first_name: 'First Name',
    date_of_birth: 'Date of Birth',
    sex: 'Sex',
    school_year: 'School Year',
    date_of_application: 'Date of Application',
    age: 'Age',
    session_time_preference: 'Session Time Preference',
    email: 'Email Address',
    barangay: 'Barangay',
    city_municipality: 'City/Municipality',
    province: 'Province',
    country: 'Country',
    subject_ids: 'at least one Subject',
    payment_option: 'Payment Option',
    payment_channel: 'Payment Channel',
};

// Steps skipped automatically (via Next/Back) once a returning student's LRN
// is confirmed, since their info is already on file — Address, Parents,
// Academic History, Vital Info, and Documents. They're still reachable by
// clicking directly on the stepper nav, this only affects the linear flow.
const FAST_TRACK_SKIP_STEPS = [2, 3, 4, 5, 7];

const FIELD_TO_STEP = {
    student_type: 1,
    grade_level_id: 1,
    lrn: 1,
    psa_birth_cert_no: 1,
    last_name: 1,
    first_name: 1,
    middle_name: 1,
    extension_name: 1,
    date_of_birth: 1,
    age: 1,
    sex: 1,
    school_year: 1,
    date_of_application: 1,
    session_time_preference: 1,
    email: 1,

    house_number_street: 2,
    barangay: 2,
    city_municipality: 2,
    province: 2,
    country: 2,
    zip_code: 2,

    father_last_name: 3,
    father_first_name: 3,
    father_middle_name: 3,
    father_occupation: 3,
    father_name_of_office: 3,
    father_mobile_no: 3,
    mother_maiden_last_name: 3,
    mother_first_name: 3,
    mother_middle_name: 3,
    mother_occupation: 3,
    mother_name_of_office: 3,
    mother_mobile_no: 3,

    last_grade_level_completed: 4,
    last_school_year_completed: 4,
    previous_school_name: 4,
    previous_school_id: 4,
    previous_school_address: 4,

    has_attended_summer_school: 5,
    has_emotional_mental_physical_difficulties: 5,
    has_learning_difficulties: 5,
    has_extended_absences: 5,
    shows_special_abilities_interests: 5,
    has_been_expelled: 5,
    has_been_suspended: 5,
    has_repeated_a_grade: 5,
    history_particulars: 5,
    special_health_problems: 5,

    subject_ids: 6,

    form_138: 7,
    birth_certificate: 7,
    good_moral_certificate: 7,

    payment_option: 8,
    payment_channel: 8,
};

// Persists in-progress answers to this browser so navigating away (home,
// another page, a closed tab) and coming back doesn't lose what was already
// filled in. File inputs can't be serialized to localStorage, so uploaded
// files are intentionally left out — those need to be reselected.
const DRAFT_STORAGE_KEY = 'evims:enrollment-draft';
const DRAFT_FILE_FIELDS = ['form_138', 'birth_certificate', 'good_moral_certificate'];

function loadDraft() {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveDraft(draft) {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
        // Storage full, disabled, or unavailable (private browsing) — the
        // form still works, it just won't survive navigating away.
    }
}

function clearDraft() {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
        // Nothing to do if storage isn't available.
    }
}

function currentSchoolYearStart() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12
    // PH school year runs roughly June–March/April; before June we're still
    // in the school year that started the previous calendar year.
    return month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

function getDefaultSchoolYear() {
    const startYear = currentSchoolYearStart();
    return `${startYear}-${startYear + 1}`;
}

// Offers one school year back through two years ahead of the current one —
// enough room for late enrollees and early applications, without listing
// every year that's ever existed.
function generateSchoolYearOptions() {
    const currentStart = currentSchoolYearStart();
    const years = [];
    for (let start = currentStart - 1; start <= currentStart + 2; start++) {
        years.push(`${start}-${start + 1}`);
    }
    return years;
}

// A family applies once per school year, so a continuing application is
// always for the year right after their last one — regardless of whether
// the grade level is advancing or being repeated.
function nextSchoolYear(schoolYear) {
    const [start] = schoolYear.split('-').map(Number);
    return `${start + 1}-${start + 2}`;
}

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

export default function Create({
    gradeLevels,
    previousApplication,
    hasExistingRecord,
}) {
    const { props } = usePage();
    const enrollee = props.auth?.enrollee;

    // The localStorage "resume where I left off" draft is a guest-only
    // safety net — it exists because a guest has no account to fall back
    // on if they navigate away mid-application. A logged-in enrollee's data
    // already lives on the server, so every visit goes through the LRN
    // fast-track gate fresh instead of trusting a stale local draft.
    const [draft] = useState(() => (enrollee ? null : loadDraft()));
    const restoredFromDraft = !!draft;

    const [step, setStep] = useState(draft?.step ?? 1);
    // Set when Next is clicked but a required field on this step is still
    // empty — without this, the button just silently did nothing, which
    // looked exactly like a broken button instead of a validation stop.
    const [nextBlockedReason, setNextBlockedReason] = useState('');
    // Tracks the furthest step ever reached, separate from the current one —
    // so stepping back to review/edit an earlier step doesn't grey out the
    // later steps you've already filled in on the stepper nav.
    const [maxStepReached, setMaxStepReached] = useState(
        draft?.maxStepReached ?? 1,
    );
    // Gates the whole wizard behind an LRN check for returning families —
    // resolved immediately (no gate shown) for guests and first-time
    // accounts, since there's nothing on file to match against. Since the
    // draft is never loaded for a logged-in enrollee (see above), this
    // always re-evaluates fresh for them on every visit.
    const [lrnGateResolved, setLrnGateResolved] = useState(
        () => !hasExistingRecord,
    );
    const [fastTrack, setFastTrack] = useState(false);
    // The matched child's last application's school year, e.g. "2026-2027" —
    // used to enforce that this new application is for the very next year,
    // not the same year again or a year skipped ahead.
    const [previousSchoolYear, setPreviousSchoolYear] = useState(null);

    const defaultFormData = {
        // Student
        student_type: '',
        grade_level_id: '',
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
        email: enrollee?.email ?? '',
        school_year: getDefaultSchoolYear(),
        date_of_application: new Date().toISOString().slice(0, 10),

        // Address
        house_number_street: '',
        barangay: '',
        city_municipality: '',
        city_code: '',
        province: '',
        province_code: '',
        country: 'Philippines',
        zip_code: '',

        // Parents
        father_last_name: '',
        father_first_name: '',
        father_middle_name: '',
        father_occupation: '',
        father_name_of_office: '',
        father_mobile_no: '',
        mother_maiden_last_name: '',
        mother_first_name: '',
        mother_middle_name: '',
        mother_occupation: '',
        mother_name_of_office: '',
        mother_mobile_no: '',

        // Academic history
        last_grade_level_completed: '',
        last_school_year_completed: '',
        previous_school_name: '',
        previous_school_id: '',
        previous_school_address: '',

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

        // Documents
        form_138: null,
        birth_certificate: null,
        good_moral_certificate: null,

        // Billing
        payment_option: '',
        payment_channel: '',
    };

    const { data, setData, post, processing, errors } = useForm({
        ...defaultFormData,
        ...draft?.data,
    });

    const totalSteps = 9;

    // Keep the browser's copy of the in-progress application up to date —
    // this is what lets a guest's form survive a trip to another page and
    // back. Skipped entirely for a logged-in enrollee, who relies on the
    // LRN fast-track instead (see the draft-loading note above).
    useEffect(() => {
        if (enrollee) return;

        const persistable = { ...data };
        DRAFT_FILE_FIELDS.forEach((field) => delete persistable[field]);

        saveDraft({
            data: persistable,
            step,
            maxStepReached,
            lrnGateResolved,
            fastTrack,
        });
    }, [data, step, maxStepReached, lrnGateResolved, fastTrack]);

    const getMissingFields = () => {
        const required = [...STEP_REQUIRED_FIELDS[step]];
        // Session time preference normally lives on step 1, which the fast
        // track skips entirely — it's the one field that's genuinely new
        // for this specific application, so it's asked for on step 6
        // instead and must still be answered before continuing.
        if (fastTrack && step === 6) {
            required.push('session_time_preference');
        }
        return required.filter((field) => {
            const value = data[field];
            if (Array.isArray(value)) return value.length === 0;
            return value === '' || value === null || value === undefined;
        });
    };

    // Fast-track applications must be for the year right after the child's
    // last one on file — this only ever applies once a match has set a
    // previous school year to compare against.
    const getSchoolYearIssue = () => {
        if (!fastTrack || !previousSchoolYear) return null;
        const expected = nextSchoolYear(previousSchoolYear);
        if (data.school_year === expected) return null;
        return `Your last application was for ${previousSchoolYear}. Since this is a continuing application, it should be for ${expected} instead of ${data.school_year} — please update the School Year above before continuing.`;
    };

    // Once the flagged fields are actually filled in, drop the message
    // instead of leaving it stuck on screen.
    useEffect(() => {
        if (
            nextBlockedReason &&
            getMissingFields().length === 0 &&
            !getSchoolYearIssue()
        ) {
            setNextBlockedReason('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    // On the fast track, Next/Back skip over the steps that are already
    // filled in from the matched record — clicking the stepper directly
    // still reaches every step regardless.
    const nextReachableStep = (from) => {
        let candidate = from + 1;
        while (
            fastTrack &&
            FAST_TRACK_SKIP_STEPS.includes(candidate) &&
            candidate < totalSteps
        ) {
            candidate += 1;
        }
        return Math.min(candidate, totalSteps);
    };

    const prevReachableStep = (from) => {
        let candidate = from - 1;
        while (
            fastTrack &&
            FAST_TRACK_SKIP_STEPS.includes(candidate) &&
            candidate > 1
        ) {
            candidate -= 1;
        }
        return Math.max(candidate, 1);
    };

    const goNext = () => {
        const missing = getMissingFields();
        const schoolYearIssue = getSchoolYearIssue();
        if (missing.length > 0 || schoolYearIssue) {
            const messages = [];
            if (missing.length > 0) {
                messages.push(
                    `Before continuing, please fill in: ${missing
                        .map((field) => FIELD_LABELS[field] ?? field)
                        .join(', ')}.`,
                );
            }
            if (schoolYearIssue) {
                messages.push(schoolYearIssue);
            }
            setNextBlockedReason(messages.join(' '));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setNextBlockedReason('');
        setStep((s) => {
            const next = nextReachableStep(s);
            setMaxStepReached((m) => Math.max(m, next));
            return next;
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setNextBlockedReason('');
        setStep((s) => prevReachableStep(s));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToStep = (stepNumber) => {
        setNextBlockedReason('');
        setStep(stepNumber);
        setMaxStepReached((m) => Math.max(m, stepNumber));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLrnMatched = (student, prevSchoolYear) => {
        const expectedSchoolYear = prevSchoolYear
            ? nextSchoolYear(prevSchoolYear)
            : null;

        setData((prev) => ({
            ...prev,
            ...student,
            age: student.date_of_birth
                ? calculateAge(student.date_of_birth)
                : prev.age,
            // Default straight to the correct next school year, so there's
            // usually nothing to fix — the reminder below only fires if
            // this gets changed to something else afterward.
            school_year: expectedSchoolYear ?? prev.school_year,
        }));
        setPreviousSchoolYear(prevSchoolYear ?? null);
        setFastTrack(true);
        setLrnGateResolved(true);
        setStep(6);
        setMaxStepReached(9);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewChild = () => {
        setFastTrack(false);
        setLrnGateResolved(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // The stepper lets a fast-track applicant jump straight to Review
        // and submit without ever passing through step 6's Next button, so
        // the school-year check needs to be re-run here too.
        const schoolYearIssue = getSchoolYearIssue();
        if (schoolYearIssue) {
            setNextBlockedReason(schoolYearIssue);
            setStep(6);
            setMaxStepReached((m) => Math.max(m, 6));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        post(route('enrollment.store'), {
            forceFormData: true,
            onSuccess: (page) => {
                // A guest without an account gets redirected to register
                // instead of the success page — that's not a real
                // submission yet, so the draft must survive it. Only clear
                // once we've actually landed on the success page.
                if (page.component === 'Enrollment/Success') {
                    clearDraft();
                }
            },
            onError: (formErrors) => {
                const errorFields = Object.keys(formErrors);
                if (errorFields.length > 0) {
                    const stepsWithErrors = errorFields.map(
                        (f) => FIELD_TO_STEP[f] ?? totalSteps,
                    );
                    const earliestStep = Math.min(...stepsWithErrors);
                    setStep(earliestStep);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const stepProps = { data, setData, errors, gradeLevels };

    return (
        <>
            <Head title="Enrollment Application" />

            <div className="min-h-screen bg-[#FBF8F2] px-4 py-12">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-6 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                            School Year {data.school_year}
                        </span>
                        <h1 className="mt-3 font-serif text-3xl font-semibold text-[#1F2A24]">
                            EVIMS Enrollment Application
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/60">
                            A few short steps and your child's seat is reserved.
                        </p>
                    </div>

                    {restoredFromDraft && (
                        <div className="mb-4 rounded-2xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#1F2A24]/80">
                            Welcome back — we've restored your in-progress
                            application right where you left off. Any files
                            you'd already selected will need to be reattached.
                        </div>
                    )}

                    {!lrnGateResolved ? (
                        <VerifyLrnGate
                            defaultLrn={previousApplication?.lrn}
                            onMatched={handleLrnMatched}
                            onNewChild={handleNewChild}
                        />
                    ) : (
                        <>
                            {fastTrack && step === 6 && (
                                <div className="mb-4 rounded-2xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#1F2A24]/80">
                                    <p>
                                        We matched this child's LRN to your
                                        account — their student, address,
                                        parent, academic, and document info is
                                        already on file, so we skipped
                                        straight to subjects. Use the steps
                                        above if you need to review or update
                                        anything.
                                    </p>

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div>
                                            <label className="block text-sm font-medium text-[#1F2A24]/80">
                                                School Year
                                            </label>
                                            <select
                                                value={data.school_year}
                                                onChange={(e) =>
                                                    setData(
                                                        'school_year',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1.5 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                            >
                                                {generateSchoolYearOptions().map(
                                                    (year) => (
                                                        <option
                                                            key={year}
                                                            value={year}
                                                        >
                                                            {year}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[#1F2A24]/80">
                                                Grade Level
                                            </label>
                                            <select
                                                value={data.grade_level_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'grade_level_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1.5 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                            >
                                                <option value="">
                                                    -- Select --
                                                </option>
                                                {gradeLevels.map((g) => (
                                                    <option
                                                        key={g.id}
                                                        value={g.id}
                                                    >
                                                        {g.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-[#1F2A24]/50">
                                                Defaulted to the next grade up
                                                from last year.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[#1F2A24]/80">
                                                Session Time Preference
                                            </label>
                                            <select
                                                value={
                                                    data.session_time_preference
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'session_time_preference',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1.5 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                            >
                                                <option value="">
                                                    -- Select --
                                                </option>
                                                <option value="MORNING_SESSION">
                                                    Morning Session
                                                </option>
                                                <option value="AFTERNOON_SESSION">
                                                    Afternoon Session
                                                </option>
                                                <option value="SCHOOL_SERVICE">
                                                    School Service
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {nextBlockedReason && (
                                <div className="mb-4 rounded-2xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#8a3128]">
                                    {nextBlockedReason}
                                </div>
                            )}

                            {Object.keys(errors).length > 0 && (
                                <div className="mb-4 rounded-2xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#8a3128]">
                                    Please fix the highlighted errors below
                                    before submitting.
                                </div>
                            )}

                            <StepperNav
                                currentStep={step}
                                maxStepReached={maxStepReached}
                                onStepClick={goToStep}
                            />

                            <form
                                onSubmit={handleSubmit}
                                className="rounded-[2rem] border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/5 sm:p-8"
                            >
                                {step === 1 && (
                                    <StudentInfoStep {...stepProps} />
                                )}
                                {step === 2 && <AddressStep {...stepProps} />}
                                {step === 3 && (
                                    <ParentInfoStep {...stepProps} />
                                )}
                                {step === 4 && (
                                    <AcademicHistoryStep {...stepProps} />
                                )}
                                {step === 5 && <VitalInfoStep {...stepProps} />}
                                {step === 6 && <SubjectsStep {...stepProps} />}
                                {step === 7 && (
                                    <DocumentsStep {...stepProps} />
                                )}
                                {step === 8 && <BillingStep {...stepProps} />}
                                {step === 9 && <ReviewStep {...stepProps} />}

                                <div className="mt-6 flex justify-between border-t border-[#1F2A24]/10 pt-5">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        disabled={step === 1}
                                        className="rounded-full border border-[#1F2A24]/15 px-5 py-2 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30 disabled:opacity-40"
                                    >
                                        Back
                                    </button>

                                    {step < totalSteps ? (
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            className="rounded-full bg-[#2F6F4E] px-6 py-2 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-full bg-[#E8A33D] px-6 py-2 text-sm font-semibold text-[#1F2A24] shadow-sm transition-colors hover:bg-[#d6922e] disabled:opacity-50"
                                        >
                                            {processing
                                                ? 'Submitting...'
                                                : 'Submit Application'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
