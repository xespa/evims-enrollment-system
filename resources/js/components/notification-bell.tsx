import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    BellOff,
    CheckCheck,
    CircleAlert,
    CircleCheck,
    FileWarning,
    Info,
    Mail,
    MailCheck,
    ReceiptText,
    RotateCcw,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

type Notification = {
    id: string;
    read_at: string | null;
    created_at: string;
    data: {
        type?: string;
        status?: string;
        title: string;
        message: string;
        url?: string;
    };
};

type Filter = 'all' | 'unread';

/** Icon and colours for each kind of notification. */
function appearance(notification: Notification): {
    icon: LucideIcon;
    tone: string;
} {
    switch (notification.data.type) {
        case 'enrollment_status_changed':
            return notification.data.status === 'APPROVED'
                ? { icon: CircleCheck, tone: 'bg-[#2E8057]/12 text-[#22613F]' }
                : { icon: Info, tone: 'bg-[#E8A33D]/15 text-[#8A5A12]' };
        case 'document_reminder':
            return {
                icon: FileWarning,
                tone: 'bg-[#E8A33D]/15 text-[#8A5A12]',
            };
        case 'payment_received':
            return { icon: Wallet, tone: 'bg-[#2E8057]/12 text-[#22613F]' };
        case 'payment_voided':
            return { icon: RotateCcw, tone: 'bg-[#C6473B]/10 text-[#9A3329]' };
        case 'confirm_email':
            return { icon: Mail, tone: 'bg-[#E8A33D]/15 text-[#8A5A12]' };
        case 'email_confirmed':
            return { icon: MailCheck, tone: 'bg-[#2E8057]/12 text-[#22613F]' };
        case 'account_reviewed':
            return notification.data.status === 'APPROVED'
                ? { icon: CircleCheck, tone: 'bg-[#2E8057]/12 text-[#22613F]' }
                : {
                      icon: CircleAlert,
                      tone: 'bg-[#C6473B]/10 text-[#9A3329]',
                  };
        default:
            return {
                icon: ReceiptText,
                tone: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
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
                className={`group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1F2A24]/[0.04] focus-visible:bg-[#1F2A24]/[0.04] focus-visible:outline-none ${
                    isUnread ? 'bg-[#2F6F4E]/[0.05]' : ''
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
                                    ? 'font-semibold text-[#1F2A24]'
                                    : 'font-medium text-[#1F2A24]/80'
                            }`}
                        >
                            {notification.data.title}
                        </span>
                        <span className="mt-0.5 shrink-0 text-[11px] text-[#1F2A24]/50 tabular-nums">
                            {timeAgo(notification.created_at)}
                        </span>
                    </span>
                    <span className="mt-0.5 line-clamp-3 block text-[13px] leading-snug text-[#1F2A24]/65">
                        {notification.data.message}
                    </span>
                </span>
                {isUnread && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2F6F4E]">
                        <span className="sr-only">Unread</span>
                    </span>
                )}
            </button>
        </li>
    );
}

function LoadingRows() {
    return (
        <ul className="divide-y divide-[#1F2A24]/5" aria-hidden="true">
            {[0, 1, 2].map((row) => (
                <li key={row} className="flex gap-3 px-4 py-3">
                    <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#1F2A24]/10 motion-reduce:animate-none" />
                    <span className="flex-1 space-y-2 py-1">
                        <span className="block h-3 w-2/3 animate-pulse rounded bg-[#1F2A24]/10 motion-reduce:animate-none" />
                        <span className="block h-3 w-full animate-pulse rounded bg-[#1F2A24]/10 motion-reduce:animate-none" />
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default function NotificationBell() {
    const { props } = usePage<{
        auth?: {
            enrollee?: { id: number } | null;
            unreadNotificationsCount?: number;
        };
    }>();
    const enrollee = props.auth?.enrollee;

    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');
    const [notifications, setNotifications] = useState<Notification[] | null>(
        null,
    );
    const [unreadCount, setUnreadCount] = useState(
        props.auth?.unreadNotificationsCount ?? 0,
    );
    const [loadFailed, setLoadFailed] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    useEffect(() => {
        setUnreadCount(props.auth?.unreadNotificationsCount ?? 0);
    }, [props.auth?.unreadNotificationsCount]);

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

    const load = () => {
        setLoadFailed(false);
        fetch(route('portal.notifications.index'), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                setNotifications(data.notifications ?? []);
                setUnreadCount(data.unread_count ?? 0);
            })
            .catch(() => setLoadFailed(true));
    };

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
            postInBackground(
                route('portal.notifications.read', notification.id),
            );
        }

        router.visit(notification.data.url ?? route('portal.dashboard'));
    };

    const markAllRead = () => {
        setUnreadCount(0);
        setNotifications((list) =>
            (list ?? []).map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
            })),
        );
        postInBackground(route('portal.notifications.read-all'));
    };

    if (!enrollee) return null;

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
                        ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                        : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]'
                }`}
            >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span
                        className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C6473B] px-1 text-[10px] font-bold text-white ring-2 ring-[#FBF8F2]"
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
                    className="fixed inset-x-3 top-24 z-50 flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white shadow-2xl shadow-[#1F2A24]/15 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:max-h-[32rem] sm:w-[26rem]"
                >
                    <div className="border-b border-[#1F2A24]/10 px-4 pt-4 pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#1F2A24]">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-[#C6473B]/10 px-2 py-0.5 font-sans text-xs font-semibold text-[#9A3329]">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h2>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/10"
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
                            className="mt-3 inline-flex rounded-full bg-[#1F2A24]/5 p-1"
                        >
                            {(['all', 'unread'] as const).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFilter(key)}
                                    aria-pressed={filter === key}
                                    className={`min-h-8 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                                        filter === key
                                            ? 'bg-white text-[#1F2A24] shadow-sm'
                                            : 'text-[#1F2A24]/60 hover:text-[#1F2A24]'
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
                                <p className="text-sm text-[#1F2A24]/70">
                                    Couldn't load your notifications.
                                </p>
                                <button
                                    type="button"
                                    onClick={load}
                                    className="mt-3 inline-flex min-h-10 items-center rounded-full border border-[#1F2A24]/15 px-4 text-sm font-semibold text-[#1F2A24] hover:bg-[#1F2A24]/5"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {notifications !== null && visible.length === 0 && (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-[#2F6F4E]">
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
                                <p className="mt-3 font-semibold text-[#1F2A24]">
                                    {filter === 'unread'
                                        ? "You're all caught up"
                                        : 'No notifications yet'}
                                </p>
                                <p className="mt-1 max-w-xs text-sm text-[#1F2A24]/60">
                                    {filter === 'unread'
                                        ? 'New updates about your application and payments will show here.'
                                        : "We'll let you know when there's news about your application or payments."}
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
                                    <h3 className="sticky top-0 z-10 bg-white/95 px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.1em] text-[#1F2A24]/50 uppercase backdrop-blur">
                                        {group.label}
                                    </h3>
                                    <ul className="divide-y divide-[#1F2A24]/5">
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
