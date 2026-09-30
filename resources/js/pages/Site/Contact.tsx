import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    Clock,
    Copy,
    Handshake,
    HelpCircle,
    Mail,
    MapPin,
    Navigation,
    Phone,
    School,
    Send,
    UserPlus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

const EMAIL = 'evimstech2020@gmail.com';
const PHONE_DISPLAY = '0936 084 2412';
const PHONE_LINK = 'tel:+639360842412';
const ADDRESS_LINES = [
    'Academic Building, Santiago Street',
    'Brgy. Balud, Borongan City',
    'Eastern Samar, Philippines',
];
const MAP_QUERY = encodeURIComponent(
    'Eastern Visayas International Montessori School, Santiago Street, Balud, Borongan City, Eastern Samar',
);
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;

// Office hours in Philippine time: Monday–Friday, 8:00 AM – 4:00 PM.
const OFFICE_DAYS = [1, 2, 3, 4, 5];
const OFFICE_OPENS = 8;
const OFFICE_CLOSES = 16;

const TOPICS = [
    {
        key: 'visit',
        icon: School,
        title: 'Schedule a Visit',
        copy: 'Tour our facilities, meet our educators, and experience the Montessori difference firsthand.',
        prompt: "I'd like to schedule a campus visit. The best days and times for us are:",
    },
    {
        key: 'enrollment',
        icon: UserPlus,
        title: 'Enrollment Inquiries',
        copy: 'Learn about our admission process, available programs, and enrollment requirements for your child.',
        prompt: "I have a question about enrolling my child. My child's grade level is:",
    },
    {
        key: 'general',
        icon: HelpCircle,
        title: 'General Questions',
        copy: "Have questions about our curriculum, fees, or school policies? We're here to help.",
        prompt: '',
    },
    {
        key: 'partnership',
        icon: Handshake,
        title: 'Partnership Opportunities',
        copy: "Interested in collaborating with EVIMS? Let's discuss how we can work together.",
        prompt: "I'm reaching out about a possible partnership with EVIMS:",
    },
] as const;

type TopicKey = (typeof TOPICS)[number]['key'];

/** Whether the office is open right now, going by Philippine time. */
function useOfficeStatus(): { isOpen: boolean; label: string } | null {
    const [status, setStatus] = useState<{
        isOpen: boolean;
        label: string;
    } | null>(null);

    useEffect(() => {
        const update = () => {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Manila',
                weekday: 'short',
                hour: 'numeric',
                hour12: false,
            }).formatToParts(new Date());
            const weekday =
                parts.find((p) => p.type === 'weekday')?.value ?? '';
            const hour =
                Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
            const day = [
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
            ].indexOf(weekday);

            const isWorkday = OFFICE_DAYS.includes(day);
            const isOpen =
                isWorkday && hour >= OFFICE_OPENS && hour < OFFICE_CLOSES;

            setStatus({
                isOpen,
                label: isOpen
                    ? 'Open now · until 4:00 PM'
                    : isWorkday && hour < OFFICE_OPENS
                      ? 'Closed · opens today at 8:00 AM'
                      : 'Closed · opens weekdays at 8:00 AM',
            });
        };

        update();
        const timer = window.setInterval(update, 60_000);

        return () => window.clearInterval(timer);
    }, []);

    return status;
}

