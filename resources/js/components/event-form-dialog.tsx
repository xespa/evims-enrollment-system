import { useForm } from '@inertiajs/react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type SchoolEvent = {
    id: number;
    title: string;
    tag: string | null;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    description: string | null;
    image_path: string | null;
};

type Props = {
    /** The event being edited, or null to create a new one. */
    event: SchoolEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const inputClass =
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-base text-[#1F2A24] placeholder-[#1F2A24]/40 focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] sm:text-sm';

function Field({
    id,
    label,
    required = false,
    error,
    hint,
    className = '',
    children,
}: {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={className}>
            <label
                htmlFor={id}
                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
            >
                {label}{' '}
                {required && (
                    <span className="text-[#C6473B]" aria-hidden="true">
                        *
                    </span>
                )}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="mt-1 text-xs text-[#C6473B]">
                    {error}
                </p>
            ) : (
                hint && <p className="mt-1 text-xs text-[#1F2A24]/55">{hint}</p>
            )}
        </div>
    );
}

function formValues(event: SchoolEvent | null) {
    return {
        title: event?.title ?? '',
        tag: event?.tag ?? '',
        // The date comes back as a full timestamp; the date input wants
        // just "YYYY-MM-DD".
        event_date: event?.event_date?.slice(0, 10) ?? '',
        start_time: event?.start_time ?? '',
        end_time: event?.end_time ?? '',
        location: event?.location ?? '',
        description: event?.description ?? '',
        image: null as File | null,
    };
}

/**
 * Creates or edits an event in a modal over the events list. The image
 * shows as a preview (the new file if one was picked, else the current one).
 */
