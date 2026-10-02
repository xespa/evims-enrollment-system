import { CircleCheck, IdCard } from 'lucide-react';

/** A DepEd LRN (12 digits) or one issued by EVIMS (14 digits). */
export const LRN_LENGTHS = [12, 14];

export const isValidLrn = (value: string): boolean =>
    /^\d+$/.test(value) && LRN_LENGTHS.includes(value.length);

type Props = {
    value: string;
    onChange: (name: string, value: string) => void;
    error?: string;
    studentType: string;
};

/**
 * The LRN field, with instructions for transferees, who bring the 12-digit
 * LRN DepEd already gave them — it becomes the student's LRN here too.
 */
export default function LrnInput({
    value,
    onChange,
    error,
    studentType,
}: Props) {
    const isTransferee = studentType === 'WITH_LRN';
    const digits = value ?? '';
    const isComplete = isValidLrn(digits);
    const hintId = 'lrn-hint';
    const errorId = 'lrn-error';

    const status = isComplete
        ? digits.length === 12
            ? 'DepEd LRN — it will be saved as your child’s LRN.'
            : 'EVIMS-issued LRN.'
        : digits.length > 0
          ? `${digits.length} digits entered — a DepEd LRN has 12.`
          : null;

    return (
        <div className="mb-4">
            <label
                htmlFor="lrn"
                className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80"
            >
                LRN (Learner Reference Number){' '}
                {isTransferee && (
                    <span className="text-[#C6473B]" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            <div
                id={hintId}
                className="mb-2 flex gap-2.5 rounded-xl border border-[#2F6F4E]/15 bg-[#2F6F4E]/5 px-3 py-2.5 text-[13px] leading-snug text-[#1F2A24]/80"
            >
                <IdCard
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                    aria-hidden="true"
                />
                {isTransferee ? (
                    <p>
                        If your child is transferring from another school,
                        please enter the LRN they already have. We’ll keep the
                        same LRN for them here, so there’s no need to apply for
                        a new one.
                    </p>
                ) : (
                    <p>
                        Returning to EVIMS? Enter your child’s LRN — the
                        12-digit one from DepEd, or the 14-digit one EVIMS
                        issued. Leave it blank if you don’t have it; the school
                        can look it up.
                    </p>
                )}
            </div>

            <div className="relative">
                <input
                    id="lrn"
                    name="lrn"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="e.g. 45250112345678"
                    maxLength={14}
                    value={digits}
                    onChange={(e) =>
                        onChange(
                            'lrn',
                            e.target.value.replace(/\D/g, '').slice(0, 14),
                        )
                    }
                    aria-required={isTransferee || undefined}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={[
                        hintId,
                        error ? errorId : 'lrn-status',
                    ].join(' ')}
                    className={`min-h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm tracking-wider text-[#1F2A24] tabular-nums placeholder-[#1F2A24]/35 shadow-sm transition-colors focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none ${
                        error
                            ? 'border-[#C6473B] bg-[#C6473B]/[0.03]'
                            : isComplete
                              ? 'border-[#2F6F4E]/50'
                              : 'border-[#1F2A24]/15'
                    }`}
                />
                {isComplete && (
                    <CircleCheck
                        className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[#2F6F4E]"
                        aria-hidden="true"
                    />
                )}
            </div>

            {error ? (
                <p id={errorId} className="mt-1 text-sm text-[#C6473B]">
                    {error}
                </p>
            ) : (
                status && (
                    <p
                        id="lrn-status"
                        aria-live="polite"
                        className={`mt-1 text-xs ${isComplete ? 'text-[#2F6F4E]' : 'text-[#1F2A24]/60'}`}
                    >
                        {status}
                    </p>
                )
            )}
        </div>
    );
}
