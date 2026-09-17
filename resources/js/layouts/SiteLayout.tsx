import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    return (
        <div className="min-h-screen bg-[#FBF8F2] font-sans text-[#1F2A24]">
            <header className="sticky top-0 z-40 border-b border-[#1F2A24]/10 bg-[#FBF8F2]/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex items-center gap-2.5">
                            <img
                                src="\images\logoevims.png"
                                alt="evims-logo"
                                className="h-15 w-15 rounded-full object-cover"
                            />
                        </span>
                        <span className="flex flex-col leading-none">
                            <span className="font-serif text-xl font-semibold tracking-tight">EVIMS</span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-[#1F2A24]/60">
                                EASTERN VISAYAS INTERNATIONAL <br></br>
                                MONTESSORI SCHOOL, INC.
                            </span>
                        </span>
                    </Link>

                    <nav className="hidden flex-nowrap items-center gap-5 whitespace-nowrap xl:flex">
                        {NAV_LINKS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-base font-medium transition-colors ${
                                    isActive(item.href)
                                        ? 'text-[#2F6F4E]'
                                        : 'text-[#1F2A24]/70 hover:text-[#2F6F4E]'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 xl:flex">

                        <Link
                            href="/admission"
                            className="rounded-full bg-[#2F6F4E] px-5 py-2 text-base font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            Enroll Now
                        </Link>

                        {/* Desktop profile icon */}
                        <Link
                            href={enrollee ? route('portal.dashboard') : route('portal.login')}
                            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                            title={enrollee ? `My Account (${enrollee.name})` : 'Log in to track your application'}
                        >
                            {enrollee?.profile_photo_url ? (
                                <img src={enrollee.profile_photo_url} alt={enrollee.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <UserCircle className="h-10 w-10" />
                            )}
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="rounded-md p-2 text-[#1F2A24] xl:hidden"
                        aria-label="Toggle navigation"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile sidebar backdrop */}
            <div
                onClick={() => setMenuOpen(false)}
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 xl:hidden ${
                    menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden="true"
            />

            {/* Mobile sidebar panel */}
            <aside
                className={`fixed top-0 right-0 z-50 flex h-full w-72 max-w-[80vw] transform flex-col bg-[#FBF8F2] shadow-2xl transition-transform duration-300 ease-in-out xl:hidden ${
                    menuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-[#1F2A24]/10 p-5">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="rounded-md p-1 text-[#1F2A24]/70 hover:text-[#1F2A24]"
                        aria-label="Close navigation"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>

                    {/* Mobile profile icon — top right */}
                    <Link
                        href={enrollee ? route('portal.dashboard') : route('portal.login')}
                        onClick={() => setMenuOpen(false)}
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                        title={enrollee ? `My Account (${enrollee.name})` : 'Log in to track your application'}
                    >
                        {enrollee?.profile_photo_url ? (
                            <img src={enrollee.profile_photo_url} alt={enrollee.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <UserCircle className="h-10 w-10" />
                        )}
                    </Link>
                </div>

                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-5">
                    {NAV_LINKS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                                isActive(item.href)
                                    ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                    : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-[#1F2A24]/10 p-5">
                    <Link
                        href="/admission"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-full bg-[#2F6F4E] px-4 py-2.5 text-center text-sm font-semibold text-[#FBF8F2]"
                    >
                        Enroll Now
                    </Link>
                </div>
            </aside>

            <main>{children}</main>

            <footer className="border-t border-[#1F2A24]/10 bg-[#1F2A24] text-[#FBF8F2]">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
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
