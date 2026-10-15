import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
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
import StudentChecklist from './StudentChecklist';

/**
 * Picks several students, or the whole class, to add to a grade sheet in
 * one go. Their grades are entered in the sheet's table. Remount it for
 * each opening so it starts with everyone ticked.
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
    const { data, setData, post, processing, errors } = useForm<{
        enrollment_ids: number[];
    }>({
        // Usually the whole class is being added, so start with everyone.
        enrollment_ids: students.map((student) => student.enrollment_id),
    });

    const selectedCount = data.enrollment_ids.length;

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
                        subject. You'll enter their grades in the table.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <StudentChecklist
                            students={students}
                            selectedIds={data.enrollment_ids}
                            onChange={(ids) => setData('enrollment_ids', ids)}
                        />
                    </div>

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
                                {selectedCount} selected
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
                                    disabled={processing || selectedCount === 0}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#25573E] disabled:opacity-50"
                                >
                                    {processing && (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Add{' '}
                                    {selectedCount === 1
                                        ? '1 student'
                                        : `${selectedCount} students`}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
