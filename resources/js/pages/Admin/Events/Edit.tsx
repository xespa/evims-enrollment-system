import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ event }) {
    const { data, setData, post, processing, errors } = useForm({
        title: event.title ?? '',
        tag: event.tag ?? '',
        event_date: event.event_date ?? '',
        start_time: event.start_time ?? '',
        end_time: event.end_time ?? '',
        location: event.location ?? '',
        description: event.description ?? '',
        image: null,
        _method: 'patch',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.events.update', event.id), {
            forceFormData: true,
            onSuccess: () => {
                // optional — Inertia already redirects via the server response,
                // this just lets you hook in extra client-side behavior if needed
            },
        });
    };

    return (
        <>
            <Head title={`Edit ${event.title}`} />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-xl">
                        <Link
                            href={route('admin.events.index')}
                            className="mb-4 inline-block text-sm font-medium text-[#2F6F4E] hover:underline"
                        >
                            ← Back to events
                        </Link>
                        <h1 className="mb-6 font-serif text-2xl font-semibold text-[#1F2A24]">
                            Edit Event
                        </h1>

                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            {event.image_path && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                        Current Image
                                    </label>
                                    <img
                                        src={`/storage/${event.image_path}`}
                                        alt={event.title}
                                        className="h-32 w-full rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                    Tag
                                </label>
                                <input
                                    type="text"
                                    value={data.tag}
                                    onChange={(e) =>
                                        setData('tag', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) =>
                                            setData(
                                                'event_date',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                    />
                                    {errors.event_date && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.event_date}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                        Start Time
                                    </label>
                                    <input
                                        type="text"
                                        value={data.start_time}
                                        onChange={(e) =>
                                            setData(
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                        End Time
                                    </label>
                                    <input
                                        type="text"
                                        value={data.end_time}
                                        onChange={(e) =>
                                            setData('end_time', e.target.value)
                                        }
                                        className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={data.location}
                                    onChange={(e) =>
                                        setData('location', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                    Replace Image (optional)
                                </label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) =>
                                        setData(
                                            'image',
                                            e.target.files[0] ?? null,
                                        )
                                    }
                                    className="block w-full text-sm text-[#1F2A24]/70 file:mr-4 file:rounded-full file:border-0 file:bg-[#2F6F4E]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#2F6F4E] hover:file:bg-[#2F6F4E]/15"
                                />
                                {errors.image && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Update Event'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
