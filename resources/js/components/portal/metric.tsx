import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A small summary card on the parent and student dashboards. */
export default function Metric({
    icon: Icon,
    label,
    value,
    emphasis = false,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    emphasis?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-surface p-4 shadow-sm">
            <span
                aria-hidden="true"
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    emphasis
                        ? 'bg-danger/10 text-danger-alert'
                        : 'bg-brand/10 text-brand-ink',
                )}
            >
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p
                    className={cn(
                        'truncate text-lg font-semibold tabular-nums',
                        emphasis ? 'text-danger-alert' : 'text-ink',
                    )}
                >
                    {value}
                </p>
                <p className="text-xs text-ink/65">{label}</p>
            </div>
        </div>
    );
}
