import { useForm } from '@inertiajs/react';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import type { StudentOption } from '../../StudentGrades/Components/StudentCombobox';

/**
 * Picks several students, or the whole class, to add to a grade sheet in
 * one go. Their grades are entered on the next page. Remount it for each
 * opening so it starts with everyone ticked.
 */
export default function AddStudentsDialog({
    gradeSheetId,
    students,
    open,
    onOpenChange,
}: {
    gradeSheetId: number;
    /** Students taking the subject who aren't on the sheet yet. */
    students: StudentOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [search, setSearch] = useState('');
    const { data, setData, post, processing, errors } = useForm<{
        enrollment_ids: number[];
    }>({
        // Usually the whole class is being added, so start with everyone.
        enrollment_ids: students.map((student) => student.enrollment_id),
    });

    const needle = search.trim().toLowerCase();
    const visibleStudents = needle
        ? students.filter(
              (student) =>
                  student.name.toLowerCase().includes(needle) ||
                  (student.lrn ?? '').includes(needle),
          )
        : students;

    const selected = new Set(data.enrollment_ids);
    const allSelected = selected.size === students.length;

    const toggle = (enrollmentId: number) =>
        setData(
            'enrollment_ids',
            selected.has(enrollmentId)
                ? data.enrollment_ids.filter((id) => id !== enrollmentId)
                : [...data.enrollment_ids, enrollmentId],
        );

    const toggleAll = () =>
        setData(
            'enrollment_ids',
            allSelected ? [] : students.map((student) => student.enrollment_id),
        );

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(gradeSheetRoutes.students.store.url(gradeSheetId));
    };

    const firstError =
        errors.enrollment_ids ??
        Object.entries(errors).find(([key]) =>
            key.startsWith('enrollment_ids.'),
        )?.[1];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-lg">
                <DialogHeader className="border-b border-[#1F2A24]/10 p-5">
                    <DialogTitle className="font-serif text-xl">
                        Add students
                    </DialogTitle>
                    <DialogDescription className="text-[#1F2A24]/65">
                        Students approved for this grade level and taking this
                        subject. You'll enter their grades next.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="space-y-3 border-b border-[#1F2A24]/10 p-4">
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
                                className="min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white py-2 pr-3 pl-9 text-base text-[#1F2A24] placeholder-[#1F2A24]/40 focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:text-sm"
                            />
                        </div>
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
                        className="min-h-0 flex-1 divide-y divide-[#1F2A24]/5 overflow-y-auto px-4"
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

                    <div className="border-t border-[#1F2A24]/10 p-4">
                        {firstError && (
                            <p
                                role="alert"
                                className="mb-3 text-sm text-[#C6473B]"
                            >
                                {firstError}
                            </p>
                        )}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p
                                aria-live="polite"
                                className="text-sm text-[#1F2A24]/65"
                            >
                                {selected.size} selected
                            </p>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || selected.size === 0}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#25573E] disabled:opacity-50"
                                >
                                    {processing && (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Add{' '}
                                    {selected.size === 1
                                        ? '1 student'
                                        : `${selected.size} students`}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
