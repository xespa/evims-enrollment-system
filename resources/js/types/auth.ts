export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
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

export type Auth = {
    user: User;
    enrollee: Enrollee | null;
    unreadNotificationsCount: number;
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
