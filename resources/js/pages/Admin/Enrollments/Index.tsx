import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function Index({ enrollments, gradeLevels, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [gradeLevelId, setGradeLevelId] = useState(
        filters.grade_level_id ?? '',
    );

    const applyFilters = (overrides = {}) => {
        router.get(
            route('admin.enrollments.index'),
            {
                search,
                status,
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
            <Head title="Enrollment Applications" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Enrollment Applications
                        </h1>
                    </div>

                    {/* Filters */}
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
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
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
                                        Grade Level
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        School Year
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Date Applied
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {enrollments.data.map((enrollment) => (
                                    <tr
                                        key={enrollment.id}
                                        className="hover:bg-[#2F6F4E]/5"
                                    >
                                        <td className="px-4 py-3 text-[#1F2A24]">
                                            {enrollment.student.last_name},{' '}
                                            {enrollment.student.first_name}
                                        </td>
                                        <td className="px-4 py-3 text-[#1F2A24]/70">
                                            {enrollment.grade_level.name}
                                        </td>
                                        <td className="px-4 py-3 text-[#1F2A24]/70">
                                            {enrollment.school_year}
                                        </td>
                                        <td className="px-4 py-3 text-[#1F2A24]/70">
                                            {enrollment.date_of_application}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                                            >
                                                {enrollment.enrollment_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route(
                                                    'admin.enrollments.show',
                                                    enrollment.id,
                                                )}
                                                className="font-medium text-[#2F6F4E] hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}

                                {enrollments.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-[#1F2A24]/40"
                                        >
                                            No applications found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {enrollments.links.map((link, i) => (
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
