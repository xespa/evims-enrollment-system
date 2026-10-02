import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

interface UploadDocumentFormProps {
    enrollmentId: number;
    documentType: string;
    documentLabel: string;
    hasFile: boolean;
}

/**
 * Lets the registrar upload a document on the parent's behalf — e.g. a
 * returning student's report card. It's saved as already verified.
 */
export default function UploadDocumentForm({
    enrollmentId,
    documentType,
    documentLabel,
    hasFile,
}: UploadDocumentFormProps) {
    const [open, setOpen] = useState(false);
    const { setData, post, processing, errors, reset, clearErrors } = useForm<{
        file: File | null;
    }>({ file: null });

    const toggleOpen = () => {
        setOpen((o) => !o);
        reset();
        clearErrors();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(
            route('admin.enrollments.documents.store', [
                enrollmentId,
                documentType,
            ]),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            },
        );
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={toggleOpen}
                className="ml-4 min-h-8 rounded-full px-2 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
            >
                {hasFile ? 'Replace file' : 'Upload file'}
            </button>
        );
    }

    const inputId = `upload-${documentType}`;

    return (
        <form
            onSubmit={submit}
            className="mt-2 w-full space-y-2 rounded-lg bg-[#2F6F4E]/5 p-3"
        >
            <label
                htmlFor={inputId}
                className="block text-xs font-medium text-[#1F2A24]/80"
            >
                {documentLabel} (PDF, JPG or PNG, up to 10 MB)
            </label>
            <input
                id={inputId}
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png"
                aria-invalid={errors.file ? true : undefined}
                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-[#1F2A24] file:mr-2 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#2F6F4E]"
            />
            {errors.file && (
                <p role="alert" className="text-xs text-[#C6473B]">
                    {errors.file}
                </p>
            )}
            <p className="text-xs text-[#1F2A24]/65">
                The file is marked as verified once uploaded.
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="min-h-8 rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-50"
                >
                    {processing ? 'Uploading…' : 'Upload'}
                </button>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="min-h-8 rounded-full px-1.5 text-xs text-[#1F2A24]/70 hover:text-[#1F2A24]"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
