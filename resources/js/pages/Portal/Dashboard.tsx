import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function Dashboard({ enrollments }) {
    const { props } = usePage();

    const cancel = (enrollmentId) => {
        if (!confirm('Cancel this application?')) return;
        router.post(route('portal.enrollments.cancel', enrollmentId), {}, { preserveScroll: true });
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            <Head title="My Applications" />
            <h1 className="mb-6 font-serif text-2xl font-semibold text-[#1F2A24]">My Applications</h1>

            {props.flash?.success && (
                <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {props.flash.success}
                </div>
            )}

            <div className="space-y-4">
                {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-lg border border-[#1F2A24]/10 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#1F2A24]">
                                    {enrollment.student.first_name} {enrollment.student.last_name}
                                </p>
                                <p className="text-sm text-[#1F2A24]/60">
                                    {enrollment.grade_level.name} · SY {enrollment.school_year}
                                </p>
                            </div>
                            {enrollment.cancelled_at ? (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">CANCELLED</span>
                            ) : (
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}>
                                    {enrollment.enrollment_status}
                                </span>
                            )}
                        </div>

                        <div className="mt-4 flex gap-3">
                            <a href={enrollment.payment_url} className="text-sm font-medium text-[#2F6F4E] hover:underline">
                                View / Pay Tuition →
                            </a>
                            {!enrollment.cancelled_at && enrollment.enrollment_status === 'PENDING' && (
                                <Button variant="outline" size="sm" onClick={() => cancel(enrollment.id)}>
                                    Cancel Application
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {enrollments.length === 0 && (
                    <p className="text-sm text-[#1F2A24]/50">No applications linked to this account yet.</p>
                )}
            </div>
        </div>
    );
}
