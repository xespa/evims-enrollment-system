function ReviewRow({ label, value }) {
    return (
        <div className="flex justify-between border-b border-gray-100 py-1.5 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800">{value || '—'}</span>
        </div>
    );
}

export default function ReviewStep({ data, gradeLevels }) {
    const gradeName = gradeLevels.find((g) => String(g.id) === String(data.grade_level_id))?.name;
    const subjectNames = (gradeLevels.find((g) => String(g.id) === String(data.grade_level_id))?.subjects ?? [])
        .filter((s) => (data.subject_ids ?? []).includes(s.id))
        .map((s) => s.name)
        .join(', ');

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Review Your Application</h2>
            <p className="text-sm text-gray-500 mb-4">Please check everything before submitting.</p>

            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Student</h3>
                <ReviewRow label="Name" value={`${data.last_name}, ${data.first_name} ${data.middle_name ?? ''}`} />
                <ReviewRow label="Grade Level" value={gradeName} />
                <ReviewRow label="Student Type" value={data.student_type} />
                <ReviewRow label="School Year" value={data.school_year} />
                <ReviewRow label="Session" value={data.session_time_preference} />
            </div>

            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Address</h3>
                <ReviewRow label="Barangay" value={data.barangay} />
                <ReviewRow label="City/Municipality" value={data.city_municipality} />
                <ReviewRow label="Province" value={data.province} />
            </div>

            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Subjects</h3>
                <ReviewRow label="Enrolled in" value={subjectNames} />
            </div>

            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Billing</h3>
                <ReviewRow label="Payment Option" value={data.payment_option} />
                <ReviewRow label="Contract File" value={data.scanned_contract?.name} />
            </div>
        </div>
    );
}
