import { Link, setLayoutProps } from '@inertiajs/react';
import { BookOpen, ShieldCheck, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useStaffAbilities } from '@/hooks/use-staff-abilities';
import admin from '@/routes/admin';

type SettingsTab = {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
    /** Only for teachers, who keep a list of their subjects. */
    teachersOnly?: boolean;
};

const TABS: SettingsTab[] = [
    {
        label: 'Profile',
        description: 'Name, email, and account',
        href: admin.settings.profile.edit.url(),
        icon: UserRound,
    },
    {
        label: 'Security',
        description: 'Password and two-factor',
        href: admin.settings.security.edit.url(),
        icon: ShieldCheck,
    },
    {
        label: 'Subjects',
        description: 'The subjects you teach',
        href: admin.settings.subjects.edit.url(),
        icon: BookOpen,
        teachersOnly: true,
    },
];

/**
 * Page frame shared by the admin settings pages: the top-bar title, the tab
 * list (a sidebar on desktop, a segmented control on mobile), and the
 * content column.
 */
export default function AdminSettingsShell({
    children,
}: {
    children: ReactNode;
}) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const can = useStaffAbilities();
    const tabs = TABS.filter((tab) => !tab.teachersOnly || can.teachSubjects);
    setLayoutProps({ title: 'Settings' });

    return (
        <div className="min-h-full bg-cream px-4 py-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                    <aside className="w-full lg:sticky lg:top-6 lg:w-60 lg:shrink-0 lg:self-start">
                        <nav
                            aria-label="Settings"
                            className="grid grid-cols-2 gap-1 rounded-xl border border-ink/10 bg-surface p-1 lg:flex lg:flex-col lg:gap-1 lg:p-2"
                        >
                            {tabs.map((tab) => {
                                const isActive = isCurrentOrParentUrl(tab.href);
                                const Icon = tab.icon;

                                return (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        aria-current={
                                            isActive ? 'page' : undefined
                                        }
                                        className={`group flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none lg:justify-start ${
                                            isActive
                                                ? 'bg-brand/10 text-brand-ink'
                                                : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                                        }`}
                                    >
                                        <Icon
                                            className="size-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                        <span className="flex flex-col">
                                            <span>{tab.label}</span>
                                            <span
                                                className={`hidden text-xs font-normal lg:block ${
                                                    isActive
                                                        ? 'text-brand-ink/75'
                                                        : 'text-ink/50'
                                                }`}
                                            >
                                                {tab.description}
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    <div className="min-w-0 flex-1 space-y-6">{children}</div>
                </div>
            </div>
        </div>
    );
}
