import { Info } from 'lucide-react';

// Highlighted instructions shown under a step's heading — styled as a
// callout rather than plain muted text so applicants don't skim past it.
export default function StepGuide({ children, className = 'mb-5' }) {
    return (
        <div
            role="note"
            className={`flex items-start gap-3 rounded-xl border border-l-4 border-[#E8A33D]/40 border-l-[#E8A33D] bg-[#E8A33D]/10 px-4 py-3 text-sm font-medium text-[#1F2A24] ${className}`}
        >
            <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-[#B7771C]"
                aria-hidden="true"
            />
            <div>{children}</div>
        </div>
    );
}
