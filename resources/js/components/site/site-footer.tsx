import { Link } from '@inertiajs/react';
import { ArrowRight, ArrowUp, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { login as staffLogin } from '@/routes';
import { create as admission } from '@/routes/admission';
import {
    login as portalLogin,
    register as portalRegister,
} from '@/routes/portal';
import { about, contact, events, terms } from '@/routes/site';
import { ACADEMICS, STUDENT_SERVICES } from './site-navigation';
import type { NavLink } from './site-navigation';

const PHONE_DISPLAY = '+63 935 073 4741';
const PHONE_LINK = 'tel:+639350734741';
const EMAIL = 'evimstech2020@gmail.com';

const COLUMNS: { title: string; links: NavLink[] }[] = [
    { title: 'Academics', links: ACADEMICS.children },
    {
        title: 'Admissions',
        links: [
            { label: 'Enroll Now', href: admission().url },
            { label: 'Student Portal Login', href: portalLogin().url },
            { label: 'Create an Account', href: portalRegister().url },
            { label: 'Events', href: events().url },
        ],
    },
    {
        title: 'Our School',
        links: [
            { label: 'About Us', href: about().url },
            ...STUDENT_SERVICES.children,
            { label: 'Contact Us', href: contact().url },
        ],
    },
];

export default function SiteFooter() {
    return (
        <footer className="bg-[#1F2A24] text-[#FBF8F2] [&_:focus-visible]:outline-[#E8A33D]">
            {/* Call to action */}
            <div className="border-b border-[#FBF8F2]/10">
                <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
                    <div>
                        <p className="font-serif text-xl font-semibold sm:text-2xl">
                            Ready to join the EVIMS family?
                        </p>
                        <p className="mt-1 text-sm text-[#FBF8F2]/70">
                            Create an account, get verified, and enroll your
                            child online.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={admission()}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#E8A33D] px-5 text-sm font-semibold text-[#1F2A24] transition-colors hover:bg-[#F0B456]"
                        >
                            Enroll Now
                            <ArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </Link>
                        <Link
                            href={contact()}
                            className="inline-flex min-h-11 items-center rounded-full border border-[#FBF8F2]/25 px-5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#FBF8F2]/10"
                        >
                            Talk to Us
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div className="col-span-2 lg:col-span-1">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <img
                            src="/images/logoevims.png"
                            alt=""
                            className="h-12 w-12 rounded-full bg-white object-cover"
                        />
                        <span className="leading-tight">
                            <span className="block font-serif text-lg font-semibold">
                                EVIMS
                            </span>
                            <span className="block text-xs text-[#FBF8F2]/60">
                                Eastern Visayas International Montessori School,
                                Inc.
                            </span>
                        </span>
                    </Link>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#FBF8F2]/70">
                        Guiding learners from Nursery through Grade 10 with a
                        curriculum built on curiosity, character, and community.
                    </p>

                    <ul className="mt-5 space-y-2.5 text-sm text-[#FBF8F2]/75">
                        <li className="flex gap-2.5">
                            <MapPin
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#E8A33D]"
                                aria-hidden="true"
                            />
                            <address className="not-italic">
                                Santiago Street, Brgy. Balud,
                                <br />
                                Borongan City, Eastern Samar
                            </address>
                        </li>
                        <li className="flex gap-2.5">
                            <Phone
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#E8A33D]"
                                aria-hidden="true"
                            />
                            <a
                                href={PHONE_LINK}
                                className="hover:text-[#FBF8F2] hover:underline"
                            >
                                {PHONE_DISPLAY}
                            </a>
                        </li>
                        <li className="flex gap-2.5">
                            <Mail
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#E8A33D]"
                                aria-hidden="true"
                            />
                            <a
                                href={`mailto:${EMAIL}`}
                                className="break-all hover:text-[#FBF8F2] hover:underline"
                            >
                                {EMAIL}
                            </a>
                        </li>
                        <li className="flex gap-2.5">
                            <Clock
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#E8A33D]"
                                aria-hidden="true"
                            />
                            Mon–Fri, 8:00 AM – 4:00 PM
                        </li>
                    </ul>
                </div>

                {COLUMNS.map((column) => (
                    <nav key={column.title} aria-label={column.title}>
                        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">
                            {column.title}
                        </p>
                        <ul className="space-y-2 text-sm text-[#FBF8F2]/70">
                            {column.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="inline-block py-0.5 transition-colors hover:text-[#FBF8F2]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>

            <div className="border-t border-[#FBF8F2]/10">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-[#FBF8F2]/60 sm:flex-row">
                    <span>
                        © {new Date().getFullYear()} Eastern Visayas
                        International Montessori School, Inc. All rights
                        reserved.
                    </span>
                    <div className="flex items-center gap-4">
                        <Link
                            href={terms()}
                            className="hover:text-[#FBF8F2] hover:underline"
                        >
                            Terms & Privacy
                        </Link>
                        <Link
                            href={staffLogin()}
                            className="hover:text-[#FBF8F2] hover:underline"
                        >
                            Staff Login
                        </Link>
                        <button
                            type="button"
                            onClick={() =>
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-[#FBF8F2]/20 px-2.5 py-1 hover:bg-[#FBF8F2]/10 hover:text-[#FBF8F2]"
                        >
                            <ArrowUp
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                            />
                            Top
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
