const STEP_LABELS = [
    'Student Info',
    'Address',
    'Parents',
    'Academic History',
    'Vital Info',
    'Subjects',
    'Billing',
    'Review',
];

export default function StepperNav({ currentStep }) {
    return (
        <div className="mb-8 overflow-x-auto">
            <ol className="flex min-w-max items-center">
                {STEP_LABELS.map((label, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <li key={label} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                        isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    {isCompleted ? '✓' : stepNumber}
                                </div>
                                <span className={`mt-1 text-xs whitespace-nowrap ${isActive ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                                    {label}
                                </span>
                            </div>
                            {stepNumber < STEP_LABELS.length && (
                                <div className={`mx-2 h-0.5 w-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
