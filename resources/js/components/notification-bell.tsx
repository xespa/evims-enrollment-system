import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    BellOff,
    CalendarCheck,
    CalendarClock,
    CalendarX,
    CheckCheck,
    CircleAlert,
    CircleCheck,
    FilePlus2,
    FileUp,
    FileWarning,
    FileX2,
    Info,
    Mail,
    MailCheck,
    ReceiptText,
    RotateCcw,
    UserRoundCheck,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

type Notification = {
    id: string;
    read_at: string | null;
    created_at: string;
    data: {
        type?: string;
        status?: string;
        /** Set on parent_confirmation_answered. */
        confirmed?: boolean;
        title: string;
        message: string;
        url?: string;
    };
};

type Filter = 'all' | 'unread';

/** How often an open tab checks for new notifications. */
const POLL_INTERVAL_MS = 30_000;

type Scope = 'portal' | 'admin';

/** Where each bell loads its notifications from, and what it says when empty. */
const SCOPES = {
    portal: {
        index: 'portal.notifications.index',
        read: 'portal.notifications.read',
        readAll: 'portal.notifications.read-all',
        fallback: 'portal.dashboard',
        emptyUnread:
            'New updates about your application and payments will show here.',
        emptyAll:
            "We'll let you know when there's news about your application or payments.",
    },
    admin: {
        index: 'admin.notifications.index',
        read: 'admin.notifications.read',
        readAll: 'admin.notifications.read-all',
        fallback: 'admin.dashboard',
        emptyUnread:
            'New applications, online payments, and uploads will show here.',
        emptyAll:
            "We'll let you know here when parents apply, pay online, upload documents, or need their account reviewed, and when enrollment is about to open or close.",
    },
} as const;

/** Icon and colours for each kind of notification. */
function appearance(notification: Notification): {
    icon: LucideIcon;
    tone: string;
} {
    switch (notification.data.type) {
        case 'enrollment_status_changed':
            return notification.data.status === 'APPROVED'
                ? { icon: CircleCheck, tone: 'bg-[#2E8057]/12 text-brand-forest' }
                : { icon: Info, tone: 'bg-warn/15 text-warn-strong' };
        case 'document_reminder':
            return {
                icon: FileWarning,
                tone: 'bg-warn/15 text-warn-strong',
            };
        case 'document_appointment':
            return {
                icon: CalendarCheck,
                tone: 'bg-[#2E8057]/12 text-brand-forest',
            };
        case 'document_appointment_cancelled':
            return {
                icon: CalendarX,
                tone: 'bg-ink/10 text-ink/70',
            };
        case 'payment_received':
        case 'online_payment_received':
            return { icon: Wallet, tone: 'bg-[#2E8057]/12 text-brand-forest' };
        case 'application_submitted':
            return {
                icon: FilePlus2,
                tone: 'bg-brand/10 text-brand-ink',
            };
        case 'application_cancelled':
            return {
                icon: FileX2,
                tone: 'bg-ink/10 text-ink/70',
            };
        case 'document_uploaded':
            return {
                icon: FileUp,
                tone: 'bg-warn/15 text-warn-strong',
            };
        case 'account_awaiting_review':
        case 'staff_account_awaiting_approval':
            return {
                icon: UserRoundCheck,
                tone: 'bg-warn/15 text-warn-strong',
            };
        case 'payment_voided':
            return { icon: RotateCcw, tone: 'bg-danger/10 text-danger-deep' };
        case 'confirm_email':
            return { icon: Mail, tone: 'bg-warn/15 text-warn-strong' };
        case 'email_confirmed':
            return { icon: MailCheck, tone: 'bg-[#2E8057]/12 text-brand-forest' };
        case 'parent_confirmation_answered':
            return notification.data.confirmed
                ? {
                      icon: UserRoundCheck,
                      tone: 'bg-[#2E8057]/12 text-brand-forest',
                  }
                : {
                      icon: UserRoundCheck,
                      tone: 'bg-danger/10 text-danger-deep',
                  };
        case 'enrollment_period':
            switch (notification.data.status) {
                case 'OPENING_SOON':
                    return {
                        icon: CalendarClock,
                        tone: 'bg-[#2E8057]/12 text-brand-forest',
                    };
                case 'CLOSING_SOON':
                    return {
                        icon: CalendarClock,
                        tone: 'bg-warn/15 text-warn-strong',
                    };
                default:
                    return {
                        icon: CalendarX,
                        tone: 'bg-danger/10 text-danger-deep',
                    };
            }
        case 'student_account_consent':
            return notification.data.status === 'ACTIVE'
                ? {
                      icon: UserRoundCheck,
                      tone: 'bg-[#2E8057]/12 text-brand-forest',
                  }
                : {
                      icon: CircleAlert,
                      tone: 'bg-ink/10 text-ink/70',
                  };
        case 'account_reviewed':
            return notification.data.status === 'APPROVED'
                ? { icon: CircleCheck, tone: 'bg-[#2E8057]/12 text-brand-forest' }
                : {
                      icon: CircleAlert,
                      tone: 'bg-danger/10 text-danger-deep',
                  };
        default:
            return {
                icon: ReceiptText,
                tone: 'bg-brand/10 text-brand-ink',
            };
    }
}

