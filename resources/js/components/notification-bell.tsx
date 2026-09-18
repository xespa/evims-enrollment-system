import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function timeAgo(dateString) {
    const seconds = Math.floor(
        (Date.now() - new Date(dateString).getTime()) / 1000,
    );
    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(dateString).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });
}

export default function NotificationBell() {
    const { props } = usePage();
    const enrollee = props.auth?.enrollee;

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(
        props.auth?.unreadNotificationsCount ?? 0,
    );
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setUnreadCount(props.auth?.unreadNotificationsCount ?? 0);
    }, [props.auth?.unreadNotificationsCount]);

    useEffect(() => {
        if (!open) return;

        const closeOnOutsideClick = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    const toggleOpen = () => {
        const next = !open;
        setOpen(next);

        if (next) {
            setLoading(true);
            fetch(route('portal.notifications.index'), {
                headers: { Accept: 'application/json' },
            })
                .then((res) => res.json())
                .then((data) => {
                    setNotifications(data.notifications ?? []);
                    setUnreadCount(data.unread_count ?? 0);
                })
                .finally(() => setLoading(false));
        }
    };

    const openNotification = (notification) => {
        setOpen(false);

        if (!notification.read_at) {
            setUnreadCount((count) => Math.max(0, count - 1));
            router.post(
                route('portal.notifications.read', notification.id),
                {},
                { preserveScroll: true, preserveState: true },
            );
        }

        router.visit(notification.data.url ?? route('portal.dashboard'));
    };

    const markAllRead = () => {
        setUnreadCount(0);
        setNotifications((list) =>
            list.map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
            })),
        );
        router.post(
            route('portal.notifications.readAll'),
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    if (!enrollee) return null;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={toggleOpen}
                aria-label="Notifications"
                aria-expanded={open}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E8A33D] px-1 text-[10px] font-semibold text-[#1F2A24]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#1F2A24]/10 bg-[#FBF8F2] shadow-lg">
                    <div className="flex items-center justify-between border-b border-[#1F2A24]/10 px-4 py-3">
                        <p className="text-sm font-semibold text-[#1F2A24]">
                            Notifications
                        </p>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs font-medium text-[#2F6F4E] hover:underline"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading && (
                            <p className="px-4 py-6 text-center text-sm text-[#1F2A24]/50">
                                Loading...
                            </p>
                        )}

                        {!loading && notifications.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-[#1F2A24]/50">
                                No notifications yet.
                            </p>
                        )}

                        {!loading &&
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() =>
                                        openNotification(notification)
                                    }
                                    className={`block w-full border-b border-[#1F2A24]/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#1F2A24]/5 ${
                                        notification.read_at
                                            ? ''
                                            : 'bg-[#2F6F4E]/5'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {!notification.read_at && (
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F6F4E]" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[#1F2A24]">
                                                {notification.data.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#1F2A24]/60">
                                                {notification.data.message}
                                            </p>
                                            <p className="mt-1 text-[10px] text-[#1F2A24]/40">
                                                {timeAgo(
                                                    notification.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
