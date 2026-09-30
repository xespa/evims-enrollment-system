import {
    computeInstallments,
    formatCurrency,
    PAYMENT_OPTIONS,
} from '../Components/fees';
import StepGuide from '../Components/StepGuide';

function ReviewRow({ label, value }) {
    return (
        <div className="flex justify-between border-b border-[#1F2A24]/10 py-1.5 text-sm">
            <span className="text-[#1F2A24]/70">{label}</span>
            <span className="font-medium text-[#1F2A24]">{value || '—'}</span>
        </div>
    );
}

export default function ReviewStep({ data, gradeLevels }) {
    const selectedGrade = gradeLevels.find(
        (g) => String(g.id) === String(data.grade_level_id),
    );
    const gradeName = selectedGrade?.name;
    const plan =
        selectedGrade && data.payment_option
            ? computeInstallments(
                  selectedGrade.tuition_fee,
                  data.payment_option,
              )
            : null;
    const planSummary = !plan
        ? null
        : plan.count === 1
          ? `1 payment of ${formatCurrency(plan.last)}`
          : plan.regular === plan.last
            ? `${plan.count} payments of ${formatCurrency(plan.regular)}`
            : `${plan.count - 1} × ${formatCurrency(plan.regular)} + ${formatCurrency(plan.last)}`;
    const subjectNames = (selectedGrade?.subjects ?? [])
        .filter((s) => (data.subject_ids ?? []).includes(s.id))
        .map((s) => s.name)
        .join(', ');

    return (
        <div>
            <h2 className="mb-3 font-serif text-xl font-semibold text-[#1F2A24]">
                Review Your Application
            </h2>
            <StepGuide>
                Please check everything before submitting.
            </StepGuide>

            <div className="mb-4">
                <h3 className="mb-1 text-sm font-semibold text-[#1F2A24]/75">
                    Student
                </h3>
                <ReviewRow
                    label="Name"
                    value={`${data.last_name}, ${data.first_name} ${data.middle_name ?? ''}`}
                />
                <ReviewRow label="Grade Level" value={gradeName} />
                <ReviewRow label="Student Type" value={data.student_type} />
                <ReviewRow label="School Year" value={data.school_year} />
                <ReviewRow
                    label="Session"
                    value={data.session_time_preference}
                />
                <ReviewRow label="Email" value={data.email} />
            </div>

            <div className="mb-4">
                <h3 className="mb-1 text-sm font-semibold text-[#1F2A24]/75">
                    Address
                </h3>
                <ReviewRow label="Barangay" value={data.barangay} />
                <ReviewRow
                    label="City/Municipality"
                    value={data.city_municipality}
                />
                <ReviewRow label="Province" value={data.province} />
            </div>

            <div className="mb-4">
                <h3 className="mb-1 text-sm font-semibold text-[#1F2A24]/75">
                    Subjects
                </h3>
                <ReviewRow label="Enrolled in" value={subjectNames} />
            </div>

            <div className="mb-4">
                <h3 className="mb-1 text-sm font-semibold text-[#1F2A24]/75">
                    Documents
                </h3>
                <ReviewRow label="Form 138" value={data.form_138?.name} />
                <ReviewRow
                    label="PSA Birth Certificate"
                    value={data.birth_certificate?.name}
                />
                <ReviewRow
                    label="Good Moral Certificate"
                    value={data.good_moral_certificate?.name}
                />
            </div>

            <div className="mb-4">
                <h3 className="mb-1 text-sm font-semibold text-[#1F2A24]/75">
                    Billing
                </h3>
                <ReviewRow
                    label="Payment Option"
                    value={PAYMENT_OPTIONS[data.payment_option]?.label}
                />
                <ReviewRow label="Payment Schedule" value={planSummary} />
                <ReviewRow
                    label="Payment Method"
                    value={
                        { COUNTER: 'School Counter', GCASH: 'GCash' }[
                            data.payment_channel
                        ]
                    }
                />
                <div className="flex justify-between py-2 text-sm">
                    <span className="font-semibold text-[#1F2A24]">
                        Total Amount to Pay
                    </span>
                    <span className="text-base font-bold text-[#2F6F4E]">
                        {selectedGrade
                            ? formatCurrency(selectedGrade.tuition_fee)
                            : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}
