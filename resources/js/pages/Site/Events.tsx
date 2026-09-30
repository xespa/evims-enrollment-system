import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BellRing,
    CalendarCheck,
    CalendarDays,
    CalendarPlus,
    Clock,
    Gift,
    MapPin,
    PartyPopper,
    Trophy,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';

type SchoolEvent = {
    id: number;
    title: string;
    tag: string | null;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    description: string | null;
    image_path: string | null;
};

type Props = {
    events: SchoolEvent[];
};

const ANNUAL_HIGHLIGHTS = [
    {
        icon: PartyPopper,
        label: 'June',
        title: 'Foundation Day',
        copy: 'A whole-school assembly celebrating another school year — flag ceremony, teacher tributes, and student performances.',
    },
    {
        icon: Trophy,
        label: 'September',
        title: 'Intramurals & Sportsfest',
        copy: 'A week of inter-house sports, cheer competitions, and friendly rivalry across every grade level.',
    },
    {
        icon: Gift,
        label: 'December',
        title: 'Christmas Program',
        copy: 'Carols, classroom presentations, and a community gift-giving drive to close the year with gratitude.',
    },
];

const STAY_UPDATED_STEPS = [
    {
        icon: CalendarDays,
        title: 'Check the calendar',
        copy: "Visit this page regularly — dates are updated as soon as they're confirmed by the registrar.",
    },
    {
        icon: CalendarPlus,
        title: 'Save the date',
        copy: 'Open any event and use “Add to calendar” to put it on your phone or computer calendar.',
    },
    {
        icon: BellRing,
        title: 'Watch for reminders',
        copy: 'Homeroom teachers send reminder slips and text blasts a week before major events.',
    },
    {
        icon: UserCheck,
        title: 'Confirm attendance',
        copy: "RSVP through your child's homeroom teacher for events that require parent attendance.",
    },
];

/** "2026-12-08T00:00:00.000000Z" → a local date for that calendar day. */
function eventDay(event: SchoolEvent): Date {
    const [y, m, d] = event.event_date.slice(0, 10).split('-').map(Number);

    return new Date(y, m - 1, d);
}

function timeRange(event: SchoolEvent): string | null {
    if (event.start_time && event.end_time) {
        return `${event.start_time} – ${event.end_time}`;
    }

    return event.start_time || event.end_time || null;
}

const longDate = (date: Date) =>
    date.toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

/** Escapes text for an iCalendar field. */
function icsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

/**
 * Downloads the event as an .ics file that phone and computer calendars
 * can import. It's an all-day entry, since event times are free text
 * (e.g. "8:00 AM"); the time goes in the notes instead.
 */
function downloadCalendarFile(event: SchoolEvent) {
    const date = eventDay(event);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const ymd = (d: Date) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const stamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d+Z$/, 'Z');

    const notes = [timeRange(event), event.description]
        .filter(Boolean)
        .join('\n\n');
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//EVIMS//School Events//EN',
        'BEGIN:VEVENT',
        `UID:evims-event-${event.id}@evims`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(date)}`,
        `DTEND;VALUE=DATE:${ymd(next)}`,
        `SUMMARY:${icsText(event.title)}`,
        event.location ? `LOCATION:${icsText(event.location)}` : null,
        notes ? `DESCRIPTION:${icsText(notes)}` : null,
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean);

    const url = URL.createObjectURL(
        new Blob([lines.join('\r\n')], { type: 'text/calendar' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${
        event.title
            .replace(/[^\w]+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase() || 'event'
    }.ics`;
    link.click();
    URL.revokeObjectURL(url);
}

