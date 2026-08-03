import { Head, Link } from '@inertiajs/react';

const ANNUAL_HIGHLIGHTS = [
    {
        label: 'June',
        title: 'Foundation Day',
        copy: 'A whole-school assembly celebrating another school year — flag ceremony, teacher tributes, and student performances.',
    },
    {
        label: 'September',
        title: 'Intramurals & Sportsfest',
        copy: 'A week of inter-house sports, cheer competitions, and friendly rivalry across every grade level.',
    },
    {
        label: 'December',
        title: 'Christmas Program',
        copy: 'Carols, classroom presentations, and a community gift-giving drive to close the year with gratitude.',
    },
];

const STAY_UPDATED_STEPS = [
    { mark: 'Step 1', title: 'Check the calendar', copy: "Visit this page regularly — dates are updated as soon as they're confirmed by the registrar." },
    { mark: 'Step 2', title: 'Watch for reminders', copy: 'Homeroom teachers send reminder slips and text blasts a week before major events.' },
    { mark: 'Step 3', title: 'Confirm attendance', copy: "RSVP through your child's homeroom teacher for events that require parent attendance." },
    { mark: 'Step 4', title: 'Relive the moment', copy: 'Photos from each event are posted in the Gallery within a few days.' },
];

function formatDay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export default function Events({ events = [] }) {
    return (
        <>
            <Head title="EVIMS — Events" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        School Events &amp; Calendar
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Moments worth showing up
                        <span className="text-[#2F6F4E]"> for.</span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        From Foundation Day to quarterly recognition programs, EVIMS keeps
                        families close to campus life. Here's what's coming up this school
                        year.
                    </p>

                    <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-[#1F2A24]/10 pt-6">
                        <div>
                            <dt className="text-2xl font-semibold text-[#1F2A24]">{events.length}</dt>
                            <dd className="text-xs text-[#1F2A24]/60">Upcoming events</dd>
                        </div>
                        <div>
                            <dt className="text-2xl font-semibold text-[#1F2A24]">4</dt>
                            <dd className="text-xs text-[#1F2A24]/60">Quarterly recognition days</dd>
                        </div>
                        <div>
                            <dt className="text-2xl font-semibold text-[#1F2A24]">11</dt>
                            <dd className="text-xs text-[#1F2A24]/60">Grade levels involved</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-16">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Mark your calendar</p>
                            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">Upcoming events</h2>
                        </div>
                        <Link href="/contact" className="text-sm font-semibold text-[#2F6F4E] hover:underline">
                            Ask the registrar →
                        </Link>
                    </div>

                    {events.length === 0 ? (
                        <p className="mt-10 rounded-2xl border border-dashed border-[#1F2A24]/15 p-8 text-center text-sm text-[#1F2A24]/50">
                            No events posted yet — check back soon!
                        </p>
                    ) : (
                        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => {
                                const date = formatDay(event.event_date);
                                const day = date.toLocaleDateString('en-US', { day: '2-digit' });
                                const month = date.toLocaleDateString('en-US', { month: 'short' });

                                return (
                                    <div
                                        key={event.id}
                                        className="overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-[#FBF8F2]"
                                    >
                                        <div className="aspect-[4/3] w-full overflow-hidden bg-[#2F6F4E]/10">
                                            {event.image_path ? (
                                                <img
                                                    src={`/storage/${event.image_path}`}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-[#2F6F4E]/30">
                                                    EV
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 p-5">
                                            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#2F6F4E] text-[#FBF8F2]">
                                                <span className="text-lg leading-none font-semibold">{day}</span>
                                                <span className="text-[10px] tracking-[0.1em] uppercase">{month}</span>
                                            </div>
                                            <div>
                                                {event.tag && (
                                                    <span className="inline-block rounded-full bg-[#E8A33D]/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#a4670f] uppercase">
                                                        {event.tag}
                                                    </span>
                                                )}
                                                <h3 className="mt-2 font-serif text-base leading-snug font-semibold text-[#1F2A24]">
                                                    {event.title}
                                                </h3>
                                                {(event.start_time || event.end_time) && (
                                                    <p className="mt-1 text-xs text-[#1F2A24]/60">
                                                        {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
                                                    </p>
                                                )}
                                                {event.location && <p className="text-xs text-[#1F2A24]/60">{event.location}</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Traditions we look forward to</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">Annual highlights</h2>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {ANNUAL_HIGHLIGHTS.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-[#1F2A24]/10 p-6">
                            <p className="text-xs font-semibold text-[#E8A33D] uppercase">{item.label}</p>
                            <h3 className="mt-2 font-serif text-xl font-semibold text-[#1F2A24]">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">{item.copy}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Never miss a date</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">How families stay updated</h2>

                    <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {STAY_UPDATED_STEPS.map((step) => (
                            <li key={step.mark} className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]">
                                <p className="text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">{step.mark}</p>
                                <h3 className="mt-3 font-serif text-lg font-semibold">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/70">{step.copy}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                            Relive the last event.
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Photos from Foundation Day, Intramurals, and every school
                            program are posted in the Gallery.
                        </p>
                    </div>
                    <Link
                        href="/gallery"
                        className="shrink-0 rounded-full bg-[#FBF8F2] px-6 py-3 text-sm font-semibold text-[#2F6F4E] shadow-sm transition-colors hover:bg-white"
                    >
                        View Gallery
                    </Link>
                </div>
            </section>
        </>
    );
}
