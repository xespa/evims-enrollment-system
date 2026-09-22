import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

const DOCUMENT_PATH_KEYS = [
    'form_138_path',
    'birth_certificate_path',
    'good_moral_path',
];

const LRN_PREFIX = '452501';

function countMissingDocuments(enrollment) {
    const verification = enrollment?.office_verification;
    return DOCUMENT_PATH_KEYS.filter((key) => !verification?.[key]).length;
}

function generateLrn() {
    let suffix = '';
    for (let i = 0; i < 8; i++) {
        suffix += Math.floor(Math.random() * 10);
    }
    return `${LRN_PREFIX}${suffix}`;
}

function AssignLrnCell({ studentId }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({
        lrn: '',
    });

    const toggleOpen = () => {
        setOpen((o) => !o);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.students.assignLrn', studentId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={toggleOpen}
                className="text-xs font-medium text-[#2F6F4E] hover:underline"
            >
                Assign LRN
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="min-w-[160px] space-y-1.5">
            <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                placeholder="452501XXXXXXXX"
                value={data.lrn}
                onChange={(e) =>
                    setData(
                        'lrn',
                        e.target.value.replace(/\D/g, '').slice(0, 14),
                    )
                }
                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-xs text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
            />
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setData('lrn', generateLrn())}
                    className="text-[11px] font-medium text-[#2F6F4E] hover:underline"
                >
                    Generate
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-[#2F6F4E] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="text-[11px] text-[#1F2A24]/40 hover:text-[#1F2A24]/70"
                >
                    Cancel
                </button>
            </div>
            {errors.lrn && (
                <p className="text-[11px] text-red-600">{errors.lrn}</p>
            )}
        </form>
    );
}

export default function Index({ students, gradeLevels, schoolYears, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [schoolYear, setSchoolYear] = useState(filters.school_year ?? '');
    const [gradeLevelId, setGradeLevelId] = useState(
        filters.grade_level_id ?? '',
    );

    const applyFilters = (overrides = {}) => {
        router.get(
            route('admin.students.index'),
            {
                search,
                school_year: schoolYear,
                grade_level_id: gradeLevelId,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    return (
        <>
            <Head title="Students" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Students
                        </h1>
                    </div>

                    {/* Search */}
                    <div className="mb-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex flex-wrap gap-3"
                        >
                            <input
                                type="text"
                                placeholder="Search by name or LRN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-w-[200px] flex-1 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />

                            <select
                                value={schoolYear}
                                onChange={(e) => {
                                    setSchoolYear(e.target.value);
                                    applyFilters({
                                        school_year: e.target.value,
                                    });
                                }}
                                className="rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            >
                                <option value="">All School Years</option>
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={gradeLevelId}
                                onChange={(e) => {
                                    setGradeLevelId(e.target.value);
                                    applyFilters({
                                        grade_level_id: e.target.value,
                                    });
                                }}
                                className="rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            >
                                <option value="">All Grade Levels</option>
                                {gradeLevels.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="rounded-full bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Student Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        LRN
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Grade Level
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        School Year
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Documents
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {students.data.map((student) => {
                                    const enrollment =
                                        student.latest_enrollment;
                                    const missingCount =
                                        countMissingDocuments(enrollment);

                                    return (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-[#2F6F4E]/5"
                                        >
                                            <td className="px-4 py-3 text-[#1F2A24]">
                                                {student.last_name},{' '}
                                                {student.first_name}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {student.lrn || (
                                                    <AssignLrnCell
                                                        studentId={
                                                            student.id
                                                        }
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment?.grade_level
                                                    ?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment?.school_year || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {enrollment ? (
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                                                    >
                                                        {
                                                            enrollment.enrollment_status
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-[#1F2A24]/30">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {enrollment ? (
                                                    missingCount > 0 ? (
                                                        <span className="rounded-full bg-[#E8A33D]/15 px-2.5 py-1 text-xs font-semibold text-[#a4670f]">
                                                            {missingCount}{' '}
                                                            missing
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                                            Complete
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[#1F2A24]/30">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {enrollment ? (
                                                    <Link
                                                        href={route(
                                                            'admin.enrollments.show',
                                                            enrollment.id,
                                                        )}
                                                        className="font-medium text-[#2F6F4E] hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                ) : (
                                                    <span className="text-[#1F2A24]/30">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {students.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-[#1F2A24]/40"
                                        >
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {students.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                                className={`rounded-full border px-3 py-1.5 text-sm ${
                                    link.active
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                        : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
