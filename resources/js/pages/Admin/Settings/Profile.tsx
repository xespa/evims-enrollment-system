import { Head, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AdminSettingsShell from '@/components/admin-settings-nav';

export default function Profile() {
    const { props } = usePage();
    const user = props.auth?.user;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const deletePasswordInput = useRef(null);

    const profileForm = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
    });

    const deleteForm = useForm({
        password: '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.patch(route('admin.settings.profile.update'), {
            preserveScroll: true,
        });
    };

    const closeDeleteModal = () => {
        setDeleteOpen(false);
        deleteForm.reset();
        deleteForm.clearErrors();
    };

    const submitDelete = (e) => {
        e.preventDefault();
        deleteForm.delete(route('admin.settings.destroy'), {
            preserveScroll: true,
            onError: () => deletePasswordInput.current?.focus(),
        });
    };

    return (
        <>
            <Head title="Profile settings" />

            <AdminSettingsShell>
                {props.flash?.success && (
                    <div className="rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                        {props.flash.success}
                    </div>
                )}

                {/* Profile */}
                <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6">
                    <h2 className="font-serif text-lg font-semibold text-[#1F2A24]">
                        Profile
                    </h2>
                    <p className="mt-1 text-sm text-[#1F2A24]/60">
                        Update your name and email address
                    </p>

                    <form onSubmit={submitProfile} className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                Name
                            </label>
                            <input
                                type="text"
                                value={profileForm.data.name}
                                onChange={(e) =>
                                    profileForm.setData('name', e.target.value)
                                }
                                autoComplete="name"
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />
                            {profileForm.errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {profileForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) =>
                                    profileForm.setData('email', e.target.value)
                                }
                                autoComplete="username"
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />
                            {profileForm.errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {profileForm.errors.email}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={profileForm.processing}
                            className="rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                        >
                            {profileForm.processing ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                </div>

                {/* Danger zone */}
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <h2 className="font-serif text-lg font-semibold text-[#1F2A24]">
                        Delete account
                    </h2>
                    <p className="mt-1 text-sm text-[#1F2A24]/60">
                        Delete your account and all of its resources
                    </p>

                    <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                        <p className="text-sm font-medium text-red-700">
                            Warning
                        </p>
                        <p className="mt-1 text-sm text-red-600/80">
                            Please proceed with caution, this cannot be undone.
                        </p>
                        <button
                            type="button"
                            onClick={() => setDeleteOpen(true)}
                            className="mt-3 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                        >
                            Delete account
                        </button>
                    </div>
                </div>
            </AdminSettingsShell>

            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="fixed inset-0 bg-black/40"
                        onClick={closeDeleteModal}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-[#1F2A24]/10 bg-white p-6 shadow-xl">
                        <h3 className="font-serif text-lg font-semibold text-[#1F2A24]">
                            Are you sure you want to delete your account?
                        </h3>
                        <p className="mt-2 text-sm text-[#1F2A24]/70">
                            Once your account is deleted, all of its resources
                            and data will also be permanently deleted. Please
                            enter your password to confirm you would like to
                            permanently delete your account.
                        </p>

                        <form
                            onSubmit={submitDelete}
                            className="mt-4 space-y-4"
                        >
                            <div>
                                <label
                                    className="sr-only"
                                    htmlFor="delete-password"
                                >
                                    Password
                                </label>
                                <input
                                    id="delete-password"
                                    ref={deletePasswordInput}
                                    type="password"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    value={deleteForm.data.password}
                                    onChange={(e) =>
                                        deleteForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                />
                                {deleteForm.errors.password && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {deleteForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="rounded-full border border-[#1F2A24]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                                >
                                    Delete account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
