import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { login } from '@/routes';
import { UserCircle } from 'lucide-react';


const NAV_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Academics', href: '/academics' },
    { label: 'Admission', href: '/admission' },
    { label: 'Student Services', href: '/student-services' },
    { label: 'Events', href: '/events' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact Us', href: '/contact' },
];

export default function SiteLayout({ children }) {
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const { props } = usePage();
    const enrollee = props.auth?.enrollee;

    const isActive = (href) => (href === '/' ? url === '/' : url.startsWith(href));

    return (
        <div className="min-h-screen bg-[#FBF8F2] font-sans text-[#1F2A24]">
            <header className="sticky top-0 z-40 border-b border-[#1F2A24]/10 bg-[#FBF8F2]/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex items-center gap-2.5">
                            <img
                                src="\images\logoevims.png"
                                alt="evims-logo"
                                className="h-15 w-15 rounded-full object-cover"
                            />
                        </span>
                        <span className="flex flex-col leading-none">
                            <span className="font-serif text-lg font-semibold tracking-tight">EVIMS</span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-[#1F2A24]/60">
                                EASTERN VISAYAS INTERNATIONAL <br></br>
                                MONTESSORI SCHOOL, INC.
                            </span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-6 lg:flex">
                        {NAV_LINKS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors ${
                                    isActive(item.href)
                                        ? 'text-[#2F6F4E]'
                                        : 'text-[#1F2A24]/70 hover:text-[#2F6F4E]'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 lg:flex">

                        <Link
                            href="/admission"
                            className="rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            Enroll Now
                        </Link>
                        <Link
                            href={enrollee ? route('portal.dashboard') : route('portal.login')}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                            title={enrollee ? `My Account (${enrollee.name})` : 'Log in to track your application'}
                        >
                            <UserCircle className="h-10 w-10" />
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="rounded-md p-2 text-[#1F2A24] lg:hidden"
                        aria-label="Toggle navigation"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {menuOpen && (
                    <nav className="border-t border-[#1F2A24]/10 px-5 pb-4 lg:hidden">
                        <div className="flex flex-col gap-1 pt-2">
                            {NAV_LINKS.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`rounded-md px-2 py-2 text-sm font-medium ${
                                        isActive(item.href)
                                            ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                            : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/admission"
                                onClick={() => setMenuOpen(false)}
                                className="mt-2 rounded-full bg-[#2F6F4E] px-4 py-2 text-center text-sm font-semibold text-[#FBF8F2]"
                            >
                                Enroll Now
                            </Link>
                            <Link
                                href={enrollee ? route('portal.dashboard') : route('portal.login')}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                                title={enrollee ? `My Account (${enrollee.name})` : 'Log in to track your application'}
                            >
                                <UserCircle className="h-6 w-6" />
                            </Link>
                        </div>
                    </nav>
                )}
            </header>

            <main>{children}</main>

            <footer className="border-t border-[#1F2A24]/10 bg-[#1F2A24] text-[#FBF8F2]">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <img
                                src="/images/logoevims.png"
                                alt="evims-logo"
                                className="h-15 w-15 rounded-full object-cover"
                            />
                            <span className="font-serif text-lg font-semibold">EVIMS</span>
                        </div>
                        <p className="mt-2 text-sm text-[#FBF8F2]/70">
                            Guiding Kinder through Grade 10 learners with a curriculum built on
                            curiosity, character, and community.
                        </p>
                    </div>

                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">Explore</p>
                        <ul className="space-y-2 text-sm text-[#FBF8F2]/70">
                            {NAV_LINKS.slice(1).map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="hover:text-[#FBF8F2]">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">Visit</p>
                        <address className="space-y-2 text-sm text-[#FBF8F2]/70 not-italic">
                            <p>Barangay Santiago St., Brgy. Balud</p>
                            <p>Borongan City, Philippines</p>
                        </address>
                    </div>

                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">Reach Us</p>
                        <ul className="space-y-2 text-sm text-[#FBF8F2]/70">
                            <li>+63935 073 4741</li>
                            <li>evimstech2020@gmail.com</li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-between gap-2 border-t border-[#FBF8F2]/10 px-5 py-4 text-center text-xs text-[#FBF8F2]/50 sm:flex-row">
                    <span>© {new Date().getFullYear()} EVIMS. All rights reserved.</span>
                    <Link href={login()} className="text-[#FBF8F2]/40 hover:text-[#FBF8F2]/70 hover:underline">
                        Staff Login
                    </Link>
                </div>
            </footer>
        </div>
    );
}
