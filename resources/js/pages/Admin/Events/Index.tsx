import { Head, router, usePage, setLayoutProps } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    MapPin,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import EventFormDialog from '@/components/event-form-dialog';
import type { SchoolEvent } from '@/components/event-form-dialog';
import { useConfirm } from '@/hooks/use-confirm';

/** "2026-10-05T00:00:00.000000Z" → a local date for that calendar day. */
function eventDay(event: SchoolEvent): Date {
    return new Date(`${event.event_date.slice(0, 10)}T00:00:00`);
}

function timeRange(event: SchoolEvent): string | null {
    if (event.start_time && event.end_time) {
        return `${event.start_time} – ${event.end_time}`;
    }

    return event.start_time || event.end_time || null;
}

export default function Index({ events }: { events: SchoolEvent[] }) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [confirm, confirmDialog] = useConfirm();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);

    const openCreate = () => {
        setEditingEvent(null);
        setIsFormOpen(true);
    };

    const openEdit = (event: SchoolEvent) => {
        setEditingEvent(event);
        setIsFormOpen(true);
    };

    const destroy = async (event: SchoolEvent) => {
        const confirmed = await confirm({
            title: `Delete "${event.title}"?`,
            description:
                'It will be removed from the public Events page. This cannot be undone.',
            confirmLabel: 'Delete Event',
            destructive: true,
        });
        if (!confirmed) return;
        router.delete(route('admin.events.destroy', event.id), {
            preserveScroll: true,
        });
    };
    setLayoutProps({
        title: 'Events',
        help: 'Post events for families to see on the public Events page.',
    });

    return (
        <>
            <Head title="Manage Events" />
            {confirmDialog}
            <EventFormDialog
                event={editingEvent}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            <div className="bg-cream px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex justify-end">
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            New Event
                        </button>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    <p className="mb-4 text-sm text-ink/60">
                        {events.length === 1
                            ? '1 posted event'
                            : `${events.length} posted events`}
                    </p>

                    {events.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
                            <CalendarDays
                                className="h-10 w-10 text-brand-ink/60"
                                aria-hidden="true"
                            />
                            <p className="mt-3 font-medium text-ink">
                                No events posted yet
                            </p>
                            <>
                                <p className="mt-1 text-sm text-ink/65">
                                    Post one so families can see what's
                                    happening at school.
                                </p>
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand/30 px-5 text-sm font-semibold text-brand-ink hover:bg-brand/5"
                                >
                                    <Plus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    New Event
                                </button>
                            </>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => {
                                const day = eventDay(event);
                                const time = timeRange(event);

                                return (
                                    <li
                                        key={event.id}
                                        className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-sm"
                                    >
                                        <div className="relative h-36 bg-brand/10">
                                            {event.image_path ? (
                                                <img
                                                    src={`/storage/${event.image_path}`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <CalendarDays
                                                        className="h-10 w-10 text-brand-ink/40"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex w-14 flex-col items-center rounded-xl bg-surface py-1.5 shadow-md">
                                                <span className="text-[11px] font-semibold tracking-wide text-danger-ink uppercase">
                                                    {day.toLocaleDateString(
                                                        'en-PH',
                                                        { month: 'short' },
                                                    )}
                                                </span>
                                                <span className="font-serif text-xl leading-none font-semibold text-ink">
                                                    {day.getDate()}
                                                </span>
                                            </div>
                                            {event.tag && (
                                                <span className="absolute top-3 right-3 rounded-full bg-warn px-2.5 py-1 text-xs font-semibold text-ink">
                                                    {event.tag}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col p-4">
                                            <h2 className="font-semibold text-ink">
                                                {event.title}
                                            </h2>
                                            <dl className="mt-2 space-y-1 text-sm text-ink/70">
                                                <div className="flex items-center gap-2">
                                                    <dt className="sr-only">
                                                        Date
                                                    </dt>
                                                    <CalendarDays
                                                        className="h-4 w-4 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <dd>
                                                        {day.toLocaleDateString(
                                                            'en-PH',
                                                            {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </dd>
                                                </div>
                                                {time && (
                                                    <div className="flex items-center gap-2">
                                                        <dt className="sr-only">
                                                            Time
                                                        </dt>
                                                        <Clock
                                                            className="h-4 w-4 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                        <dd>{time}</dd>
                                                    </div>
                                                )}
                                                {event.location && (
                                                    <div className="flex items-center gap-2">
                                                        <dt className="sr-only">
                                                            Location
                                                        </dt>
                                                        <MapPin
                                                            className="h-4 w-4 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                        <dd className="truncate">
                                                            {event.location}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                            {event.description && (
                                                <p className="mt-2 line-clamp-2 text-sm text-ink/60">
                                                    {event.description}
                                                </p>
                                            )}

                                            <div className="mt-auto flex gap-2 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(event)
                                                    }
                                                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-brand/30 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5"
                                                >
                                                    <Pencil
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        destroy(event)
                                                    }
                                                    aria-label={`Delete ${event.title}`}
                                                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-danger/25 text-danger-ink transition-colors hover:bg-danger/5"
                                                >
                                                    <Trash2
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
