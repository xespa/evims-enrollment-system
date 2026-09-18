import { Head, Link, router, usePage } from '@inertiajs/react';

export default function Index({ events }) {
    const { props } = usePage();

    const destroy = (event) => {
        if (!confirm(`Delete "${event.title}"?`)) return;
        router.delete(route('admin.events.destroy', event.id), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Manage Events" />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Events
                            </h1>
                            <p className="text-sm text-[#1F2A24]/60">
                                Manage the events shown on the public Events
                                page.
                            </p>
                        </div>
                        <Link
                            href={route('admin.events.create')}
                            className="rounded-full bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                        >
                            + New Event
                        </Link>
                    </div>

                    {props.flash?.success && (
                        <div className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                            {props.flash.success}
                        </div>
                    )}

                    <div className="divide-y divide-[#1F2A24]/10 rounded-2xl border border-[#1F2A24]/10 bg-white">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center gap-4 p-4"
                            >
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#2F6F4E]/10">
                                    {event.image_path ? (
                                        <img
                                            src={`/storage/${event.image_path}`}
                                            alt={event.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-[#1F2A24]/40">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[#1F2A24]">
                                        {event.title}
                                    </p>
                                    <p className="text-xs text-[#1F2A24]/60">
                                        {event.event_date}
                                        {event.location
                                            ? ` · ${event.location}`
                                            : ''}
                                    </p>
                                </div>
                                {event.tag && (
                                    <span className="rounded-full bg-[#E8A33D]/15 px-2.5 py-1 text-xs font-semibold text-[#a4670f]">
                                        {event.tag}
                                    </span>
                                )}
                                <Link
                                    href={route('admin.events.edit', event.id)}
                                    className="text-sm font-medium text-[#2F6F4E] hover:underline"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={() => destroy(event)}
                                    className="text-sm font-medium text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}

                        {events.length === 0 && (
                            <p className="p-6 text-center text-sm text-[#1F2A24]/40">
                                No events yet. Create your first one.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
