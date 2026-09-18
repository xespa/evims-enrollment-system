import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ students, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(
            route('admin.students.index'),
            { search },
            { preserveState: true, replace: true },
        );
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
                                        Contact No.
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
                                    const contact =
                                        student.parent_profile
                                            ?.father_mobile_no ||
                                        student.parent_profile
                                            ?.mother_mobile_no;

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
                                                {student.lrn || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment?.grade_level
                                                    ?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment?.school_year || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {contact || '—'}
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
                                            colSpan={6}
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
