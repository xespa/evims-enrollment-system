import type { ReactNode } from 'react';
import SiteFooter from '@/components/site/site-footer';
import SiteHeader from '@/components/site/site-header';

export default function SiteLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#FBF8F2] font-sans text-[#1F2A24]">
            <a
                href="#main-content"
                className="sr-only z-[60] rounded-md bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
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
        </div>
    );
}
