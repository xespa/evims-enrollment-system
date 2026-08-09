import { Head, Link } from '@inertiajs/react';

const REASONS = [
    {
        mark: '01',
        title: 'Schedule a Visit',
        copy: 'Tour our facilities, meet our educators, and experience the Montessori difference firsthand.',
    },
    {
        mark: '02',
        title: 'Enrollment Inquiries',
        copy: 'Learn about our admission process, available programs, and enrollment requirements for your child.',
    },
    {
        mark: '03',
        title: 'General Questions',
        copy: "Have questions about our curriculum, fees, or school policies? We're here to help.",
    },
    {
        mark: '04',
        title: 'Partnership Opportunities',
        copy: "Interested in collaborating with EVIMS? Let's discuss how we can work together.",
    },
];

const CONTACT_CHANNELS = [
    {
        label: 'Email Us',
        primary: 'evimstech2020@gmail.com',
        detail: 'General inquiries',
        note: 'Response within school hours',
        href: 'mailto:evimstech2020@gmail.com',
    },
    {
        label: 'Main Desk',
        primary: '0936 084 2412',
        detail: 'Monday – Friday',
        note: '8:00 AM – 4:00 PM',
        href: 'tel:+639360842412',
    },
    {
        label: 'Location',
        primary: 'Academic Building',
        detail: 'Santiago Street, Brgy. Balud',
        note: 'Borongan City · Main Campus',
        href: null,
    },
];

function ContactHero() {
    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                    Get In Touch With Us
                </span>

                <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                    We're here to answer your questions
                    <span className="text-[#2F6F4E]"> and help your child thrive.</span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                    At Eastern Visayas International Montessori School, we believe in open
                    communication and building strong relationships with our families. Whether
                    you're interested in enrollment, have questions about our programs, or want
                    to schedule a campus tour, we're ready to assist you.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                        href="/admission"
                        className="rounded-full bg-[#2F6F4E] px-6 py-3 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                    >
                        Start Enrollment
                    </Link>

                    <a
                        href="mailto:evimstech2020@gmail.com"
                        className="rounded-full border border-[#1F2A24]/15 px-6 py-3 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30"
                    >
                        Email Us
                    </a>
                </div>
            </div>
        </section>
    );
}

function ContactReasons() {
    return (
        <section className="border-y border-[#1F2A24]/10 bg-white">
            <div className="mx-auto max-w-6xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    Why Reach Out to EVIMS?
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    A few of the ways we can help
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {REASONS.map((item) => (
                        <div key={item.mark} className="rounded-2xl border border-[#1F2A24]/10 p-6">
                            <p className="font-serif text-3xl font-semibold text-[#E8A33D]">
                                {item.mark}
                            </p>
                            <h3 className="mt-2 font-serif text-lg font-semibold text-[#1F2A24]">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {item.copy}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function ContactChannels() {
    return (
        <section className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                Contact Information
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                Find us through any of these channels
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {CONTACT_CHANNELS.map((channel) => {
                    const className =
                        'block rounded-2xl border border-[#1F2A24]/10 bg-[#FBF8F2] p-6 transition-colors hover:border-[#2F6F4E]/30';

                    const inner = (
                        <>
                            <p className="text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">
                                {channel.label}
                            </p>
                            <p className="mt-3 font-serif text-lg font-semibold text-[#1F2A24]">
                                {channel.primary}
                            </p>
                            <p className="mt-1 text-sm text-[#1F2A24]/70">{channel.detail}</p>
                            <p className="text-sm text-[#1F2A24]/50">{channel.note}</p>
                        </>
                    );

                    if (channel.href) {
                        return (
                            <a key={channel.label} href={channel.href} className={className}>
                                {inner}
                            </a>
                        );
                    }

                    return (
                        <div key={channel.label} className={className}>
                            {inner}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function ContactCta() {
    return (
        <section className="bg-[#2F6F4E]">
            <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                        Ready to take the next step?
                    </h2>
                    <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                        Reach out today and let's talk about how EVIMS can support your child's
                        growth.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">

                    <a
                        href="mailto:evimstech2020@gmail.com"
                        className="rounded-full border border-[#FBF8F2]/40 px-6 py-3 text-sm font-semibold text-[#FBF8F2] transition-colors hover:border-[#FBF8F2]"
                    >
                        Email Us
                    </a>
                    <Link
                        href="/admission"
                        className="rounded-full bg-[#FBF8F2] px-6 py-3 text-sm font-semibold text-[#2F6F4E] shadow-sm transition-colors hover:bg-white"
                    >
                        Enroll Now
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function Contact() {
    return (
        <>
            <Head title="EVIMS — Contact Us" />
            <ContactHero />
            <ContactReasons />
            <ContactChannels />
            <ContactCta />
        </>
    );
}
