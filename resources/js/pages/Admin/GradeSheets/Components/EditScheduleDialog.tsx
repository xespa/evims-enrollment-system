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
import ScheduleFields from './ScheduleFields';
import type { GradeSheetSummary, ScheduleData } from './types';

/**
 * Sets when a grade sheet's class meets. Remount it for each opening so it
 * starts from the saved schedule.
 */
export default function EditScheduleDialog({
    gradeSheet,
    open,
    onOpenChange,
}: {
    gradeSheet: GradeSheetSummary;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors } = useForm<ScheduleData>({
        schedule_days: gradeSheet.schedule_days,
        start_time: gradeSheet.start_time ?? '',
        end_time: gradeSheet.end_time ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(gradeSheetRoutes.update.url(gradeSheet.id), {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl border-ink/10 bg-surface text-ink sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">
                        Class schedule
                    </DialogTitle>
                    <DialogDescription className="text-ink/65">
                        When {gradeSheet.subject} meets. It's printed on the
                        grade sheet.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <ScheduleFields
                        data={data}
                        onChange={setData}
                        errors={errors}
                    />

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-deep disabled:opacity-50"
                        >
                            {processing && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Save schedule
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
