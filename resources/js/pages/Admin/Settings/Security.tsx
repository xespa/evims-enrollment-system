import { Head, useForm, usePage } from '@inertiajs/react';
import AdminSettingsShell from '@/components/admin-settings-nav';

export default function Security({ passwordRules }) {
    const { props } = usePage();

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.put(route('admin.settings.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: () => {
                if (
                    passwordForm.errors.password ||
                    passwordForm.errors.password_confirmation
                ) {
                    passwordForm.reset('password', 'password_confirmation');
                }
                if (passwordForm.errors.current_password) {
                    passwordForm.reset('current_password');
                }
            },
        });
    };

    return (
        <>
            <Head title="Security settings" />

            <AdminSettingsShell>
                {props.flash?.success && (
                    <div className="rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                        {props.flash.success}
                    </div>
                )}

                <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6">
                    <h2 className="font-serif text-lg font-semibold text-[#1F2A24]">
                        Update password
                    </h2>
                    <p className="mt-1 text-sm text-[#1F2A24]/60">
                        Ensure your account is using a long, random password to
                        stay secure
                    </p>

                    <form onSubmit={submitPassword} className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                Current password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        'current_password',
                                        e.target.value,
                                    )
                                }
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />
                            {passwordForm.errors.current_password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {passwordForm.errors.current_password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                New password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                passwordrules={passwordRules}
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />
                            {passwordForm.errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {passwordForm.errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-[#1F2A24]/80">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) =>
                                    passwordForm.setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                passwordrules={passwordRules}
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />
                            {passwordForm.errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600">
                                    {passwordForm.errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={passwordForm.processing}
                            className="rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                        >
                            {passwordForm.processing ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                </div>
            </AdminSettingsShell>
        </>
    );
}
