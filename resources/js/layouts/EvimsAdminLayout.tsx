import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronsUpDown,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    ScrollText,
    Settings,
    ShieldCheck,
    UserCheck,
    UserCog,
    UserRound,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AdminAvatar from '@/components/admin-avatar';
import NotificationBell from '@/components/notification-bell';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStaffAbilities } from '@/hooks/use-staff-abilities';
import { dashboard, logout } from '@/routes';
import admin from '@/routes/admin';
import type { StaffAbilities } from '@/types/auth';

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Hides the item from roles that can't open it (see UserRole). */
    ability?: Exclude<keyof StaffAbilities, 'uploadDocumentTypes'>;
    /** Marks the item active for every page under this path. */
    matchPrefix?: string;
};

type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
    {
        label: 'Overview',
        items: [
            {
                label: 'Dashboard',
                href: admin.dashboard.url(),
                icon: LayoutDashboard,
                ability: 'viewDashboard',
            },
        ],
    },
    {
        label: 'Enrollment',
        items: [
            {
                label: 'Students',
                href: admin.students.index.url(),
                icon: Users,
                // Applications open from the students list.
                matchPrefix: '/admin/enrollments',
            },
            {
                label: 'Portal Accounts',
                href: admin.enrolleeAccounts.index.url(),
                icon: UserCheck,
                ability: 'reviewApplications',
            },
        ],
    },
    {
        label: 'Finance',
        items: [
            {
                label: 'Transactions',
                href: admin.transactions.index.url(),
                icon: ReceiptText,
                ability: 'handlePayments',
            },
        ],
    },
    {
        label: 'School',
        items: [
            {
                label: 'School Year Setup',
                href: admin.gradeLevels.index.url(),
                icon: GraduationCap,
                ability: 'manageSchool',
            },
            {
                label: 'Events',
                href: admin.events.index.url(),
                icon: Calendar,
                ability: 'manageSchool',
            },
        ],
    },
    {
        label: 'Administration',
        items: [
            {
                label: 'Staff Accounts',
                href: admin.staffAccounts.index.url(),
                icon: UserCog,
                ability: 'manageStaff',
            },
            {
                label: 'Audit Log',
                href: admin.auditLogs.index.url(),
                icon: ScrollText,
                ability: 'manageStaff',
            },
        ],
    },
];

const SETTINGS_ITEM: NavItem = {
    label: 'Settings',
    href: admin.settings.profile.edit.url(),
    icon: Settings,
    matchPrefix: '/admin/settings',
};

const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * Remembers the sidebar's width in the same cookie the server reads into
 * the shared `sidebarOpen` prop, so server rendering matches the browser.
 */
function rememberSidebarOpen(isOpen: boolean): void {
    document.cookie = `sidebar_state=${isOpen}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/** Shows a label beside an icon-only control while the sidebar is collapsed. */
function CollapsedTooltip({
    label,
    isCollapsed,
    children,
}: {
    label: string;
    isCollapsed: boolean;
    children: ReactNode;
}) {
    if (!isCollapsed) {
        return <>{children}</>;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}

function NavLink({
    item,
    isActive,
    isCollapsed,
    onNavigate,
}: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;

    return (
        <CollapsedTooltip label={item.label} isCollapsed={isCollapsed}>
            <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none ${
                    isCollapsed ? 'justify-center px-0' : ''
                } ${
                    isActive
                        ? 'bg-[#2F6F4E]/10 font-semibold text-[#2F6F4E] before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-[#2F6F4E]'
                        : 'font-medium text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]'
                }`}
            >
                <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                <span className={isCollapsed ? 'sr-only' : 'truncate'}>
                    {item.label}
                </span>
            </Link>
        </CollapsedTooltip>
    );
}

