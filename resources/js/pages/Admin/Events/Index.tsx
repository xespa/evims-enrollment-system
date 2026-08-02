import { Head, Link, router, usePage } from '@inertiajs/react';

export default function Index({ events }) {
    const { props } = usePage();

    const destroy = (event) => {
        if (!confirm(`Delete "${event.title}"?`)) return;
        router.delete(route('admin.events.destroy', event.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Manage Events" />
            <div className="min-h-screen bg-gray-50 px-4 py-8">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                            <p className="text-sm text-gray-500">Manage the events shown on the public Events page.</p>
                        </div>
                        <Link
                            href={route('admin.events.create')}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            + New Event
                        </Link>
                    </div>

                    {props.flash?.success && (
                        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {props.flash.success}
                        </div>
                    )}

                    <div className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
                        {events.map((event) => (
                            <div key={event.id} className="flex items-center gap-4 p-4">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                    {event.image_path ? (
                                        <img src={`/storage/${event.image_path}`} alt={event.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">{event.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {event.event_date}{event.location ? ` · ${event.location}` : ''}
                                    </p>
                                </div>
                                {event.tag && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                        {event.tag}
                                    </span>
                                )}
                                <Link href={route('admin.events.edit', event.id)} className="text-sm text-blue-600 hover:underline">
                                    Edit
                                </Link>
                                <button onClick={() => destroy(event)} className="text-sm text-red-600 hover:underline">
                                    Delete
                                </button>
                            </div>
                        ))}

                        {events.length === 0 && (
                            <p className="p-6 text-center text-sm text-gray-400">No events yet. Create your first one.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
