import { Link } from '@inertiajs/react';
import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';
import { terms } from '@/routes/site';

const COOKIE_NAME = 'cookie_notice';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function hasSeenNotice() {
    return document.cookie
        .split('; ')
        .some((cookie) => cookie === `${COOKIE_NAME}=seen`);
}

/**
 * Tells visitors which cookies the site uses. They're all needed for the
 * site to work (no tracking or ads), so there's nothing to opt out of:
 * the visitor just acknowledges it, and that is remembered for a year.
 */
export default function CookieNotice() {
    // Hidden until mounted, so it never flashes for someone who has seen it.
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(!hasSeenNotice());
    }, []);

    if (!isVisible) {
        return null;
    }

    const dismiss = () => {
        document.cookie = `${COOKIE_NAME}=seen; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
        setIsVisible(false);
    };

    return (
        <section
            aria-label="Cookie notice"
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-ink/10 bg-surface p-4 text-ink shadow-lg sm:flex sm:items-center sm:gap-4 sm:p-5"
        >
            <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-ink">
                    <Cookie className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-ink/80">
                    We use cookies only to keep you signed in, protect your
                    forms and payments, and remember your settings. No
                    tracking or ads.{' '}
                    <Link
                        href={`${terms.url()}#cookies`}
                        className="font-medium text-brand-ink underline underline-offset-2 hover:no-underline"
                    >
                        Learn more
                    </Link>
                </p>
            </div>
            <button
                type="button"
                onClick={dismiss}
                className="mt-3 min-h-10 w-full shrink-0 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:outline-none sm:mt-0 sm:w-auto"
            >
                Got it
            </button>
        </section>
    );
}