function timeAgo(dateString: string): string {
    const seconds = Math.floor(
        (Date.now() - new Date(dateString).getTime()) / 1000,
    );
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Date(dateString).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });
}

function isToday(dateString: string): boolean {
    return new Date(dateString).toDateString() === new Date().toDateString();
}

function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * A background POST that no Inertia visit can cancel (marking read runs
 * alongside the visit to the notification's page).
 */
function postInBackground(url: string): void {
    fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
        },
    }).catch(() => {
        // The badge already updated; the next open re-syncs from the server.
    });
}

function NotificationItem({
    notification,
    onOpen,
}: {
    notification: Notification;
    onOpen: (notification: Notification) => void;
}) {
    const { icon: Icon, tone } = appearance(notification);
    const isUnread = !notification.read_at;

    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(notification)}
                className={`group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.04] focus-visible:bg-ink/[0.04] focus-visible:outline-none ${
                    isUnread ? 'bg-brand/[0.05]' : ''
                }`}
            >
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}
                    aria-hidden="true"
                >
                    <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                        <span
                            className={`text-sm ${
                                isUnread
                                    ? 'font-semibold text-ink'
                                    : 'font-medium text-ink/80'
                            }`}
                        >
                            {notification.data.title}
                        </span>
                        <span className="mt-0.5 shrink-0 text-[11px] text-ink/50 tabular-nums">
                            {timeAgo(notification.created_at)}
                        </span>
                    </span>
                    <span className="mt-0.5 line-clamp-3 block text-[13px] leading-snug text-ink/65">
                        {notification.data.message}
                    </span>
                </span>
                {isUnread && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand">
                        <span className="sr-only">Unread</span>
                    </span>
                )}
            </button>
        </li>
    );
}

function LoadingRows() {
    return (
        <ul className="divide-y divide-ink/5" aria-hidden="true">
            {[0, 1, 2].map((row) => (
                <li key={row} className="flex gap-3 px-4 py-3">
                    <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-ink/10 motion-reduce:animate-none" />
                    <span className="flex-1 space-y-2 py-1">
                        <span className="block h-3 w-2/3 animate-pulse rounded bg-ink/10 motion-reduce:animate-none" />
                        <span className="block h-3 w-full animate-pulse rounded bg-ink/10 motion-reduce:animate-none" />
                    </span>
                </li>
            ))}
        </ul>
    );
}

/**
 * The portal bell (for the signed-in enrollee) or, with scope="admin", the
 * admin panel's (for the signed-in staff user).
 */