function EventImage({
    event,
    className = '',
}: {
    event: SchoolEvent;
    className?: string;
}) {
    return event.image_path ? (
        <img
            src={`/storage/${event.image_path}`}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover ${className}`}
        />
    ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2F6F4E]/15 to-[#E8A33D]/15">
            <CalendarDays
                className="h-10 w-10 text-[#2F6F4E]/40"
                aria-hidden="true"
            />
        </div>
    );
}

function DateBadge({ date }: { date: Date }) {
    return (
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-white py-1.5 shadow-md">
            <span className="text-[11px] font-semibold tracking-wide text-[#C6473B] uppercase">
                {date.toLocaleDateString('en-PH', { month: 'short' })}
            </span>
            <span className="font-serif text-xl leading-none font-semibold text-[#1F2A24]">
                {date.getDate()}
            </span>
        </div>
    );
}

function EventMeta({ event }: { event: SchoolEvent }) {
    const time = timeRange(event);

    return (
        <dl className="space-y-1 text-sm text-[#1F2A24]/70">
            {time && (
                <div className="flex items-center gap-2">
                    <dt className="sr-only">Time</dt>
                    <Clock
                        className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                        aria-hidden="true"
                    />
                    <dd>{time}</dd>
                </div>
            )}
            {event.location && (
                <div className="flex items-center gap-2">
                    <dt className="sr-only">Location</dt>
                    <MapPin
                        className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                        aria-hidden="true"
                    />
                    <dd className="truncate">{event.location}</dd>
                </div>
            )}
        </dl>
    );
}

function EventCard({
    event,
    onOpen,
}: {
    event: SchoolEvent;
    onOpen: (event: SchoolEvent) => void;
}) {
    const date = eventDay(event);

    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(event)}
                className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#2F6F4E]/25 hover:shadow-lg hover:shadow-[#1F2A24]/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
            >
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <EventImage
                        event={event}
                        className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                    <div className="absolute top-3 left-3">
                        <DateBadge date={date} />
                    </div>
                    {event.tag && (
                        <span className="absolute top-3 right-3 rounded-full bg-[#E8A33D] px-2.5 py-1 text-xs font-semibold text-[#1F2A24]">
                            {event.tag}
                        </span>
                    )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold text-[#2F6F4E]">
                        {longDate(date)}
                    </p>
                    <h3 className="mt-1.5 font-serif text-lg leading-snug font-semibold text-[#1F2A24]">
                        {event.title}
                    </h3>
                    <div className="mt-3">
                        <EventMeta event={event} />
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[#2F6F4E]">
                        View details
                        <ArrowRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                            aria-hidden="true"
                        />
                    </span>
                </div>
            </button>
        </li>
    );
}

function EventDetailsDialog({
    event,
    onClose,
}: {
    event: SchoolEvent | null;
    onClose: () => void;
}) {
    const date = event ? eventDay(event) : null;

    return (
        <Dialog
            open={event !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-xl">
                {event && date && (
                    <>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
                            <EventImage event={event} />
                            {event.tag && (
                                <span className="absolute bottom-3 left-4 rounded-full bg-[#E8A33D] px-2.5 py-1 text-xs font-semibold text-[#1F2A24]">
                                    {event.tag}
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            <p className="text-sm font-semibold text-[#2F6F4E]">
                                {longDate(date)}
                            </p>
                            <DialogTitle className="mt-1.5 font-serif text-2xl leading-tight font-semibold">
                                {event.title}
                            </DialogTitle>
                            <div className="mt-4">
                                <EventMeta event={event} />
                            </div>
                            <DialogDescription asChild>
                                <div className="mt-5 border-t border-[#1F2A24]/10 pt-5 text-[15px] leading-relaxed whitespace-pre-line text-[#1F2A24]/80">
                                    {event.description ||
                                        'More details will be shared by your child’s homeroom teacher.'}
                                </div>
                            </DialogDescription>
                            <button
                                type="button"
                                onClick={() => downloadCalendarFile(event)}
                                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] sm:w-auto"
                            >
                                <CalendarPlus
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Add to calendar
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function Events({ events = [] }: Props) {
    const [openEvent, setOpenEvent] = useState<SchoolEvent | null>(null);

    // Newest date first; the first one is featured at the top.
    const [latestEvent, ...otherEvents] = events;
    const latestDate = latestEvent ? eventDay(latestEvent) : null;

    return (
        <>
            <Head title="EVIMS — Events" />
            <EventDetailsDialog
                event={openEvent}
                onClose={() => setOpenEvent(null)}
            />

            {/* Hero, featuring the latest event */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#E8A33D]/15 blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                            School Events &amp; Calendar
                        </span>
                        <h1 className="mt-5 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                            Moments worth showing up
                            <span className="text-[#2F6F4E]"> for.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                            From Foundation Day to quarterly recognition
                            programs, EVIMS keeps families close to campus life.
                            Here's what's happening at EVIMS.
                        </p>
                        <dl className="mt-8 flex flex-wrap gap-3">
                            <div className="rounded-2xl border border-[#1F2A24]/10 bg-white px-5 py-3">
                                <dt className="text-xs text-[#1F2A24]/60">
                                    Posted events
                                </dt>
                                <dd className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                    {events.length}
                                </dd>
                            </div>
                            <div className="rounded-2xl border border-[#1F2A24]/10 bg-white px-5 py-3">
                                <dt className="text-xs text-[#1F2A24]/60">
                                    Recognition days a year
                                </dt>
                                <dd className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                    4
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {latestEvent && latestDate ? (
                        <button
                            type="button"
                            onClick={() => setOpenEvent(latestEvent)}
                            className="group relative overflow-hidden rounded-[2rem] bg-[#1B4D34] text-left shadow-2xl shadow-[#1F2A24]/15"
                        >
                            <div className="aspect-[16/10] w-full">
                                <EventImage
                                    event={latestEvent}
                                    className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A1C] via-[#0F2A1C]/55 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8A33D] px-3 py-1 text-xs font-semibold text-[#1F2A24]">
                                    <CalendarCheck
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                    Latest event
                                </span>
                                <h2 className="mt-3 font-serif text-2xl leading-tight font-semibold text-white sm:text-3xl">
                                    {latestEvent.title}
                                </h2>
                                <p className="mt-2 text-sm text-white/85">
                                    {longDate(latestDate)}
                                    {timeRange(latestEvent)
                                        ? ` · ${timeRange(latestEvent)}`
                                        : ''}
                                    {latestEvent.location
                                        ? ` · ${latestEvent.location}`
                                        : ''}
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
                                    View details
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                                        aria-hidden="true"
                                    />
                                </span>
                            </div>
                        </button>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#1F2A24]/20 bg-white px-8 py-16 text-center">
                            <CalendarDays
                                className="h-12 w-12 text-[#2F6F4E]/50"
                                aria-hidden="true"
                            />
                            <p className="mt-4 font-serif text-xl font-semibold text-[#1F2A24]">
                                No events posted yet
                            </p>
                            <p className="mt-1 max-w-sm text-sm text-[#1F2A24]/65">
                                School events are posted here as soon as they're
                                announced — check back soon.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Every other posted event */}
            {otherEvents.length > 0 && (
                <section className="border-y border-[#1F2A24]/10 bg-white">
                    <div className="mx-auto max-w-7xl px-5 py-16">
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                            School events
                        </p>
                        <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                            More events
                        </h2>
                        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {otherEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onOpen={setOpenEvent}
                                />
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Annual traditions */}
            <section>
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Traditions we look forward to
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Annual highlights
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {ANNUAL_HIGHLIGHTS.map(({ icon: Icon, ...item }) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8A33D]/15 text-[#8A5A12]">
                                        <Icon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F6F4E]">
                                        Every {item.label}
                                    </span>
                                </div>
                                <h3 className="mt-4 font-serif text-xl font-semibold text-[#1F2A24]">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {item.copy}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Staying updated */}
            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    Never miss a date
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    How families stay updated
                </h2>

                <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {STAY_UPDATED_STEPS.map(
                        ({ icon: Icon, ...step }, index) => (
                            <li
                                key={step.title}
                                className="rounded-2xl bg-[#1B4D34] p-6 text-[#FBF8F2]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E8A33D]">
                                        <Icon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span
                                        className="font-serif text-3xl font-semibold text-white/15"
                                        aria-hidden="true"
                                    >
                                        {index + 1}
                                    </span>
                                </div>
                                <h3 className="mt-4 font-serif text-lg font-semibold">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/75">
                                    {step.copy}
                                </p>
                            </li>
                        ),
                    )}
                </ol>
            </section>

            {/* Closing call to action */}
            <section className="px-5 pb-16">
                <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#1B4D34] px-6 py-12 sm:px-12">
                    <div
                        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#E8A33D]/20 blur-2xl"
                        aria-hidden="true"
                    />
                    <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                                Questions about an event?
                            </h2>
                            <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                                Our office is happy to help with schedules, what
                                to bring, and who can attend.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-3">
                            <Link
                                href="/contact"
                                className="inline-flex min-h-12 items-center rounded-full border border-[#FBF8F2]/40 px-6 text-sm font-semibold text-[#FBF8F2] transition-colors hover:border-[#FBF8F2] hover:bg-white/5"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/admission"
                                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E8A33D] px-6 text-sm font-semibold text-[#1F2A24] shadow-lg shadow-black/20 transition-colors hover:bg-[#F0B458]"
                            >
                                Enroll Now
                                <ArrowRight
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
