import { Check, X } from 'lucide-react';
import { missingDocuments } from '@/lib/portal-enrollment';
import { cn } from '@/lib/utils';
import type { PortalEnrollment } from '@/types/portal';

type StepState = 'done' | 'current' | 'upcoming' | 'failed';

type Step = { label: string; state: StepState };

function stepsFor(enrollment: PortalEnrollment): Step[] {
    const status = enrollment.enrollment_status;
    const isApproved = status === 'APPROVED';
    const hasMissingDocuments = missingDocuments(enrollment).length > 0;
    const isFullyPaid =
        enrollment.remaining_balance !== null &&
        enrollment.remaining_balance <= 0;

    const documents: StepState =
        isApproved || !hasMissingDocuments ? 'done' : 'current';

    const review: StepState =
        status === 'REJECTED'
            ? 'failed'
            : isApproved
              ? 'done'
              : hasMissingDocuments
                ? 'upcoming'
                : 'current';

    const payment: StepState = !isApproved
        ? 'upcoming'
        : isFullyPaid
          ? 'done'
          : 'current';

    return [
        { label: 'Submitted', state: 'done' },
        { label: 'Documents', state: documents },
        {
            label: status === 'REJECTED' ? 'Not approved' : 'Review',
            state: review,
        },
        { label: 'Tuition', state: payment },
    ];
}

const STATE_LABELS: Record<StepState, string> = {
    done: 'completed',
    current: 'in progress',
    upcoming: 'not started',
    failed: 'not approved',
};

/** A compact tracker of where an application is in the enrollment process. */
export default function ApplicationProgress({
    enrollment,
}: {
    enrollment: PortalEnrollment;
}) {
    const steps = stepsFor(enrollment);

    return (
        <ol
            aria-label="Application progress"
            className="grid grid-cols-4 gap-1"
        >
            {steps.map((step, index) => (
                <li
                    key={step.label}
                    aria-current={step.state === 'current' ? 'step' : undefined}
                    className="flex flex-col gap-1.5"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'h-1.5 rounded-full',
                            step.state === 'done' && 'bg-[#2F6F4E]',
                            step.state === 'current' && 'bg-[#E8A33D]',
                            step.state === 'upcoming' && 'bg-[#1F2A24]/10',
                            step.state === 'failed' && 'bg-[#C6473B]',
                        )}
                    />
                    <span
                        className={cn(
                            'flex items-center gap-1 text-[11px] leading-tight font-medium sm:text-xs',
                            step.state === 'upcoming'
                                ? 'text-[#1F2A24]/50'
                                : 'text-[#1F2A24]/80',
                            step.state === 'failed' && 'text-[#A83A30]',
                        )}
                    >
                        {step.state === 'done' && (
                            <Check
                                className="hidden h-3 w-3 shrink-0 text-[#2F6F4E] sm:block"
                                aria-hidden="true"
                            />
                        )}
                        {step.state === 'failed' && (
                            <X
                                className="hidden h-3 w-3 shrink-0 sm:block"
                                aria-hidden="true"
                            />
                        )}
                        <span>
                            <span className="sr-only">Step {index + 1}: </span>
                            {step.label}
                            <span className="sr-only">
                                {' '}
                                ({STATE_LABELS[step.state]})
                            </span>
                        </span>
                    </span>
                </li>
            ))}
        </ol>
    );
}
