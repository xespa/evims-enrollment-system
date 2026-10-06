import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Camera, Loader2, Mail, Trash2, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import AdminAvatar from '@/components/admin-avatar';
import AdminSettingsShell from '@/components/admin-settings-nav';
import {
    SettingsField,
    SettingsFormFooter,
    SettingsSection,
    settingsInputClass,
} from '@/components/admin-settings-section';
import PasswordInput from '@/components/password-input';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useConfirm } from '@/hooks/use-confirm';
import admin from '@/routes/admin';

const memberSinceFormat = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
});

/** Kept in step with UpdateProfilePhotoRequest. */
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export default function Profile() {
    const { auth } = usePage().props;
    const user = auth.user;
    const [confirm, confirmDialog] = useConfirm();

    const photoInput = useRef<HTMLInputElement>(null);
    const [isPhotoBusy, setIsPhotoBusy] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    const choosePhoto = () => photoInput.current?.click();

    const photoRequestOptions = {
        preserveScroll: true,
        onStart: () => setIsPhotoBusy(true),
        onFinish: () => setIsPhotoBusy(false),
        onSuccess: () => setPhotoError(null),
        onError: (errors: Record<string, string>) =>
            setPhotoError(errors.photo ?? 'The photo could not be saved.'),
    };

    const uploadPhoto = (e: ChangeEvent<HTMLInputElement>) => {
        const photo = e.target.files?.[0];
        // Cleared so picking the same file again still fires a change.
        e.target.value = '';

        if (!photo) {
            return;
        }
        if (!PHOTO_TYPES.includes(photo.type)) {
            setPhotoError('Your photo must be a JPG, PNG, or WebP file.');

            return;
        }
        if (photo.size > MAX_PHOTO_BYTES) {
            setPhotoError('Your photo must be 2MB or smaller.');

            return;
        }

        // Sent as POST with a spoofed method, since PHP only parses
        // uploaded files on POST requests.
        router.post(
            admin.settings.profilePhoto.update.url(),
            { _method: 'put', photo },
            photoRequestOptions,
        );
    };

    const removePhoto = async () => {
        const confirmed = await confirm({
            title: 'Remove your profile photo?',
            description: 'Your initials will be shown instead.',
            confirmLabel: 'Remove photo',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }
        router.delete(
            admin.settings.profilePhoto.destroy.url(),
            photoRequestOptions,
        );
    };

    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const submitProfile = (e: FormEvent) => {
        e.preventDefault();
        profileForm.patch(admin.settings.profile.update.url(), {
            preserveScroll: true,
            onSuccess: () => profileForm.setDefaults(),
        });
    };

    const discardProfileChanges = () => {
        profileForm.reset();
        profileForm.clearErrors();
    };

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const deletePasswordInput = useRef<HTMLInputElement>(null);
    const deleteForm = useForm({ password: '' });

    const changeDeleteOpen = (open: boolean) => {
        setIsDeleteOpen(open);
        if (!open) {
            deleteForm.reset();
            deleteForm.clearErrors();
        }
    };

    const submitDelete = (e: FormEvent) => {
        e.preventDefault();
        deleteForm.delete(admin.settings.destroy.url(), {
            preserveScroll: true,
            onError: () => deletePasswordInput.current?.focus(),
        });
    };

    return (
        <>
            <Head title="Profile settings" />
            {confirmDialog}

            <AdminSettingsShell>
                <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={choosePhoto}
                            disabled={isPhotoBusy}
                            aria-label="Change profile photo"
                            className="group relative size-20 shrink-0 self-start rounded-full focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:ring-offset-2 focus-visible:outline-none sm:self-center"
                        >
                            <AdminAvatar
                                name={user.name}
                                photoUrl={user.profile_photo_url}
                                className="size-20 font-serif text-2xl"
                            />
                            <span
                                aria-hidden="true"
                                className={`absolute inset-0 flex items-center justify-center rounded-full bg-[#1F2A24]/55 text-white transition-opacity ${
                                    isPhotoBusy
                                        ? 'opacity-100'
                                        : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                                }`}
                            >
                                {isPhotoBusy ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    <Camera className="size-5" />
                                )}
                            </span>
                            {!isPhotoBusy && (
                                <span
                                    aria-hidden="true"
                                    className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#2F6F4E] text-white shadow-sm"
                                >
                                    <Camera className="size-3.5" />
                                </span>
                            )}
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-lg font-semibold text-[#1F2A24]">
                                {user.name}
                            </p>
                            <p className="flex items-center gap-1.5 truncate text-sm text-[#1F2A24]/70">
                                <Mail
                                    className="size-3.5 shrink-0"
                                    aria-hidden="true"
                                />
                                <span className="truncate">{user.email}</span>
                            </p>
                            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#1F2A24]/60">
                                <span className="rounded-full bg-[#2F6F4E]/10 px-2 py-0.5 font-semibold text-[#2F6F4E]">
                                    Administrator
                                </span>
                                <span>
                                    Member since{' '}
                                    {memberSinceFormat.format(
                                        new Date(user.created_at),
                                    )}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#1F2A24]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div aria-live="polite" className="text-xs">
                            {photoError ? (
                                <p role="alert" className="text-[#C6473B]">
                                    {photoError}
                                </p>
                            ) : (
                                <p className="text-[#1F2A24]/60">
                                    Click your photo to change it. JPG, PNG, or
                                    WebP, up to 2MB.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                ref={photoInput}
                                type="file"
                                accept={PHOTO_TYPES.join(',')}
                                onChange={uploadPhoto}
                                className="sr-only"
                                tabIndex={-1}
                                aria-hidden="true"
                            />
                            {user.profile_photo_url && (
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    disabled={isPhotoBusy}
                                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#1F2A24]/15 bg-white px-5 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5 focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                                >
                                    <Trash2
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <SettingsSection
                    title="Profile information"
                    description="The name and email address you sign in with and that staff see."
                >
                    <form onSubmit={submitProfile} noValidate>
                        <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
                            <SettingsField
                                id="name"
                                label="Full name"
                                error={profileForm.errors.name}
                            >
                                <input
                                    id="name"
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="name"
                                    required
                                    aria-invalid={!!profileForm.errors.name}
                                    aria-describedby={
                                        profileForm.errors.name
                                            ? 'name-error'
                                            : undefined
                                    }
                                    className={settingsInputClass}
                                />
                            </SettingsField>

                            <SettingsField
                                id="email"
                                label="Email address"
                                error={profileForm.errors.email}
                                hint="Use an address you can access — it's where password reset links are sent."
                            >
                                <input
                                    id="email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="username"
                                    required
                                    aria-invalid={!!profileForm.errors.email}
                                    aria-describedby={
                                        profileForm.errors.email
                                            ? 'email-error'
                                            : undefined
                                    }
                                    className={settingsInputClass}
                                />
                            </SettingsField>
                        </div>

                        <SettingsFormFooter
                            isDirty={profileForm.isDirty}
                            processing={profileForm.processing}
                            recentlySuccessful={profileForm.recentlySuccessful}
                            onDiscard={discardProfileChanges}
                        />
                    </form>
                </SettingsSection>

                <SettingsSection
                    title="Delete account"
                    description="Permanently remove your administrator account."
                    tone="danger"
                >
                    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex gap-2 text-sm text-[#1F2A24]/75">
                            <TriangleAlert
                                className="mt-0.5 size-4 shrink-0 text-[#C6473B]"
                                aria-hidden="true"
                            />
                            You'll be signed out immediately and won't be able
                            to sign back in. This cannot be undone.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDeleteOpen(true)}
                            className="min-h-11 shrink-0 rounded-full border border-[#C6473B]/40 bg-white px-5 text-sm font-semibold text-[#A3372D] transition-colors hover:bg-[#C6473B] hover:text-white focus-visible:ring-2 focus-visible:ring-[#C6473B]/40 focus-visible:outline-none"
                        >
                            Delete account
                        </button>
                    </div>
                </SettingsSection>
            </AdminSettingsShell>

            <Dialog open={isDeleteOpen} onOpenChange={changeDeleteOpen}>
                <DialogContent className="rounded-2xl border-[#1F2A24]/10 bg-white sm:max-w-md">
                    <form onSubmit={submitDelete} className="grid gap-5">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-lg text-[#1F2A24]">
                                Delete your account?
                            </DialogTitle>
                            <DialogDescription className="text-[#1F2A24]/70">
                                Your account and everything tied to it will be
                                permanently deleted. Enter your password to
                                confirm.
                            </DialogDescription>
                        </DialogHeader>

                        <SettingsField
                            id="delete-password"
                            label="Password"
                            error={deleteForm.errors.password}
                        >
                            <PasswordInput
                                id="delete-password"
                                ref={deletePasswordInput}
                                autoComplete="current-password"
                                value={deleteForm.data.password}
                                onChange={(e) =>
                                    deleteForm.setData(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                aria-invalid={!!deleteForm.errors.password}
                                aria-describedby={
                                    deleteForm.errors.password
                                        ? 'delete-password-error'
                                        : undefined
                                }
                                className={settingsInputClass}
                            />
                        </SettingsField>

                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    className="min-h-11 rounded-full border border-[#1F2A24]/15 bg-white px-5 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5"
                                >
                                    Cancel
                                </button>
                            </DialogClose>
                            <button
                                type="submit"
                                disabled={
                                    deleteForm.processing ||
                                    deleteForm.data.password === ''
                                }
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#C6473B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A3372D] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleteForm.processing && (
                                    <Loader2
                                        className="size-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                )}
                                Delete account
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
