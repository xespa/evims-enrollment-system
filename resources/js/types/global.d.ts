import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            flash: {
                success: string | null;
                error: string | null;
            };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
        layoutProps: {
            /** Shown in the admin top bar instead of the page's own heading. */
            title?: string;
            subtitle?: string;
            /** Explains the page, behind a (?) beside the title. */
            help?: string;
        };
    }
}
