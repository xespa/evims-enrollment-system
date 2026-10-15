import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        // The staff sign-in screens are designed light-only.
        <div className="theme-light flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 py-12 sm:py-16">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <Link
                        href={home()}
                        className="inline-flex flex-col items-center gap-2"
                    >
                        <img
                            src="/images/logoevims.png"
                            alt="EVIMS logo"
                            className="h-14 w-14 rounded-full object-cover shadow-sm"
                        />
                        <span className="sr-only">EVIMS</span>
                    </Link>

                    {title && (
                        <h1 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                            {title}
                        </h1>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-ink/70">
                            {description}
                        </p>
                    )}
                </div>

                <div className="rounded-[2rem] border border-ink/10 bg-surface p-6 shadow-xl shadow-shade/5 sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
