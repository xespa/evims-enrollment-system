import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    LayoutDashboard,
    LogIn,
    LogOut,
    Menu,
    UserPlus,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import NotificationBell from '@/components/notification-bell';
import {
    dashboard as portalDashboard,
    login as portalLogin,
    logout as portalLogout,
    register as portalRegister,
} from '@/routes/portal';
import EnrollButton from './enroll-button';
import { NAV_ITEMS, isActiveItem, isNavGroup } from './site-navigation';
import type { NavGroup } from './site-navigation';

type Enrollee = {
    name: string;
    email: string;
    profile_photo_url: string | null;
};

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

function Avatar({ enrollee, size }: { enrollee: Enrollee; size: string }) {
    return enrollee.profile_photo_url ? (
        <img
            src={enrollee.profile_photo_url}
            alt=""
            className={`${size} rounded-full object-cover`}
        />
    ) : (
        <span
            className={`${size} flex items-center justify-center rounded-full bg-[#2F6F4E] text-xs font-semibold text-white`}
        >
            {initials(enrollee.name)}
        </span>
    );
}

function Brand() {
    return (
        <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label="EVIMS home"
        >
            <img
                src="/images/logoevims.png"
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
            <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-serif text-lg font-semibold tracking-tight">
                    EVIMS
                </span>
                <span className="hidden truncate text-[10.5px] tracking-[0.12em] text-[#1F2A24]/65 uppercase sm:block">
                    Eastern Visayas Int'l Montessori School
                </span>
            </span>
        </Link>
    );
}

