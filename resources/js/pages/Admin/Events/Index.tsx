import { Head, router, usePage } from '@inertiajs/react';
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

    return (
        <>
            <Head title="Manage Events" />
            {confirmDialog}
            <EventFormDialog
                event={editingEvent}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Events
                            </h1>
                            <p className="text-sm text-[#1F2A24]/70">
                                Post events for families to see on the public
                                Events page.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            New Event
                        </button>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    <p className="mb-4 text-sm text-[#1F2A24]/60">
                        {events.length === 1
                            ? '1 posted event'
                            : `${events.length} posted events`}
                    </p>

                    {events.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white px-6 py-14 text-center">
                            <CalendarDays
                                className="h-10 w-10 text-[#2F6F4E]/60"
                                aria-hidden="true"
                            />
                            <p className="mt-3 font-medium text-[#1F2A24]">
                                No events posted yet
                            </p>
                            <>
                                <p className="mt-1 text-sm text-[#1F2A24]/65">
                                    Post one so families can see what's
                                    happening at school.
                                </p>
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
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
                                        className="flex flex-col overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white shadow-sm"
                                    >
                                        <div className="relative h-36 bg-[#2F6F4E]/10">
                                            {event.image_path ? (
                                                <img
                                                    src={`/storage/${event.image_path}`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <CalendarDays
                                                        className="h-10 w-10 text-[#2F6F4E]/40"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex w-14 flex-col items-center rounded-xl bg-white py-1.5 shadow-md">
                                                <span className="text-[11px] font-semibold tracking-wide text-[#C6473B] uppercase">
                                                    {day.toLocaleDateString(
                                                        'en-PH',
                                                        { month: 'short' },
                                                    )}
                                                </span>
                                                <span className="font-serif text-xl leading-none font-semibold text-[#1F2A24]">
                                                    {day.getDate()}
                                                </span>
                                            </div>
                                            {event.tag && (
                                                <span className="absolute top-3 right-3 rounded-full bg-[#E8A33D] px-2.5 py-1 text-xs font-semibold text-[#1F2A24]">
                                                    {event.tag}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col p-4">
                                            <h2 className="font-semibold text-[#1F2A24]">
                                                {event.title}
                                            </h2>
                                            <dl className="mt-2 space-y-1 text-sm text-[#1F2A24]/70">
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
                                                <p className="mt-2 line-clamp-2 text-sm text-[#1F2A24]/60">
                                                    {event.description}
                                                </p>
                                            )}

                                            <div className="mt-auto flex gap-2 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(event)
                                                    }
                                                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#2F6F4E]/30 text-sm font-semibold text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5"
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
                                                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#C6473B]/25 text-[#C6473B] transition-colors hover:bg-[#C6473B]/5"
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
