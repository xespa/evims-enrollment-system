import { Check, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export const settingsInputClass =
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-base text-[#1F2A24] shadow-none placeholder:text-[#1F2A24]/40 focus-visible:border-[#2F6F4E] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/30 focus-visible:outline-none aria-[invalid=true]:border-[#C6473B] aria-[invalid=true]:ring-[#C6473B]/20 sm:text-sm';

/** A titled card holding one group of settings. */
export function SettingsSection({
    title,
    description,
    tone = 'default',
    children,
}: {
    title: string;
    description: string;
    tone?: 'default' | 'danger';
    children: ReactNode;
}) {
    return (
        <section
            className={`overflow-hidden rounded-2xl border bg-white ${
                tone === 'danger'
                    ? 'border-[#C6473B]/30'
                    : 'border-[#1F2A24]/10'
            }`}
        >
            <div
                className={`border-b px-6 py-4 ${
                    tone === 'danger'
                        ? 'border-[#C6473B]/20 bg-[#C6473B]/5'
                        : 'border-[#1F2A24]/10'
                }`}
            >
                <h2
                    className={`font-serif text-lg font-semibold ${
                        tone === 'danger' ? 'text-[#A3372D]' : 'text-[#1F2A24]'
                    }`}
                >
                    {title}
                </h2>
                <p className="mt-0.5 text-sm text-[#1F2A24]/70">
                    {description}
                </p>
            </div>
            {children}
        </section>
    );
}

/** A label, its control, and either its error or a hint below it. */
export function SettingsField({
    id,
    label,
    error,
    hint,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1.5 block text-sm font-medium text-[#1F2A24]/85"
            >
                {label}
            </label>
            {children}
            {error ? (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="mt-1.5 text-xs text-[#C6473B]"
                >
                    {error}
                </p>
            ) : (
                hint && (
                    <div className="mt-1.5 text-xs text-[#1F2A24]/60">
                        {hint}
                    </div>
                )
            )}
        </div>
    );
}

/**
 * The bottom bar of a settings form: what state the form is in on the
 * left, and the discard / save buttons on the right.
 */
export function SettingsFormFooter({
    isDirty,
    processing,
    recentlySuccessful,
    canSubmit = isDirty,
    submitLabel = 'Save changes',
    onDiscard,
}: {
    isDirty: boolean;
    processing: boolean;
    recentlySuccessful: boolean;
    canSubmit?: boolean;
    submitLabel?: string;
    onDiscard: () => void;
}) {
    return (
        <div className="flex flex-col-reverse gap-3 border-t border-[#1F2A24]/10 bg-[#FBF8F2]/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="min-h-5 text-sm text-[#1F2A24]/60">
                {recentlySuccessful && !isDirty ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#2F6F4E]">
                        <Check className="size-4" aria-hidden="true" />
                        Saved
                    </span>
                ) : (
                    isDirty && 'You have unsaved changes.'
                )}
            </p>

            <div className="flex gap-2 sm:justify-end">
                {isDirty && (
                    <button
                        type="button"
                        onClick={onDiscard}
                        disabled={processing}
                        className="min-h-11 flex-1 rounded-full border border-[#1F2A24]/15 bg-white px-5 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5 focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none disabled:opacity-50 sm:flex-none"
                    >
                        Discard
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!canSubmit || processing}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                    {processing && (
                        <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                        />
                    )}
                    {processing ? 'Saving…' : submitLabel}
                </button>
            </div>
        </div>
    );
}