export default function NotificationBell({
    scope = 'portal',
}: {
    scope?: Scope;
}) {
    const { props } = usePage<{
        auth?: {
            user?: { id: number } | null;
            enrollee?: { id: number } | null;
            unreadNotificationsCount?: number;
            userUnreadNotificationsCount?: number;
        };
    }>();
    const routes = SCOPES[scope];
    const owner = scope === 'admin' ? props.auth?.user : props.auth?.enrollee;
    const sharedUnreadCount =
        (scope === 'admin'
            ? props.auth?.userUnreadNotificationsCount
            : props.auth?.unreadNotificationsCount) ?? 0;

    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');
    const [notifications, setNotifications] = useState<Notification[] | null>(
        null,
    );
    const [unreadCount, setUnreadCount] = useState(sharedUnreadCount);
    const [loadFailed, setLoadFailed] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    useEffect(() => {
        setUnreadCount(sharedUnreadCount);
    }, [sharedUnreadCount]);

    const close = (returnFocus = false) => {
        setOpen(false);
        if (returnFocus) {
            buttonRef.current?.focus();
        }
    };

    useEffect(() => {
        if (!open) return;

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                close();
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close(true);
        };

        document.addEventListener('pointerdown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    /**
     * Notifications already seen in this tab, so a background check only
     * announces ones that are actually new. Null until the first load.
     */
    const knownIdsRef = useRef<Set<string> | null>(null);

    /**
     * Fetches the latest notifications. A background check fails quietly
     * (the next one retries) and pops up anything that's arrived since.
     */
    const load = ({ background = false } = {}) => {
        if (!background) setLoadFailed(false);

        fetch(route(routes.index), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                const latest: Notification[] = data.notifications ?? [];
                const knownIds = knownIdsRef.current;

                if (background && knownIds) {
                    announce(
                        latest.filter((n) => !n.read_at && !knownIds.has(n.id)),
                    );
                }
                knownIdsRef.current = new Set(latest.map((n) => n.id));

                setNotifications(latest);
                setUnreadCount(data.unread_count ?? 0);
            })
            .catch(() => {
                if (!background) setLoadFailed(true);
            });
    };

    /** A small pop-up for what's just arrived, linking to it. */
    const announce = (arrived: Notification[]) => {
        if (arrived.length === 0) return;

        if (arrived.length === 1) {
            const [notification] = arrived;

            toast(notification.data.title, {
                description: notification.data.message,
                action: {
                    label: 'View',
                    onClick: () => openNotification(notification),
                },
            });

            return;
        }

        toast(`${arrived.length} new notifications`, {
            description: arrived[0].data.title,
            action: { label: 'Show', onClick: () => setOpen(true) },
        });
    };

    // Checks for new notifications every so often while this tab is in
    // view, and straight away when coming back to it, so the badge and
    // list stay current without reloading the page.
    const hasOwner = Boolean(owner);
    useEffect(() => {
        if (!hasOwner) return;

        const checkIfVisible = () => {
            if (document.visibilityState === 'visible') {
                load({ background: true });
            }
        };

        checkIfVisible();
        const timer = window.setInterval(checkIfVisible, POLL_INTERVAL_MS);
        document.addEventListener('visibilitychange', checkIfVisible);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', checkIfVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasOwner, scope]);

    const toggleOpen = () => {
        if (open) {
            close();
            return;
        }

        setOpen(true);
        // Keep showing what was loaded before while refreshing, so the
        // list doesn't flash back to the loading state on every open.
        load();
    };

    const openNotification = (notification: Notification) => {
        close();

        if (!notification.read_at) {
            setUnreadCount((count) => Math.max(0, count - 1));
            setNotifications((list) =>
                (list ?? []).map((n) =>
                    n.id === notification.id
                        ? { ...n, read_at: new Date().toISOString() }
                        : n,
                ),
            );
            postInBackground(route(routes.read, notification.id));
        }

        router.visit(notification.data.url ?? route(routes.fallback));
    };

    const markAllRead = () => {
        setUnreadCount(0);
        setNotifications((list) =>
            (list ?? []).map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
            })),
        );
        postInBackground(route(routes.readAll));
    };

    if (!owner) return null;

    const visible = (notifications ?? []).filter(
        (n) => filter === 'all' || !n.read_at,
    );
    const today = visible.filter((n) => isToday(n.created_at));
    const earlier = visible.filter((n) => !isToday(n.created_at));

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleOpen}
                aria-label={
                    unreadCount > 0
                        ? `Notifications, ${unreadCount} unread`
                        : 'Notifications'
                }
                aria-expanded={open}
                aria-controls={panelId}
                aria-haspopup="dialog"
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    open
                        ? 'bg-brand/10 text-brand-ink'
                        : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                }`}
            >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span
                        className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-cream"
                        aria-hidden="true"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    id={panelId}
                    role="dialog"
                    aria-label="Notifications"
                    className="fixed inset-x-3 top-24 z-50 flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-2xl shadow-shade/15 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:max-h-[32rem] sm:w-[26rem]"
                >
                    <div className="border-b border-ink/10 px-4 pt-4 pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-danger/10 px-2 py-0.5 font-sans text-xs font-semibold text-danger-deep">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h2>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand/10"
                                >
                                    <CheckCheck
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div
                            role="group"
                            aria-label="Show"
                            className="mt-3 inline-flex rounded-full bg-ink/5 p-1"
                        >
                            {(['all', 'unread'] as const).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFilter(key)}
                                    aria-pressed={filter === key}
                                    className={`min-h-8 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                                        filter === key
                                            ? 'bg-surface text-ink shadow-sm'
                                            : 'text-ink/60 hover:text-ink'
                                    }`}
                                >
                                    {key === 'all'
                                        ? 'All'
                                        : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        {notifications === null && !loadFailed && (
                            <LoadingRows />
                        )}

                        {loadFailed && notifications === null && (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-ink/70">
                                    Couldn't load your notifications.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => load()}
                                    className="mt-3 inline-flex min-h-10 items-center rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink hover:bg-ink/5"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {notifications !== null && visible.length === 0 && (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand-ink">
                                    {filter === 'unread' ? (
                                        <CheckCheck
                                            className="h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <BellOff
                                            className="h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    )}
                                </span>
                                <p className="mt-3 font-semibold text-ink">
                                    {filter === 'unread'
                                        ? "You're all caught up"
                                        : 'No notifications yet'}
                                </p>
                                <p className="mt-1 max-w-xs text-sm text-ink/60">
                                    {filter === 'unread'
                                        ? routes.emptyUnread
                                        : routes.emptyAll}
                                </p>
                            </div>
                        )}

                        {[
                            { label: 'Today', items: today },
                            { label: 'Earlier', items: earlier },
                        ]
                            .filter((group) => group.items.length > 0)
                            .map((group) => (
                                <section
                                    key={group.label}
                                    aria-label={group.label}
                                >
                                    <h3 className="sticky top-0 z-10 bg-surface/95 px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.1em] text-ink/50 uppercase backdrop-blur">
                                        {group.label}
                                    </h3>
                                    <ul className="divide-y divide-ink/5">
                                        {group.items.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onOpen={openNotification}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
