import { Check } from 'lucide-react';

const STEP_LABELS = [
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

export default function StepperNav({ currentStep, maxStepReached, onStepClick }) {
    return (
        <nav aria-label="Enrollment steps" className="mb-8">
            <p className="sr-only" aria-live="polite">
                Step {currentStep} of {STEP_LABELS.length}: {STEP_LABELS[currentStep - 1]}
            </p>
            <p aria-hidden="true" className="mb-3 text-center text-sm font-medium text-[#1F2A24]/70 sm:hidden">
                Step {currentStep} of {STEP_LABELS.length} ·{' '}
                <span className="font-semibold text-[#2F6F4E]">
                    {STEP_LABELS[currentStep - 1]}
                </span>
            </p>
            {/* mx-auto (not justify-center) so the start of the list stays
                reachable when it overflows and scrolls on narrow screens. */}
            <div className="overflow-x-auto pb-1">
                <ol className="mx-auto flex w-max items-center gap-1 sm:gap-0">
                    {STEP_LABELS.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === currentStep;
                        const isReachable = stepNumber <= (maxStepReached ?? currentStep);
                        const isCompleted = isReachable && !isActive;

                        return (
                            <li key={label} className="flex items-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        isReachable &&
                                        !isActive &&
                                        onStepClick?.(stepNumber)
                                    }
                                    disabled={!isReachable}
                                    aria-current={isActive ? 'step' : undefined}
                                    aria-label={`Step ${stepNumber}: ${label}${isCompleted ? ' (visited)' : ''}`}
                                    className={`flex flex-col items-center rounded-lg px-0.5 py-1 sm:min-w-11 sm:px-1 ${
                                        isReachable
                                            ? 'cursor-pointer'
                                            : 'cursor-not-allowed'
                                    }`}
                                >
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors sm:h-8 sm:w-8 ${
                                            isCompleted
                                                ? 'bg-[#2F6F4E] text-[#FBF8F2] hover:bg-[#25573E]'
                                                : isActive
                                                  ? 'bg-[#E8A33D] text-[#1F2A24] ring-4 ring-[#E8A33D]/25'
                                                  : 'bg-[#1F2A24]/10 text-[#1F2A24]/65'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                                        ) : (
                                            stepNumber
                                        )}
                                    </span>
                                    <span
                                        className={`mt-1 hidden text-xs whitespace-nowrap sm:block ${isActive ? 'font-semibold text-[#2F6F4E]' : 'text-[#1F2A24]/65'}`}
                                    >
                                        {label}
                                    </span>
                                </button>
                                {stepNumber < STEP_LABELS.length && (
                                    <div
                                        aria-hidden="true"
                                        className={`mx-2 hidden h-0.5 w-8 sm:block ${isCompleted ? 'bg-[#2F6F4E]' : 'bg-[#1F2A24]/10'}`}
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
