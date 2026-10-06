export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    profile_photo_url?: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

/** A student portal account (the `enrollee` guard). */
export type Enrollee = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    profile_photo_url: string | null;
    [key: string]: unknown;
};

/** What the signed-in staff member may do; mirrors App\Enums\UserRole. */
export type StaffAbilities = {
    viewDashboard: boolean;
    reviewApplications: boolean;
    handlePayments: boolean;
    manageSchool: boolean;
    manageStaff: boolean;
    uploadDocumentTypes: string[];
};

export type Auth = {
    user: User;
    enrollee: Enrollee | null;
    unreadNotificationsCount: number;
    roleLabel: string | null;
    can: StaffAbilities | null;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */
