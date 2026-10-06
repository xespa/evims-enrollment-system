import { Link } from '@inertiajs/react';
import { ShieldCheck, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import admin from '@/routes/admin';

type SettingsTab = {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
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
        description: 'Password and sign-in',
        href: admin.settings.security.edit.url(),
        icon: ShieldCheck,
    },
];

/**
 * Page frame shared by the admin settings pages: the heading, the tab
 * list (a sidebar on desktop, a segmented control on mobile), and the
 * content column.
 */
export default function AdminSettingsShell({
    children,
}: {
    children: ReactNode;
}) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="min-h-full bg-[#FBF8F2] px-4 py-8">
            <div className="mx-auto max-w-6xl">
                <header>
                    <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-[#1F2A24]/70">
                        Manage your administrator profile and account security.
                    </p>
                </header>

                <div className="mt-6 flex flex-col gap-6 lg:mt-8 lg:flex-row lg:gap-10">
                    <aside className="w-full lg:sticky lg:top-6 lg:w-60 lg:shrink-0 lg:self-start">
                        <nav
                            aria-label="Settings"
                            className="grid grid-cols-2 gap-1 rounded-xl border border-[#1F2A24]/10 bg-white p-1 lg:flex lg:flex-col lg:gap-1 lg:p-2"
                        >
                            {TABS.map((tab) => {
                                const isActive = isCurrentOrParentUrl(tab.href);
                                const Icon = tab.icon;

                                return (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        aria-current={
                                            isActive ? 'page' : undefined
                                        }
                                        className={`group flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none lg:justify-start ${
                                            isActive
                                                ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                                : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]'
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
                                                        ? 'text-[#2F6F4E]/75'
                                                        : 'text-[#1F2A24]/50'
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

                    <div className="max-w-2xl min-w-0 flex-1 space-y-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
