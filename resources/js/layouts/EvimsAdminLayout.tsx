import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronUp,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    Settings,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NotificationBell from '@/components/notification-bell';

const NAV_ITEMS = [
    { label: 'Dashboard', route: 'admin.dashboard', icon: LayoutDashboard },
    { label: 'Students', route: 'admin.students.index', icon: Users },
    {
        label: 'Portal Accounts',
        route: 'admin.enrollee-accounts.index',
        icon: UserCheck,
    },
    {
        label: 'Transactions',
        route: 'admin.transactions.index',
        icon: ReceiptText,
    },
    { label: 'Events', route: 'admin.events.index', icon: Calendar },
    {
        label: 'Grade Levels',
        route: 'admin.grade-levels.index',
        icon: GraduationCap,
    },
    {
        label: 'Settings',
        route: 'admin.settings.profile.edit',
        icon: Settings,
        matchPrefix: '/admin/settings',
    },
];

export default function EvimsAdminLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [credentialsOpen, setCredentialsOpen] = useState(false);
    const credentialsRef = useRef(null);

    const isActive = (item) => {
        if (item.matchPrefix) {
            return url.startsWith(item.matchPrefix);
        }
        try {
            return url.startsWith(new URL(route(item.route)).pathname);
        } catch {
            return false;
        }
    };

    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
            }
        };

        document.addEventListener('keydown', closeOnEscape);

        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [mobileOpen]);

    useEffect(() => {
        if (!credentialsOpen) {
            return;
        }

        const closeOnOutsideClick = (event) => {
            if (
                credentialsRef.current &&
                !credentialsRef.current.contains(event.target)
            ) {
                setCredentialsOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setCredentialsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [credentialsOpen]);

    const SidebarContent = (
        <>
            <div
                className={`flex shrink-0 items-center border-b border-[#1F2A24]/10 px-6 py-5 ${
                    collapsed
                        ? 'lg:flex-col lg:justify-center lg:gap-3 lg:px-3'
                        : 'justify-between'
                }`}
            >
                <div className="flex items-center gap-3">
                    <img
                        src="/images/logoevims.png"
                        alt=""
                        className={`shrink-0 rounded-full object-cover ${
                            collapsed ? 'h-13 w-13 lg:h-9 lg:w-9' : 'h-13 w-13'
                        }`}
                    />
                    <div
                        className={`flex flex-col leading-none ${collapsed ? 'lg:hidden' : ''}`}
                    >
                        <p className="font-serif text-lg font-semibold text-[#1F2A24]">
                            EVIMS
                        </p>
                        <p className="text-xs text-[#1F2A24]/70">Admin Panel</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="-mr-2 rounded-md p-2 text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] lg:hidden"
                    aria-label="Close menu"
                >
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="hidden shrink-0 rounded-md p-1.5 text-[#1F2A24]/65 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] lg:inline-flex"
                    aria-label={
                        collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                    }
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                        <PanelLeftClose className="h-4 w-4" />
                    )}
                </button>
            </div>

            <nav
                aria-label="Admin"
                className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4"
            >
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.route}
                        href={route(item.route)}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        aria-current={isActive(item) ? 'page' : undefined}
                        className={`flex min-h-10 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                            collapsed ? 'lg:justify-center lg:px-2' : ''
                        } ${
                            isActive(item)
                                ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]'
                        }`}
                    >
                        <item.icon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span className={collapsed ? 'lg:sr-only' : ''}>
                            {item.label}
                        </span>
                    </Link>
                ))}
            </nav>

            <div
                className={`shrink-0 border-t border-[#1F2A24]/10 px-3 py-4 ${collapsed ? 'lg:px-2' : ''}`}
            >
                {user && (
                    <div
                        ref={credentialsRef}
                        className={`relative mb-3 ${collapsed ? 'lg:hidden' : ''}`}
                    >
                        {credentialsOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-[#1F2A24]/10 bg-white p-3 shadow-lg">
                                <p className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                    Account Credentials
                                </p>
                                <div className="mt-2 space-y-1.5">
                                    <div>
                                        <p className="text-xs text-[#1F2A24]/65">
                                            Name
                                        </p>
                                        <p className="truncate text-sm text-[#1F2A24]">
                                            {user.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#1F2A24]/65">
                                            Email
                                        </p>
                                        <p className="truncate text-sm text-[#1F2A24]">
                                            {user.email}
                                        </p>
                                    </div>
                                    {user.role && (
                                        <div>
                                            <p className="text-xs text-[#1F2A24]/65">
                                                Role
                                            </p>
                                            <p className="truncate text-sm text-[#1F2A24]">
                                                {user.role}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setCredentialsOpen((open) => !open)}
                            aria-expanded={credentialsOpen}
                            className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left transition hover:bg-[#1F2A24]/5"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-[#1F2A24]">
                                    {user.name}
                                </span>
                                <span className="block truncate text-xs text-[#1F2A24]/70">
                                    {user.email}
                                </span>
                            </span>
                            <ChevronUp
                                className={`h-4 w-4 shrink-0 text-[#1F2A24]/65 transition-transform ${
                                    credentialsOpen ? '' : 'rotate-180'
                                }`}
                            />
                        </button>
                    </div>
                )}
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    title={collapsed ? 'Log Out' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] ${
                        collapsed ? 'lg:justify-center lg:px-2' : ''
                    }`}
                >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className={collapsed ? 'lg:sr-only' : ''}>
                        Log Out
                    </span>
                </Link>
            </div>
        </>
    );

    return (
        // On desktop the layout is exactly one screen tall: the sidebar stays
        // put and only the main content scrolls. On mobile the page itself
        // scrolls under the fixed top bar, and the sidebar is a drawer.
        <div className="evims-admin flex min-h-screen bg-[#FBF8F2] lg:h-dvh lg:overflow-hidden">
            <a
                href="#main-content"
                className="sr-only z-[60] rounded-md bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>
            {/* Mobile top bar */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[#1F2A24]/10 bg-white px-4 py-3 lg:hidden">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/images/logoevims.png"
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                    />
                    <p className="font-serif text-base font-semibold text-[#1F2A24]">
                        EVIMS
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <NotificationBell scope="admin" />
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="-mr-2 rounded-md p-2 text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                        aria-label="Open menu"
                        aria-expanded={mobileOpen}
                        aria-controls="admin-sidebar"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    aria-hidden="true"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar: fixed drawer on mobile, static column on desktop */}
            <aside
                id="admin-sidebar"
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col overflow-hidden border-r border-[#1F2A24]/10 bg-white transition-all duration-200 ease-in-out lg:static lg:z-auto lg:h-full lg:translate-x-0 ${
                    collapsed ? 'lg:w-20' : 'lg:w-64'
                } ${mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}
            >
                {SidebarContent}
            </aside>

            {/* Main content */}
            <main
                id="main-content"
                tabIndex={-1}
                // Tells Inertia this is where the page scrolls, so it resets
                // (or preserves) the scroll position here on navigation.
                scroll-region=""
                className="min-w-0 flex-1 pt-16 focus:outline-none lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pt-0"
            >
                <div className="sticky top-0 z-20 hidden justify-end border-b border-[#1F2A24]/10 bg-[#FBF8F2]/90 px-6 py-2 backdrop-blur lg:flex">
                    <NotificationBell scope="admin" />
                </div>
                {children}
            </main>
        </div>
    );
}
