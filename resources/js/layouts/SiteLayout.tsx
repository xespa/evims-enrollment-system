import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import CookieNotice from '@/components/site/cookie-notice';
import SiteFooter from '@/components/site/site-footer';
import SiteHeader from '@/components/site/site-header';
import { clearAllDrafts } from '@/lib/form-drafts';

export default function SiteLayout({ children }: { children: ReactNode }) {
    const isSignedIn = Boolean(usePage().props.auth?.enrollee);

    // Saved form drafts hold a family's personal details, so they go as
    // soon as nobody is signed in, e.g. on a shared computer after logout.
    useEffect(() => {
        if (!isSignedIn) {
            clearAllDrafts();
        }
    }, [isSignedIn]);

    return (
        // The public site and portal are designed light-only; theme-light
        // keeps shared components (buttons, inputs) readable in dark mode.
        <div className="theme-light flex min-h-screen flex-col bg-cream font-sans text-ink">
            <a
                href="#main-content"
                className="sr-only z-[60] rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>

            <SiteHeader />

            <main
                id="main-content"
                tabIndex={-1}
                className="flex-1 focus:outline-none"
            >
                {children}
            </main>

            <SiteFooter />

            <CookieNotice />
        </div>
    );
}