export default function EventFormDialog({ event, open, onOpenChange }: Props) {
    const isEditing = event !== null;
    const idPrefix = useId();
    const id = (field: string) => `${idPrefix}-${field}`;

    const {
        data,
        setData,
        post,
        transform,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm(formValues(event));

    // Each time the dialog opens, start from the chosen event (or blank).
    useEffect(() => {
        if (open) {
            clearErrors();
            setData(formValues(event));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, event?.id]);

    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const newImageUrl = useMemo(
        () => (data.image ? URL.createObjectURL(data.image) : null),
        [data.image],
    );
    useEffect(
        () => () => {
            if (newImageUrl) {
                URL.revokeObjectURL(newImageUrl);
            }
        },
        [newImageUrl],
    );
    const previewUrl =
        newImageUrl ??
        (event?.image_path ? `/storage/${event.image_path}` : null);

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => close(false),
        };

        if (isEditing) {
            // A file upload has to go as POST; Laravel reads the real
            // method from _method.
            transform((values) => ({ ...values, _method: 'patch' }));
            post(route('admin.events.update', event.id), options);
        } else {
            transform((values) => values);
            post(route('admin.events.store'), options);
        }
    };

    const pickImage = (file: File | undefined | null) => {
        setData('image', file ?? null);
    };

    const invalid = (field: keyof typeof errors) =>
        errors[field] ? true : undefined;
    const describedBy = (field: keyof typeof errors) =>
        errors[field] ? `${id(field)}-error` : undefined;

    const text = (
        field: 'title' | 'tag' | 'start_time' | 'end_time' | 'location',
    ) => ({
        id: id(field),
        value: data[field],
        onChange: (e: ChangeEvent<HTMLInputElement>) =>
            setData(field, e.target.value),
        'aria-invalid': invalid(field),
        'aria-describedby': describedBy(field),
        className: inputClass,
    });

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-2xl">
                <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            {isEditing ? 'Edit Event' : 'New Event'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#1F2A24]/65">
                            {isEditing
                                ? 'Changes show on the public Events page right away.'
                                : 'It will show on the public Events page once saved.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-6">
                        {/* Image: preview + drop zone */}
                        <div className="sm:col-span-6">
                            <p className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                Image
                            </p>
                            <label
                                htmlFor={id('image')}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDraggingOver(true);
                                }}
                                onDragLeave={() => setIsDraggingOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDraggingOver(false);
                                    pickImage(e.dataTransfer.files[0]);
                                }}
                                className={`group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                                    isDraggingOver
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E]/5'
                                        : errors.image
                                          ? 'border-[#C6473B]/60'
                                          : 'border-[#1F2A24]/15 hover:border-[#2F6F4E]/50 hover:bg-[#2F6F4E]/[0.03]'
                                }`}
                            >
                                {previewUrl ? (
                                    <>
                                        <img
                                            src={previewUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3 text-sm font-medium text-white">
                                            {data.image
                                                ? data.image.name
                                                : 'Click or drop a file to replace'}
                                        </span>
                                    </>
                                ) : (
                                    <span className="flex flex-col items-center gap-2 px-4 text-center text-sm text-[#1F2A24]/60">
                                        <ImagePlus
                                            className="h-7 w-7 text-[#2F6F4E]"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            <span className="font-semibold text-[#2F6F4E]">
                                                Choose an image
                                            </span>{' '}
                                            or drop it here
                                        </span>
                                        <span className="text-xs">
                                            JPG, PNG or WebP, up to 4 MB
                                        </span>
                                    </span>
                                )}
                                <input
                                    id={id('image')}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) =>
                                        pickImage(e.target.files?.[0])
                                    }
                                    aria-invalid={invalid('image')}
                                    aria-describedby={describedBy('image')}
                                    className="sr-only"
                                />
                            </label>
                            {data.image && (
                                <button
                                    type="button"
                                    onClick={() => pickImage(null)}
                                    className="mt-1.5 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[#1F2A24]/65 hover:text-[#C6473B]"
                                >
                                    <X
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                    {isEditing && event.image_path
                                        ? 'Keep the current image'
                                        : 'Remove this image'}
                                </button>
                            )}
                            {errors.image && (
                                <p
                                    id={`${id('image')}-error`}
                                    className="mt-1 text-xs text-[#C6473B]"
                                >
                                    {errors.image}
                                </p>
                            )}
                        </div>

                        <Field
                            id={id('title')}
                            label="Title"
                            required
                            error={errors.title}
                            className="sm:col-span-4"
                        >
                            <input type="text" {...text('title')} />
                        </Field>

                        <Field
                            id={id('tag')}
                            label="Tag"
                            error={errors.tag}
                            hint="e.g. Academic, Sports"
                            className="sm:col-span-2"
                        >
                            <input type="text" {...text('tag')} />
                        </Field>

                        <Field
                            id={id('event_date')}
                            label="Date"
                            required
                            error={errors.event_date}
                            className="sm:col-span-2"
                        >
                            <input
                                id={id('event_date')}
                                type="date"
                                value={data.event_date}
                                onChange={(e) =>
                                    setData('event_date', e.target.value)
                                }
                                aria-invalid={invalid('event_date')}
                                aria-describedby={describedBy('event_date')}
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            id={id('start_time')}
                            label="Start Time"
                            error={errors.start_time}
                            className="sm:col-span-2"
                        >
                            <input
                                type="text"
                                placeholder="8:00 AM"
                                {...text('start_time')}
                            />
                        </Field>

                        <Field
                            id={id('end_time')}
                            label="End Time"
                            error={errors.end_time}
                            className="sm:col-span-2"
                        >
                            <input
                                type="text"
                                placeholder="12:00 PM"
                                {...text('end_time')}
                            />
                        </Field>

                        <Field
                            id={id('location')}
                            label="Location"
                            error={errors.location}
                            className="sm:col-span-6"
                        >
                            <input
                                type="text"
                                placeholder="e.g. School gymnasium"
                                {...text('location')}
                            />
                        </Field>

                        <Field
                            id={id('description')}
                            label="Description"
                            error={errors.description}
                            className="sm:col-span-6"
                        >
                            <textarea
                                id={id('description')}
                                rows={4}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                aria-invalid={invalid('description')}
                                aria-describedby={describedBy('description')}
                                className={`${inputClass} resize-y`}
                            />
                        </Field>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 px-6 py-4 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="min-h-11 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-medium hover:bg-[#1F2A24]/5"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            type="submit"
                            disabled={processing}
                            aria-busy={processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-60"
                        >
                            {processing && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            {processing
                                ? 'Saving...'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Create Event'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
