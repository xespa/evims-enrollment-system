import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        tag: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        description: '',
        image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.events.store'), { forceFormData: true });
    };

    return (
        <>
            <Head title="New Event" />
            <div className="min-h-screen bg-gray-50 px-4 py-8">
                <div className="mx-auto max-w-xl">
                    <Link href={route('admin.events.index')} className="mb-4 inline-block text-sm text-blue-600 hover:underline">
                        ← Back to events
                    </Link>
                    <h1 className="mb-6 text-2xl font-bold text-gray-900">New Event</h1>

                    <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Tag</label>
                            <input
                                type="text"
                                placeholder="e.g. Whole School, Grades 4-10"
                                value={data.tag}
                                onChange={(e) => setData('tag', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
                                <input
                                    type="date"
                                    value={data.event_date}
                                    onChange={(e) => setData('event_date', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                />
                                {errors.event_date && <p className="mt-1 text-sm text-red-600">{errors.event_date}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                                <input
                                    type="text"
                                    placeholder="8:00 AM"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
                                <input
                                    type="text"
                                    placeholder="12:00 NN"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                            <input
                                type="text"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Image (JPG/PNG/WebP, max 4MB)</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={(e) => setData('image', e.target.files[0] ?? null)}
                                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Create Event'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
