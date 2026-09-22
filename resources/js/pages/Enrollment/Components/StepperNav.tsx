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
        <div className="mb-8 flex justify-center overflow-x-auto">
            <ol className="flex min-w-max items-center">
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
                                className={`flex flex-col items-center ${
                                    isReachable
                                        ? 'cursor-pointer'
                                        : 'cursor-not-allowed'
                                }`}
                            >
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                                        isCompleted
                                            ? 'bg-[#2F6F4E] text-[#FBF8F2] hover:bg-[#25573E]'
                                            : isActive
                                              ? 'bg-[#E8A33D] text-[#1F2A24]'
                                              : 'bg-[#1F2A24]/10 text-[#1F2A24]/50'
                                    }`}
                                >
                                    {isCompleted ? '✓' : stepNumber}
                                </div>
                                <span
                                    className={`mt-1 text-xs whitespace-nowrap ${isActive ? 'font-semibold text-[#2F6F4E]' : 'text-[#1F2A24]/50'}`}
                                >
                                    {label}
                                </span>
                            </button>
                            {stepNumber < STEP_LABELS.length && (
                                <div
                                    className={`mx-2 h-0.5 w-8 ${isCompleted ? 'bg-[#2F6F4E]' : 'bg-[#1F2A24]/10'}`}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
