import { Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { StudentOption } from '../../StudentGrades/Components/StudentCombobox';

/**
 * A ticked list of students with "Select all" and, for longer lists, a
 * search by name or LRN. Used wherever students are put on a grade sheet.
 */
export default function StudentChecklist({
    students,
    selectedIds,
    onChange,
    listClassName,
}: {
    students: StudentOption[];
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    /** Sizing for the scrolling list, e.g. a max height. */
    listClassName?: string;
}) {
    const [search, setSearch] = useState('');
    const selected = new Set(selectedIds);
    const allSelected =
        students.length > 0 && selected.size === students.length;

    const needle = search.trim().toLowerCase();
    const visibleStudents = needle
        ? students.filter(
              (student) =>
                  student.name.toLowerCase().includes(needle) ||
                  (student.lrn ?? '').includes(needle),
          )
        : students;

    const toggle = (enrollmentId: number) =>
        onChange(
            selected.has(enrollmentId)
                ? selectedIds.filter((id) => id !== enrollmentId)
                : [...selectedIds, enrollmentId],
        );

    const toggleAll = () =>
        onChange(
            allSelected ? [] : students.map((student) => student.enrollment_id),
        );

    return (
        <div>
            <div className="space-y-2 border-b border-[#1F2A24]/10 pb-2">
                {students.length > 8 && (
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#1F2A24]/40"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or LRN"
                            aria-label="Search students"
                            className="min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white py-2 pr-3 pl-9 text-base text-[#1F2A24] placeholder-[#1F2A24]/40 focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:text-sm"
                        />
                    </div>
                )}
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm font-semibold text-[#1F2A24]">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate =
                                    selected.size > 0 && !allSelected;
                            }
                        }}
                        onChange={toggleAll}
                        className="h-4 w-4 accent-[#2F6F4E]"
                    />
                    Select all ({students.length})
                </label>
            </div>

            <ul
                aria-label="Students"
                className={cn(
                    'divide-y divide-[#1F2A24]/5 overflow-y-auto',
                    listClassName,
                )}
            >
                {visibleStudents.length === 0 ? (
                    <li className="py-6 text-center text-sm text-[#1F2A24]/60">
                        No student matches "{search}".
                    </li>
                ) : (
                    visibleStudents.map((student) => (
                        <li key={student.enrollment_id}>
                            <label className="flex min-h-12 cursor-pointer items-center gap-3 px-1 py-2">
                                <input
                                    type="checkbox"
                                    checked={selected.has(
                                        student.enrollment_id,
                                    )}
                                    onChange={() =>
                                        toggle(student.enrollment_id)
                                    }
                                    className="h-4 w-4 accent-[#2F6F4E]"
                                />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-[#1F2A24]">
                                        {student.name}
                                    </span>
                                    <span className="block text-xs text-[#1F2A24]/55">
                                        {student.lrn
                                            ? `LRN ${student.lrn}`
                                            : 'No LRN yet'}
                                    </span>
                                </span>
                            </label>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
