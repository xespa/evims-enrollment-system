import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';

const TABS = [
    { label: 'Profile', route: 'admin.settings.profile.edit' },
    { label: 'Security', route: 'admin.settings.security.edit' },
];

export default function AdminSettingsShell({ children }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="bg-[#FBF8F2] px-4 py-8">
            <div className="mx-auto max-w-6xl">
                <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-[#1F2A24]/60">
                    Manage your profile and account settings
                </p>

                <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
                    <aside className="w-full lg:w-48 lg:shrink-0">
                        <nav
                            className="flex flex-col gap-1"
                            aria-label="Settings"
                        >
                            {TABS.map((tab) => (
                                <Link
                                    key={tab.route}
                                    href={route(tab.route)}
                                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                                        isCurrentOrParentUrl(route(tab.route))
                                            ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                            : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]'
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    <hr className="border-[#1F2A24]/10 lg:hidden" />

                    <div className="max-w-xl min-w-0 flex-1 space-y-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