function CopyButton({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access can be blocked; the value is still visible to copy by hand.
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1F2A24]/50 transition-colors hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
        >
            {copied ? (
                <Check className="h-4 w-4 text-[#2F6F4E]" aria-hidden="true" />
            ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only" aria-live="polite">
                {copied ? 'Copied' : ''}
            </span>
        </button>
    );
}

function ContactHero() {
    const status = useOfficeStatus();

    return (
        <section className="relative overflow-hidden">
            <div
                className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#E8A33D]/15 blur-3xl"
                aria-hidden="true"
            />
            <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Get in touch
                    </span>
                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        We're here to answer your questions
                        <span className="text-[#2F6F4E]">
                            {' '}
                            and help your child thrive.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Whether you're interested in enrollment, have questions
                        about our programs, or want to schedule a campus tour,
                        our office is ready to help.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <a
                            href="#send-a-message"
                            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" />
                            Send a Message
                        </a>
                        <Link
                            href="/admission"
                            className="inline-flex min-h-12 items-center rounded-full border border-[#1F2A24]/15 px-6 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30 hover:bg-[#1F2A24]/5"
                        >
                            Start Enrollment
                        </Link>
                    </div>
                </div>

                {/* Quick contact card */}
                <div className="rounded-[2rem] border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/5 sm:p-8">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-serif text-xl font-semibold text-[#1F2A24]">
                            Reach us directly
                        </h2>
                        {status && (
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    status.isOpen
                                        ? 'bg-[#2E8057]/10 text-[#22613F]'
                                        : 'bg-[#1F2A24]/5 text-[#1F2A24]/65'
                                }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        status.isOpen
                                            ? 'animate-pulse bg-[#2E8057] motion-reduce:animate-none'
                                            : 'bg-[#1F2A24]/40'
                                    }`}
                                    aria-hidden="true"
                                />
                                {status.label}
                            </span>
                        )}
                    </div>

                    <ul className="mt-5 divide-y divide-[#1F2A24]/10">
                        <li className="flex items-center gap-3 py-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2F6F4E]/10 text-[#2F6F4E]">
                                <Phone className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <a
                                href={PHONE_LINK}
                                className="min-w-0 flex-1 rounded-md hover:text-[#2F6F4E]"
                            >
                                <span className="block text-xs text-[#1F2A24]/55">
                                    Main desk
                                </span>
                                <span className="block font-semibold text-[#1F2A24] tabular-nums">
                                    {PHONE_DISPLAY}
                                </span>
                            </a>
                            <CopyButton
                                value={PHONE_DISPLAY}
                                label="phone number"
                            />
                        </li>
                        <li className="flex items-center gap-3 py-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2F6F4E]/10 text-[#2F6F4E]">
                                <Mail className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <a
                                href={`mailto:${EMAIL}`}
                                className="min-w-0 flex-1 rounded-md hover:text-[#2F6F4E]"
                            >
                                <span className="block text-xs text-[#1F2A24]/55">
                                    Email
                                </span>
                                <span className="block truncate font-semibold text-[#1F2A24]">
                                    {EMAIL}
                                </span>
                            </a>
                            <CopyButton value={EMAIL} label="email address" />
                        </li>
                        <li className="flex items-center gap-3 py-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2F6F4E]/10 text-[#2F6F4E]">
                                <Clock className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <span className="block text-xs text-[#1F2A24]/55">
                                    Office hours
                                </span>
                                <span className="block font-semibold text-[#1F2A24]">
                                    Monday – Friday, 8:00 AM – 4:00 PM
                                </span>
                            </div>
                        </li>
                    </ul>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <a
                            href={PHONE_LINK}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                        >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            Call
                        </a>
                        <a
                            href={DIRECTIONS_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#1F2A24]/15 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30 hover:bg-[#1F2A24]/5"
                        >
                            <Navigation
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            Directions
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MessageComposer({
    topic,
    onTopicChange,
}: {
    topic: TopicKey;
    onTopicChange: (topic: TopicKey) => void;
}) {
    const selected = TOPICS.find((t) => t.key === topic) ?? TOPICS[0];
    const [name, setName] = useState('');
    const [message, setMessage] = useState<string>(selected.prompt);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    // Switching topics starts the message from that topic's opening line,
    // unless something has already been written.
    useEffect(() => {
        setMessage((current) =>
            current.trim() === '' || TOPICS.some((t) => t.prompt === current)
                ? selected.prompt
                : current,
        );
    }, [selected.prompt]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const subject = `${selected.title}${name.trim() ? ` — ${name.trim()}` : ''}`;
        const body =
            `${message.trim()}\n\n${name.trim() ? `— ${name.trim()}` : ''}`.trim();
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const inputClass =
        'min-h-12 w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-2.5 text-base text-[#1F2A24] placeholder-[#1F2A24]/40 focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:text-sm';

    return (
        <form
            id="contact-form"
            onSubmit={submit}
            className="rounded-[2rem] border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/5 sm:p-8"
        >
            <fieldset>
                <legend className="text-sm font-medium text-[#1F2A24]/80">
                    What can we help with?
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                        <label
                            key={t.key}
                            className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2F6F4E]/40 ${
                                topic === t.key
                                    ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                    : 'border-[#1F2A24]/15 text-[#1F2A24]/75 hover:border-[#2F6F4E]/40'
                            }`}
                        >
                            <input
                                type="radio"
                                name="topic"
                                value={t.key}
                                checked={topic === t.key}
                                onChange={() => {
                                    onTopicChange(t.key);
                                    messageRef.current?.focus();
                                }}
                                className="sr-only"
                            />
                            {t.title}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="mt-5">
                <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80"
                >
                    Your name
                </label>
                <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                />
            </div>

            <div className="mt-4">
                <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80"
                >
                    Message{' '}
                    <span className="text-[#C6473B]" aria-hidden="true">
                        *
                    </span>
                </label>
                <textarea
                    id="contact-message"
                    ref={messageRef}
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputClass} resize-y`}
                />
            </div>

            <button
                type="submit"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
            >
                <Send className="h-4 w-4" aria-hidden="true" />
                Continue in your email app
            </button>
            <p className="mt-2 text-center text-xs text-[#1F2A24]/55">
                Opens your email app with the message ready to send to {EMAIL}.
            </p>
        </form>
    );
}

function HelpAndMessage() {
    const [topic, setTopic] = useState<TopicKey>('enrollment');

    const pickTopic = (key: TopicKey) => {
        setTopic(key);
        const form = document.getElementById('contact-form');
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        form?.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'center',
        });
        document
            .getElementById('contact-message')
            ?.focus({ preventScroll: true });
    };

    return (
        <section
            id="send-a-message"
            className="scroll-mt-24 border-y border-[#1F2A24]/10 bg-white"
        >
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
                <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        How we can help
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Tell us what you need
                    </h2>
                    <p className="mt-3 text-base text-[#1F2A24]/65">
                        Pick a topic and we'll start the message for you.
                    </p>
                    <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {TOPICS.map(({ icon: Icon, ...t }) => (
                            <li key={t.key}>
                                <button
                                    type="button"
                                    onClick={() => pickTopic(t.key)}
                                    aria-pressed={topic === t.key}
                                    className={`flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-[border-color,background-color] ${
                                        topic === t.key
                                            ? 'border-[#2F6F4E] bg-[#2F6F4E]/[0.04]'
                                            : 'border-[#1F2A24]/10 hover:border-[#2F6F4E]/30'
                                    }`}
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8A33D]/15 text-[#8A5A12]">
                                        <Icon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="mt-3 font-serif text-lg font-semibold text-[#1F2A24]">
                                        {t.title}
                                    </span>
                                    <span className="mt-1 text-sm leading-relaxed text-[#1F2A24]/65">
                                        {t.copy}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <MessageComposer topic={topic} onTopicChange={setTopic} />
            </div>
        </section>
    );
}

function VisitUs() {
    return (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:py-20">
            <div className="grid grid-cols-1 overflow-hidden rounded-[2rem] border border-[#1F2A24]/10 bg-white lg:grid-cols-[0.8fr_1.2fr]">
                <div className="p-6 sm:p-10">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Visit us
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Main Campus
                    </h2>
                    <address className="mt-5 flex gap-3 text-base leading-relaxed text-[#1F2A24]/75 not-italic">
                        <MapPin
                            className="mt-1 h-5 w-5 shrink-0 text-[#2F6F4E]"
                            aria-hidden="true"
                        />
                        <span>
                            {ADDRESS_LINES.map((line) => (
                                <span key={line} className="block">
                                    {line}
                                </span>
                            ))}
                        </span>
                    </address>
                    <p className="mt-4 flex gap-3 text-sm text-[#1F2A24]/65">
                        <Clock
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6F4E]"
                            aria-hidden="true"
                        />
                        Walk-ins welcome during office hours. For a guided tour,
                        send us a message first.
                    </p>
                    <a
                        href={DIRECTIONS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                    >
                        <Navigation className="h-4 w-4" aria-hidden="true" />
                        Get directions
                    </a>
                </div>
                <div className="min-h-72 bg-[#2F6F4E]/10 lg:min-h-full">
                    <iframe
                        title="Map showing the EVIMS main campus in Borongan City"
                        src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-full min-h-72 w-full border-0"
                    />
                </div>
            </div>
        </section>
    );
}

function ContactCta() {
    return (
        <section className="px-5 pb-16">
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#1B4D34] px-6 py-12 sm:px-12">
                <div
                    className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#E8A33D]/20 blur-2xl"
                    aria-hidden="true"
                />
                <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                            Ready to take the next step?
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Reach out today and let's talk about how EVIMS can
                            support your child's growth.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                        <a
                            href={PHONE_LINK}
                            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#FBF8F2]/40 px-6 text-sm font-semibold text-[#FBF8F2] transition-colors hover:border-[#FBF8F2] hover:bg-white/5"
                        >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            Call Us
                        </a>
                        <Link
                            href="/admission"
                            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E8A33D] px-6 text-sm font-semibold text-[#1F2A24] shadow-lg shadow-black/20 transition-colors hover:bg-[#F0B458]"
                        >
                            Enroll Now
                            <ArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
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
            <HelpAndMessage />
            <VisitUs />
            <ContactCta />
        </>
    );
}
