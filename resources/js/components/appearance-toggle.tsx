import { Moon, Sun } from 'lucide-react';
import type { ResolvedAppearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';

const MODES: { value: ResolvedAppearance; label: string; icon: typeof Sun }[] =
    [
        { value: 'light', label: 'Light mode', icon: Sun },
        { value: 'dark', label: 'Dark mode', icon: Moon },
    ];

export default function AppearanceToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div
            role="group"
            aria-label="Colour theme"
            className="flex items-center gap-0.5 rounded-full border border-ink/10 bg-surface p-1"
        >
            {MODES.map(({ value, label, icon: Icon }) => {
                const isActive = resolvedAppearance === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        aria-pressed={isActive}
                        aria-label={label}
                        title={label}
                        className={`flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none ${
                            isActive
                                ? 'bg-ink/10 text-ink'
                                : 'text-ink/55 hover:bg-ink/5 hover:text-ink'
                        }`}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                    </button>
                );
            })}
        </div>
    );
}
