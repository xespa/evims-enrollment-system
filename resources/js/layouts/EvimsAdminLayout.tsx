import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard', route: 'admin.dashboard' },
    { label: 'Enrollment Applications', route: 'admin.enrollments.index' },
    { label: 'Events', route: 'admin.events.index' },
    { label: 'Tuition Fees', route: 'admin.gradeLevels.index' },
];

export default function EvimsAdminLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (routeName) => {
        try {
            return url.startsWith(new URL(route(routeName)).pathname);
        } catch {
            return false;
        }
    };

    const SidebarContent = (
        <>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                    <p className="text-lg font-bold text-gray-900">EVIMS</p>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="text-gray-400 hover:text-gray-600 lg:hidden"
                    aria-label="Close menu"
                >
                    ✕
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.route}
                        href={route(item.route)}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                            isActive(item.route)
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="border-t border-gray-100 px-3 py-4">
                {user && (
                    <div className="mb-3 px-3">
                        <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                )}
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                    Log Out
                </Link>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile top bar */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
                <p className="text-base font-bold text-gray-900">EVIMS</p>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="text-gray-600 hover:text-gray-900"
                    aria-label="Open menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar: fixed drawer on mobile, static column on desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out
                lg:static lg:z-auto lg:translate-x-0
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {SidebarContent}
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
        </div>
    );
}
