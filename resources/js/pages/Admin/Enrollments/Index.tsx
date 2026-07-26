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
    const [gradeLevelId, setGradeLevelId] = useState(filters.grade_level_id ?? '');

    const applyFilters = (overrides = {}) => {
        router.get(
            route('admin.enrollments.index'),
            {
                search,
                status,
                grade_level_id: gradeLevelId,
                ...overrides,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    return (
        <>
            <Head title="Enrollment Applications" />

            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Enrollment Applications</h1>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
                            <input
                                type="text"
                                placeholder="Search by name or LRN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 min-w-[200px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />

                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                                    applyFilters({ grade_level_id: e.target.value });
                                }}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">All Grade Levels</option>
                                {gradeLevels.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Student Name</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Grade Level</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">School Year</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Date Applied</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {enrollments.data.map((enrollment) => (
                                    <tr key={enrollment.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900">
                                            {enrollment.student.last_name}, {enrollment.student.first_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{enrollment.grade_level.name}</td>
                                        <td className="px-4 py-3 text-gray-700">{enrollment.school_year}</td>
                                        <td className="px-4 py-3 text-gray-700">{enrollment.date_of_application}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}>
                                                {enrollment.enrollment_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('admin.enrollments.show', enrollment.id)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}

                                {enrollments.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
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
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