/** A desktop dropdown that opens on hover or click and closes on Escape. */
function DesktopDropdown({
    group,
    isActive,
    currentUrl,
    open,
    onOpenChange,
}: {
    group: NavGroup;
    isActive: boolean;
    currentUrl: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <div
            className="relative"
            onMouseEnter={() => onOpenChange(true)}
            onMouseLeave={() => onOpenChange(false)}
        >
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-haspopup="true"
                aria-expanded={open}
                className={`relative flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive || open
                        ? 'text-[#2F6F4E]'
                        : 'text-[#1F2A24]/80 hover:text-[#2F6F4E]'
                }`}
            >
                {group.label}
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
                {isActive && <ActiveBar />}
            </button>

            <div
                className={`absolute top-full left-1/2 z-50 w-72 -translate-x-1/2 pt-2 transition duration-150 ${
                    open
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible -translate-y-1 opacity-0'
                }`}
            >
                <div className="overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white p-1.5 shadow-xl shadow-[#1F2A24]/10">
                    {group.children.map((child) => {
                        const isChildActive = isActiveItem(child, currentUrl);

                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => onOpenChange(false)}
                                aria-current={
                                    isChildActive ? 'page' : undefined
                                }
                                className={`block rounded-xl px-3 py-2.5 transition-colors ${
                                    isChildActive
                                        ? 'bg-[#2F6F4E]/10'
                                        : 'hover:bg-[#1F2A24]/5'
                                }`}
                            >
                                <span
                                    className={`block text-sm font-semibold ${isChildActive ? 'text-[#2F6F4E]' : 'text-[#1F2A24]'}`}
                                >
                                    {child.label}
                                </span>
                                {child.description && (
                                    <span className="block text-xs text-[#1F2A24]/60">
                                        {child.description}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ActiveBar() {
    return (
        <span
            className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-[#2F6F4E]"
            aria-hidden="true"
        />
    );
}

/** The signed-in parent's avatar, opening a small account menu. */
function AccountMenu({ enrollee }: { enrollee: Enrollee }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((isOpen) => !isOpen)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account menu for ${enrollee.name}`}
                className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-[#1F2A24]/5"
            >
                <Avatar enrollee={enrollee} size="h-9 w-9" />
                <ChevronDown
                    className={`h-4 w-4 text-[#1F2A24]/60 transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white shadow-xl shadow-[#1F2A24]/10"
                >
                    <div className="flex items-center gap-3 border-b border-[#1F2A24]/10 p-3">
                        <Avatar enrollee={enrollee} size="h-10 w-10" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#1F2A24]">
                                {enrollee.name}
                            </p>
                            <p className="truncate text-xs text-[#1F2A24]/60">
                                {enrollee.email}
                            </p>
                        </div>
                    </div>
                    <div className="p-1.5">
                        <Link
                            href={portalDashboard()}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#1F2A24] hover:bg-[#1F2A24]/5"
                        >
                            <LayoutDashboard
                                className="h-4 w-4 text-[#2F6F4E]"
                                aria-hidden="true"
                            />
                            My account
                        </Link>
                        <Link
                            href={portalLogout()}
                            as="button"
                            role="menuitem"
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#1F2A24] hover:bg-[#1F2A24]/5"
                        >
                            <LogOut
                                className="h-4 w-4 text-[#1F2A24]/60"
                                aria-hidden="true"
                            />
                            Log out
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Slide-in navigation for phones and tablets. */
function MobileMenu({
    open,
    onClose,
    enrollee,
    currentUrl,
}: {
    open: boolean;
    onClose: () => void;
    enrollee: Enrollee | null;
    currentUrl: string;
}) {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        if (!open) {
            setOpenSection(null);
            return;
        }

        closeButtonRef.current?.focus();
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open, onClose]);

    const linkClass = (isActive: boolean) =>
        `flex min-h-11 items-center rounded-xl px-3 text-sm font-medium ${
            isActive
                ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                : 'text-[#1F2A24]/80 hover:bg-[#1F2A24]/5'
        }`;

    return (
        <>
            <div
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-[#1F2A24]/40 backdrop-blur-[2px] transition-opacity duration-300 xl:hidden ${
                    open
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                aria-hidden="true"
            />

            <aside
                id="site-mobile-nav"
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
                inert={!open}
                className={`fixed top-0 right-0 z-50 flex h-full w-80 max-w-[86vw] flex-col bg-[#FBF8F2] shadow-2xl transition-[transform,visibility] duration-300 ease-in-out xl:hidden ${
                    open
                        ? 'visible translate-x-0'
                        : 'invisible translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between gap-3 border-b border-[#1F2A24]/10 px-4 py-3">
                    <Brand />
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                        aria-label="Close navigation"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="border-b border-[#1F2A24]/10 p-4">
                    {enrollee ? (
                        <Link
                            href={portalDashboard()}
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#1F2A24]/10"
                        >
                            <Avatar enrollee={enrollee} size="h-10 w-10" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[#1F2A24]">
                                    {enrollee.name}
                                </span>
                                <span className="block text-xs font-medium text-[#2F6F4E]">
                                    Go to my account
                                </span>
                            </span>
                        </Link>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href={portalLogin()}
                                onClick={onClose}
                                className="flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#1F2A24]/15 bg-white text-sm font-semibold text-[#1F2A24]"
                            >
                                <LogIn className="h-4 w-4" aria-hidden="true" />
                                Log in
                            </Link>
                            <Link
                                href={portalRegister()}
                                onClick={onClose}
                                className="flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#2F6F4E]/30 bg-[#2F6F4E]/5 text-sm font-semibold text-[#2F6F4E]"
                            >
                                <UserPlus
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>

                <nav
                    aria-label="Main"
                    className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
                >
                    {NAV_ITEMS.map((item) => {
                        const isActive = isActiveItem(item, currentUrl);

                        if (!isNavGroup(item)) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={linkClass(isActive)}
                                >
                                    {item.label}
                                </Link>
                            );
                        }

                        const isOpen = openSection === item.label || isActive;

                        return (
                            <div key={item.label}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenSection((current) =>
                                            current === item.label
                                                ? null
                                                : item.label,
                                        )
                                    }
                                    aria-expanded={isOpen}
                                    className={`${linkClass(isActive)} w-full justify-between`}
                                >
                                    {item.label}
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                    />
                                </button>
                                {isOpen && (
                                    <div className="my-1 ml-4 flex flex-col gap-0.5 border-l-2 border-[#2F6F4E]/15 pl-2">
                                        {item.children.map((child) => {
                                            const isChildActive = isActiveItem(
                                                child,
                                                currentUrl,
                                            );

                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={onClose}
                                                    aria-current={
                                                        isChildActive
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    className={`rounded-lg px-3 py-2 ${
                                                        isChildActive
                                                            ? 'bg-[#2F6F4E]/10'
                                                            : 'hover:bg-[#1F2A24]/5'
                                                    }`}
                                                >
                                                    <span
                                                        className={`block text-sm font-medium ${isChildActive ? 'text-[#2F6F4E]' : 'text-[#1F2A24]/80'}`}
                                                    >
                                                        {child.label}
                                                    </span>
                                                    {child.description && (
                                                        <span className="block text-xs text-[#1F2A24]/55">
                                                            {child.description}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="space-y-2 border-t border-[#1F2A24]/10 p-4">
                    <EnrollButton onNavigate={onClose} fullWidth />
                    {enrollee && (
                        <Link
                            href={portalLogout()}
                            as="button"
                            className="flex min-h-10 w-full items-center justify-center gap-1.5 text-sm font-medium text-[#1F2A24]/60 hover:text-[#1F2A24]"
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            Log out
                        </Link>
                    )}
                </div>
            </aside>
        </>
    );
}

export default function SiteHeader() {
    const { url, props } = usePage<{ auth?: { enrollee?: Enrollee | null } }>();
    const enrollee = props.auth?.enrollee ?? null;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const update = () => setIsScrolled(window.scrollY > 8);
        update();
        window.addEventListener('scroll', update, { passive: true });

        return () => window.removeEventListener('scroll', update);
    }, []);

    useEffect(() => {
        if (!openDropdown) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenDropdown(null);
        };
        document.addEventListener('keydown', closeOnEscape);

        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [openDropdown]);

    return (
        <>
            <header
                className={`sticky top-0 z-40 border-b bg-[#FBF8F2]/90 backdrop-blur-md transition-shadow duration-200 ${
                    isScrolled
                        ? 'border-[#1F2A24]/10 shadow-sm shadow-[#1F2A24]/5'
                        : 'border-transparent'
                }`}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-5">
                    <Brand />

                    <nav
                        aria-label="Main"
                        className="hidden items-center gap-0.5 xl:flex"
                    >
                        {NAV_ITEMS.map((item) => {
                            const isActive = isActiveItem(item, url);

                            return isNavGroup(item) ? (
                                <DesktopDropdown
                                    key={item.label}
                                    group={item}
                                    isActive={isActive}
                                    currentUrl={url}
                                    open={openDropdown === item.label}
                                    onOpenChange={(isOpen) =>
                                        setOpenDropdown(
                                            isOpen ? item.label : null,
                                        )
                                    }
                                />
                            ) : (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'text-[#2F6F4E]'
                                            : 'text-[#1F2A24]/80 hover:text-[#2F6F4E]'
                                    }`}
                                >
                                    {item.label}
                                    {isActive && <ActiveBar />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <NotificationBell />

                        <div className="hidden items-center gap-2 xl:flex">
                            {enrollee ? (
                                <AccountMenu enrollee={enrollee} />
                            ) : (
                                <Link
                                    href={portalLogin()}
                                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#1F2A24]/80 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                                >
                                    <LogIn
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Log in
                                </Link>
                            )}
                        </div>

                        <div className="hidden md:block">
                            <EnrollButton />
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            className="-mr-1 rounded-full p-2 text-[#1F2A24] hover:bg-[#1F2A24]/5 xl:hidden"
                            aria-label="Open navigation"
                            aria-expanded={isMenuOpen}
                            aria-controls="site-mobile-nav"
                        >
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu
                open={isMenuOpen}
                onClose={closeMenu}
                enrollee={enrollee}
                currentUrl={url}
            />
        </>
    );
}
