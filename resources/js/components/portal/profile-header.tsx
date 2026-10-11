import { Link } from '@inertiajs/react';
import { BadgeCheck, Camera, Loader2, Plus } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { create as admissionCreate } from '@/routes/admission';
import type { Enrollee } from '@/types/auth';

const initials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

export default function ProfileHeader({
    enrollee,
    isUploadingPhoto,
    onPhotoSelected,
    onLogout,
}: {
    enrollee: Enrollee | null;
    isUploadingPhoto: boolean;
    onPhotoSelected: (file: File) => void;
    onLogout: () => void;
}) {
    const firstName = enrollee?.name.split(' ')[0];

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Lets the same photo be picked again after a failed upload.
        event.target.value = '';

        if (file) {
            onPhotoSelected(file);
        }
    };

    return (
        <>
            <div className="-mx-4 mb-6 h-28 bg-gradient-to-r from-[#2F6F4E] to-[#25573E] sm:h-36" />

            <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                        <label
                            htmlFor="profile-photo-input"
                            className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-full border-4 border-[#FBF8F2] shadow-sm focus-within:ring-2 focus-within:ring-[#2F6F4E] focus-within:ring-offset-2"
                        >
                            {enrollee?.profile_photo_url ? (
                                <img
                                    src={enrollee.profile_photo_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#2F6F4E] text-2xl font-semibold text-white sm:text-3xl">
                                    {initials(enrollee?.name)}
                                </div>
                            )}
                            <span className="sr-only">
                                Change profile photo (JPG or PNG, up to 2 MB)
                            </span>
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 hidden items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white sm:flex"
                            >
                                <Camera className="h-6 w-6" />
                            </div>
                            {isUploadingPhoto && (
                                <div
                                    role="status"
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"
                                >
                                    <Loader2
                                        className="h-6 w-6 animate-spin"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        Uploading photo…
                                    </span>
                                </div>
                            )}
                        </label>
                        <input
                            id="profile-photo-input"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={isUploadingPhoto}
                            className="sr-only"
                        />
                        {/* Always-visible camera badge: hover overlays
                            never appear on touch screens. */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0.5 bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FBF8F2] bg-[#2F6F4E] text-white shadow-sm sm:right-1.5 sm:bottom-1.5"
                        >
                            <Camera className="h-4 w-4" />
                        </span>
                    </div>
                    <div className="pb-1 text-center sm:text-left">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <h1 className="font-serif text-xl font-semibold text-[#1F2A24] sm:text-2xl">
                                {enrollee?.name}
                            </h1>
                            {enrollee?.email_verified_at && (
                                <span
                                    title="Verified email"
                                    className="text-[#2F6F4E]"
                                >
                                    <BadgeCheck
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        Verified email
                                    </span>
                                </span>
                            )}
                        </div>
                        <p className="text-sm break-all text-[#1F2A24]/70">
                            {enrollee?.email}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                    <Link
                        href={admissionCreate().url}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        New Enrollment
                    </Link>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="min-h-11 rounded-full border border-[#1F2A24]/15 bg-white px-5 py-2 text-sm font-semibold text-[#1F2A24]/70 shadow-sm transition-colors hover:bg-[#1F2A24]/5"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}
