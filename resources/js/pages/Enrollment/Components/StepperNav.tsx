import { Check } from 'lucide-react';

export const STEP_LABELS = [
    'Student Info',
    'Address',
    'Parents',
    'Academic History',
    'Vital Info',
    'Subjects',
    'Documents',
    'Billing',
    'Review',
];

/** Steps with nothing required — they can be left blank and filled in later. */
export const OPTIONAL_STEPS = [3, 4, 5, 7];

type Props = {
    currentStep: number;
    maxStepReached: number;
    onStepClick?: (step: number) => void;
};

export default function StepperNav({
    currentStep,
    maxStepReached,
    onStepClick,
}: Props) {
    const total = STEP_LABELS.length;
    const progress = Math.round(((currentStep - 1) / (total - 1)) * 100);
    const isOptional = OPTIONAL_STEPS.includes(currentStep);

    return (
        <nav aria-label="Enrollment steps" className="mb-6">
            <p className="sr-only" aria-live="polite">
                Step {currentStep} of {total}: {STEP_LABELS[currentStep - 1]}
                {isOptional ? ' (optional)' : ''}
            </p>

            {/* Progress summary */}
            <div
                aria-hidden="true"
                className="mb-3 flex items-end justify-between gap-3"
            >
                <p className="text-sm text-ink/70">
                    Step{' '}
                    <span className="font-semibold text-ink">
                        {currentStep}
                    </span>{' '}
                    of {total}
                    <span className="mx-1.5 text-ink/30">·</span>
                    <span className="font-semibold text-brand-ink">
                        {STEP_LABELS[currentStep - 1]}
                    </span>
                    {isOptional && (
                        <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/60">
                            Optional
                        </span>
                    )}
                </p>
                <p className="text-xs font-semibold text-ink/55 tabular-nums">
                    {progress}%
                </p>
            </div>
            <div
                className="mb-4 h-1.5 overflow-hidden rounded-full bg-ink/10"
                role="progressbar"
                aria-label="Application progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
            >
                <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-[#3E8A63] transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.max(progress, 4)}%` }}
                />
            </div>

            {/* Step list — hidden on phones, where the summary above is enough. */}
            <div className="hidden overflow-x-auto pb-1 sm:block">
                <ol className="mx-auto flex w-max items-start">
                    {STEP_LABELS.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === currentStep;
                        const isReachable = stepNumber <= maxStepReached;
                        const isCompleted = isReachable && !isActive;
                        const isStepOptional =
                            OPTIONAL_STEPS.includes(stepNumber);

                        return (
                            <li key={label} className="flex items-start">
                                <button
                                    type="button"
                                    onClick={() =>
                                        isReachable &&
                                        !isActive &&
                                        onStepClick?.(stepNumber)
                                    }
                                    disabled={!isReachable}
                                    aria-current={isActive ? 'step' : undefined}
                                    aria-label={`Step ${stepNumber}: ${label}${isStepOptional ? ', optional' : ''}${isCompleted ? ' (visited)' : ''}`}
                                    className={`group flex w-[4.75rem] flex-col items-center rounded-lg px-0.5 py-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                                        isReachable && !isActive
                                            ? 'cursor-pointer'
                                            : isActive
                                              ? 'cursor-default'
                                              : 'cursor-not-allowed'
                                    }`}
                                >
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                            isCompleted
                                                ? 'bg-brand text-on-brand group-hover:scale-105 group-hover:bg-brand-deep'
                                                : isActive
                                                  ? 'bg-warn text-ink ring-4 ring-warn/25'
                                                  : 'border border-dashed border-ink/20 bg-surface text-ink/50'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check
                                                className="h-4 w-4"
                                                strokeWidth={3}
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            stepNumber
                                        )}
                                    </span>
                                    <span
                                        className={`mt-1.5 text-center text-[11px] leading-tight ${
                                            isActive
                                                ? 'font-semibold text-brand-ink'
                                                : isCompleted
                                                  ? 'text-ink/75'
                                                  : 'text-ink/50'
                                        }`}
                                    >
                                        {label}
                                    </span>
                                    {isStepOptional && (
                                        <span className="text-[10px] text-ink/40">
                                            Optional
                                        </span>
                                    )}
                                </button>
                                {stepNumber < STEP_LABELS.length && (
                                    <div
                                        aria-hidden="true"
                                        className={`mt-4 h-0.5 w-4 lg:w-6 ${stepNumber < currentStep ? 'bg-brand' : 'bg-ink/10'}`}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
}