/** The signed-in staff member, with links to their settings and log out. */
function AccountMenu({
    isCollapsed,
    onNavigate,
}: {
    isCollapsed: boolean;
    onNavigate?: () => void;
}) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <DropdownMenu>
            <CollapsedTooltip label={user.name} isCollapsed={isCollapsed}>
                <DropdownMenuTrigger
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[#1F2A24]/5 focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none data-[state=open]:bg-[#1F2A24]/5 ${
                        isCollapsed ? 'justify-center' : ''
                    }`}
                >
                    <AdminAvatar
                        name={user.name}
                        photoUrl={user.profile_photo_url}
                        className="size-9 text-xs"
                    />
                    {isCollapsed ? (
                        <span className="sr-only">Account menu</span>
                    ) : (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[#1F2A24]">
                                    {user.name}
                                </span>
                                <span className="block truncate text-xs text-[#1F2A24]/60">
                                    {auth.roleLabel ?? user.email}
                                </span>
                            </span>
                            <ChevronsUpDown
                                className="size-4 shrink-0 text-[#1F2A24]/50"
                                aria-hidden="true"
                            />
                        </>
                    )}
                </DropdownMenuTrigger>
            </CollapsedTooltip>

            <DropdownMenuContent
                side={isCollapsed ? 'right' : 'top'}
                align={isCollapsed ? 'end' : 'start'}
                sideOffset={8}
                className="w-64 rounded-xl border-[#1F2A24]/10 bg-white p-1.5 text-[#1F2A24] shadow-lg"
            >
                <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
                    <AdminAvatar
                        name={user.name}
                        photoUrl={user.profile_photo_url}
                        className="size-10 text-sm"
                    />
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                            {user.name}
                        </span>
                        <span className="block truncate text-xs text-[#1F2A24]/60">
                            {user.email}
                        </span>
                        {auth.roleLabel && (
                            <span className="mt-1 inline-block rounded-full bg-[#2F6F4E]/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-[#2F6F4E]">
                                {auth.roleLabel}
                            </span>
                        )}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#1F2A24]/10" />
                <DropdownMenuItem
                    asChild
                    className="min-h-10 cursor-pointer rounded-lg focus:bg-[#2F6F4E]/10 focus:text-[#2F6F4E]"
                >
                    <Link
                        href={admin.settings.profile.edit.url()}
                        onClick={onNavigate}
                    >
                        <UserRound aria-hidden="true" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    asChild
                    className="min-h-10 cursor-pointer rounded-lg focus:bg-[#2F6F4E]/10 focus:text-[#2F6F4E]"
                >
                    <Link
                        href={admin.settings.security.edit.url()}
                        onClick={onNavigate}
                    >
                        <ShieldCheck aria-hidden="true" />
                        Password &amp; two-factor
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1F2A24]/10" />
                <DropdownMenuItem
                    asChild
                    className="min-h-10 w-full cursor-pointer rounded-lg text-[#A3372D] focus:bg-[#C6473B]/10 focus:text-[#A3372D] [&_svg]:!text-[#A3372D]"
                >
                    <Link href={logout()} as="button">
                        <LogOut aria-hidden="true" />
                        Log out
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Everything inside the sidebar. Rendered as a column on desktop (where it
 * can collapse to icons) and inside a drawer on smaller screens.
 */
function SidebarBody({
    isCollapsed,
    onToggleCollapsed,
    onNavigate,
}: {
    isCollapsed: boolean;
    onToggleCollapsed?: () => void;
    onNavigate?: () => void;
}) {
    const { url } = usePage();
    const can = useStaffAbilities();
    const path = url.split('?')[0];

    const isActive = (item: NavItem) =>
        path === item.href ||
        path.startsWith(`${item.href}/`) ||
        (!!item.matchPrefix && path.startsWith(item.matchPrefix));

    const sections = NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
            (item) => !item.ability || can[item.ability],
        ),
    })).filter((section) => section.items.length > 0);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div
                className={`flex h-16 shrink-0 items-center gap-3 border-b border-[#1F2A24]/10 ${
                    isCollapsed ? 'justify-center px-2' : 'px-4'
                }`}
            >
                <img
                    src="/images/logoevims.png"
                    alt=""
                    className="size-9 shrink-0 rounded-full object-cover"
                />
                {!isCollapsed && (
                    <div className="min-w-0 flex-1 leading-tight">
                        <p className="font-serif text-lg font-semibold text-[#1F2A24]">
                            EVIMS
                        </p>
                        <p className="text-xs text-[#1F2A24]/60">Admin Panel</p>
                    </div>
                )}
                {onToggleCollapsed && !isCollapsed && (
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        aria-label="Collapse sidebar"
                        className="rounded-lg p-2 text-[#1F2A24]/60 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none"
                    >
                        <PanelLeftClose className="size-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            <nav
                aria-label="Admin"
                className={`min-h-0 flex-1 overflow-y-auto py-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
            >
                {sections.map((section, index) => (
                    <div
                        key={section.label}
                        className={index > 0 ? 'mt-4' : ''}
                    >
                        {isCollapsed ? (
                            index > 0 && (
                                <hr
                                    className="mx-2 mb-3 border-[#1F2A24]/10"
                                    aria-hidden="true"
                                />
                            )
                        ) : (
                            <p className="mb-1 px-3 text-[0.6875rem] font-semibold tracking-[0.08em] text-[#1F2A24]/45 uppercase">
                                {section.label}
                            </p>
                        )}
                        <ul
                            className="space-y-0.5"
                            aria-label={isCollapsed ? section.label : undefined}
                        >
                            {section.items.map((item) => (
                                <li key={item.href}>
                                    <NavLink
                                        item={item}
                                        isActive={isActive(item)}
                                        isCollapsed={isCollapsed}
                                        onNavigate={onNavigate}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div
                className={`shrink-0 space-y-1 border-t border-[#1F2A24]/10 py-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
            >
                <NavLink
                    item={SETTINGS_ITEM}
                    isActive={isActive(SETTINGS_ITEM)}
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                />
                {onToggleCollapsed && isCollapsed && (
                    <CollapsedTooltip label="Expand sidebar" isCollapsed>
                        <button
                            type="button"
                            onClick={onToggleCollapsed}
                            aria-label="Expand sidebar"
                            className="flex min-h-10 w-full items-center justify-center rounded-lg text-[#1F2A24]/60 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none"
                        >
                            <PanelLeftOpen
                                className="size-[1.125rem]"
                                aria-hidden="true"
                            />
                        </button>
                    </CollapsedTooltip>
                )}
                <AccountMenu
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
}

export default function EvimsAdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { sidebarOpen } = usePage().props;
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(!sidebarOpen);

    const toggleCollapsed = () => {
        rememberSidebarOpen(isCollapsed);
        setIsCollapsed(!isCollapsed);
    };

    // The drawer has no place on desktop, so close it if the window widens.
    useEffect(() => {
        const desktop = window.matchMedia(DESKTOP_QUERY);
        const closeOnDesktop = (event: MediaQueryListEvent) => {
            if (event.matches) {
                setIsMobileOpen(false);
            }
        };

        desktop.addEventListener('change', closeOnDesktop);

        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, []);

    const closeMobile = () => setIsMobileOpen(false);

    return (
        // On desktop the layout is exactly one screen tall: the sidebar stays
        // put and only the main content scrolls. On smaller screens the page
        // scrolls under the fixed top bar, and the sidebar is a drawer.
        <div className="evims-admin flex min-h-screen bg-[#FBF8F2] lg:h-dvh lg:overflow-hidden">
            <a
                href="#main-content"
                className="sr-only z-[60] rounded-md bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>

            {/* Top bar (phones and tablets) */}
            <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-2 border-b border-[#1F2A24]/10 bg-white/95 px-2 backdrop-blur lg:hidden">
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={isMobileOpen}
                    aria-controls="admin-sidebar-drawer"
                    className="inline-flex size-11 items-center justify-center rounded-lg text-[#1F2A24]/75 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none"
                >
                    <Menu className="size-6" aria-hidden="true" />
                </button>
                {/* Each role's own home page (Teachers have no Dashboard). */}
                <Link
                    href={dashboard.url()}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                    <img
                        src="/images/logoevims.png"
                        alt=""
                        className="size-9 rounded-full object-cover"
                    />
                    <span className="font-serif text-lg font-semibold text-[#1F2A24]">
                        EVIMS
                    </span>
                </Link>
                <NotificationBell scope="admin" />
            </header>

            {/* Drawer (phones and tablets) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent
                    id="admin-sidebar-drawer"
                    side="left"
                    className="w-72 max-w-[85vw] gap-0 border-[#1F2A24]/10 bg-white p-0 sm:max-w-xs lg:hidden"
                >
                    <SheetTitle className="sr-only">Admin menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Pages in the admin panel and your account.
                    </SheetDescription>
                    <SidebarBody isCollapsed={false} onNavigate={closeMobile} />
                </SheetContent>
            </Sheet>

            {/* Sidebar (desktop) */}
            <aside
                aria-label="Sidebar"
                className={`hidden shrink-0 border-r border-[#1F2A24]/10 bg-white transition-[width] duration-200 ease-in-out lg:block lg:h-full ${
                    isCollapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'
                }`}
            >
                <SidebarBody
                    isCollapsed={isCollapsed}
                    onToggleCollapsed={toggleCollapsed}
                />
            </aside>

            <main
                id="main-content"
                tabIndex={-1}
                // Tells Inertia this is where the page scrolls, so it resets
                // (or preserves) the scroll position here on navigation.
                scroll-region=""
                className="min-w-0 flex-1 pt-16 focus:outline-none lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pt-0"
            >
                <div className="sticky top-0 z-20 hidden h-14 items-center justify-end border-b border-[#1F2A24]/10 bg-[#FBF8F2]/90 px-6 backdrop-blur lg:flex">
                    <NotificationBell scope="admin" />
                </div>
                {children}
            </main>
        </div>
    );
}
