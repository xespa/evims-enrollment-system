import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Quote,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/*
 * Building blocks shared by the public site's content pages (Academics,
 * Student Services), so they look and behave the same and each page file
 * is mostly its own content.
 */

export type Stat = { icon: LucideIcon; value: string; label: string };
export type IconItem = { icon: LucideIcon; title: string; copy: string };
export type FeatureItem = IconItem & { features: string[] };
export type ScheduleSlot = { time: string; title: string; copy: string };
export type Testimonial = { quote: string; name: string; relation: string };
export type Highlight = { value: string; title: string; copy: string };
export type TeamMember = { name: string; role: string; bio: string };
export type SiblingPage = {
    key: string;
    title: string;
    subtitle: string;
    href: string;
};
export type ContactCard = {
    icon: LucideIcon;
    title: string;
    lines: string[];
    /** Makes the card a link, e.g. "tel:…" or "mailto:…". */
    href?: string;
    action?: string;
};

/** Tabs for moving between sibling pages (e.g. the four programs). */
export function PageSwitcher({
    label,
    pages,
    current,
}: {
    label: string;
    pages: readonly SiblingPage[];
    current: string;
}) {
    return (
        <nav
            aria-label={label}
            className="-mx-5 [scrollbar-width:none] overflow-x-auto px-5 pb-1"
        >
            <ul className="flex w-max gap-2">
                {pages.map((page) => {
                    const isCurrent = page.key === current;

                    return (
                        <li key={page.key}>
                            <Link
                                href={page.href}
                                aria-current={isCurrent ? 'page' : undefined}
                                className={`flex min-h-11 flex-col justify-center rounded-xl border px-4 py-1.5 transition-colors ${
                                    isCurrent
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                        : 'border-[#1F2A24]/10 bg-white text-[#1F2A24] hover:border-[#2F6F4E]/40 hover:bg-[#2F6F4E]/5'
                                }`}
                            >
                                <span className="text-sm font-semibold">
                                    {page.title}
                                </span>
                                <span
                                    className={`text-[11px] ${isCurrent ? 'text-white/75' : 'text-[#1F2A24]/55'}`}
                                >
                                    {page.subtitle}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export function PageHero({
    nav,
    section,
    eyebrow,
    title,
    intro,
    stats,
    primaryAction = { label: 'Enroll Now', href: '/admission' },
    secondaryAction = { label: 'Ask a Question', href: '/contact' },
}: {
    nav: ReactNode;
    /** The site section, shown in the breadcrumb (e.g. "Academics"). */
    section: string;
    eyebrow: string;
    title: string;
    intro: string;
    stats: Stat[];
    primaryAction?: { label: string; href: string };
    secondaryAction?: { label: string; href: string };
}) {
    return (
        <section className="relative overflow-hidden">
            <div
                className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#E8A33D]/15 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-[#2F6F4E]/10 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-7xl px-5 pt-8 pb-16 lg:pb-20">
                {nav}

                <div className="mt-12 max-w-3xl lg:mt-16">
                    <p className="text-sm font-medium text-[#1F2A24]/60">
                        <Link
                            href="/"
                            className="hover:text-[#2F6F4E] hover:underline"
                        >
                            Home
                        </Link>
                        <span aria-hidden="true"> / </span>
                        {section}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        {eyebrow}
                    </span>
                    <h1 className="mt-4 font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl lg:text-6xl">
                        {title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        {intro}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href={primaryAction.href}
                            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            {primaryAction.label}
                            <ArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </Link>
                        <Link
                            href={secondaryAction.href}
                            className="inline-flex min-h-12 items-center rounded-full border border-[#1F2A24]/15 px-6 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30 hover:bg-[#1F2A24]/5"
                        >
                            {secondaryAction.label}
                        </Link>
                    </div>
                </div>

                <dl className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {stats.map(({ icon: Icon, value, label }, index) => (
                        <div
                            key={`${label}-${index}`}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white/80 p-4 backdrop-blur sm:p-5"
                        >
                            <Icon
                                className="h-5 w-5 text-[#2F6F4E]"
                                aria-hidden="true"
                            />
                            <dt className="sr-only">{label}</dt>
                            <dd>
                                <span className="mt-3 block font-serif text-2xl font-semibold text-[#1F2A24] sm:text-3xl">
                                    {value}
                                </span>
                                <span className="mt-0.5 block text-xs text-[#1F2A24]/65 sm:text-sm">
                                    {label}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}

/** A page section: a short label-style heading plus an optional lead line. */
export function PageSection({
    title,
    description,
    tone = 'cream',
    children,
}: {
    title: string;
    description?: string;
    tone?: 'cream' | 'white';
    children: ReactNode;
}) {
    const inner = (
        <div className="mx-auto max-w-7xl px-5 py-16 lg:py-20">
            <div className="max-w-3xl">
                <h2 className="font-serif text-3xl font-semibold text-[#1F2A24] sm:text-4xl">
                    {title}
                </h2>
                {description && (
                    <p className="mt-3 text-base leading-relaxed text-[#1F2A24]/65">
                        {description}
                    </p>
                )}
            </div>
            <div className="mt-10">{children}</div>
        </div>
    );

    return tone === 'white' ? (
        <section className="border-y border-[#1F2A24]/10 bg-white">
            {inner}
        </section>
    ) : (
        <section>{inner}</section>
    );
}

/** Cards with an icon, a description and a checklist. */
export function FeatureCards({
    items,
    columns = 3,
}: {
    items: FeatureItem[];
    columns?: 3 | 4;
}) {
    return (
        <div
            className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${columns === 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
            {items.map(({ icon: Icon, title, copy, features }) => (
                <article
                    key={title}
                    className="flex flex-col rounded-2xl border border-[#1F2A24]/10 bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-[#2F6F4E]/25 hover:shadow-lg hover:shadow-[#1F2A24]/5 motion-reduce:transition-none"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F6F4E] text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-serif text-xl font-semibold text-[#1F2A24]">
                        {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                        {copy}
                    </p>
                    <ul className="mt-5 space-y-2 border-t border-[#1F2A24]/10 pt-5">
                        {features.map((feature) => (
                            <li
                                key={feature}
                                className="flex items-start gap-2 text-sm text-[#1F2A24]/80"
                            >
                                <CheckCircle2
                                    className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                                    aria-hidden="true"
                                />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </div>
    );
}

/** Compact icon cards; `dark` for a contrasting band of cards. */
export function IconCards({
    items,
    variant = 'light',
    columns = 3,
}: {
    items: IconItem[];
    variant?: 'light' | 'dark';
    columns?: 3 | 4;
}) {
    const isDark = variant === 'dark';

    return (
        <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
            {items.map(({ icon: Icon, title, copy }) => (
                <div
                    key={title}
                    className={`group rounded-2xl p-6 ${
                        isDark
                            ? 'bg-[#1B4D34] text-[#FBF8F2]'
                            : 'border border-[#1F2A24]/10 bg-white'
                    }`}
                >
                    <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            isDark
                                ? 'bg-white/10 text-[#E8A33D]'
                                : 'bg-[#E8A33D]/15 text-[#8A5A12]'
                        }`}
                    >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3
                        className={`mt-4 font-serif text-lg font-semibold ${isDark ? '' : 'text-[#1F2A24]'}`}
                    >
                        {title}
                    </h3>
                    <p
                        className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-[#FBF8F2]/75' : 'text-[#1F2A24]/70'}`}
                    >
                        {copy}
                    </p>
                </div>
            ))}
        </div>
    );
}

/** A day's timetable, split into two columns on wide screens. */
export function DaySchedule({ slots }: { slots: ScheduleSlot[] }) {
    const half = Math.ceil(slots.length / 2);
    const columns = [slots.slice(0, half), slots.slice(half)];

    return (
        <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
            {columns.map((column, columnIndex) => (
                <ol
                    key={columnIndex}
                    start={columnIndex * half + 1}
                    className="relative"
                >
                    {column.map((slot, index) => (
                        <li
                            key={slot.time}
                            className="relative flex gap-4 pb-6"
                        >
                            {/* The line joining one slot to the next. */}
                            {index < column.length - 1 && (
                                <span
                                    className="absolute top-10 bottom-0 left-[2.75rem] w-px bg-[#1F2A24]/15"
                                    aria-hidden="true"
                                />
                            )}
                            <span className="flex h-10 w-[5.5rem] shrink-0 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-xs font-semibold text-[#2F6F4E] tabular-nums">
                                {slot.time}
                            </span>
                            <div className="min-w-0 flex-1 rounded-xl border border-[#1F2A24]/10 bg-white px-4 py-3">
                                <h3 className="font-semibold text-[#1F2A24]">
                                    {slot.title}
                                </h3>
                                <p className="mt-0.5 text-sm text-[#1F2A24]/65">
                                    {slot.copy}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            ))}
        </div>
    );
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function Testimonials({ items }: { items: Testimonial[] }) {
    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <figure
                    key={item.name}
                    className="flex flex-col rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                >
                    <Quote
                        className="h-7 w-7 text-[#E8A33D]"
                        aria-hidden="true"
                    />
                    <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-[#1F2A24]/80">
                        “{item.quote}”
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-[#1F2A24]/10 pt-4">
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-sm font-semibold text-[#2F6F4E]"
                            aria-hidden="true"
                        >
                            {initials(item.name)}
                        </span>
                        <span>
                            <span className="block font-semibold text-[#1F2A24]">
                                {item.name}
                            </span>
                            <span className="block text-xs text-[#1F2A24]/60">
                                {item.relation}
                            </span>
                        </span>
                    </figcaption>
                </figure>
            ))}
        </div>
    );
}

/** Big-number highlight cards. */
export function Highlights({ items }: { items: Highlight[] }) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {items.map((item) => (
                <div
                    key={item.title}
                    className="rounded-2xl bg-[#1B4D34] p-8 text-center text-[#FBF8F2]"
                >
                    <p className="font-serif text-5xl font-semibold text-[#E8A33D]">
                        {item.value}
                    </p>
                    <h3 className="mt-3 font-serif text-lg font-semibold">
                        {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/75">
                        {item.copy}
                    </p>
                </div>
            ))}
        </div>
    );
}

/** Staff cards, with initials in place of a photo. */
export function TeamCards({ members }: { members: TeamMember[] }) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
                <article
                    key={member.name}
                    className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6 text-center"
                >
                    <span
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6F4E] to-[#1B4D34] font-serif text-xl font-semibold text-white ring-4 ring-[#E8A33D]/30"
                        aria-hidden="true"
                    >
                        {initials(member.name) || (
                            <UserRound className="h-7 w-7" />
                        )}
                    </span>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                        {member.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                        {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#1F2A24]/70">
                        {member.bio}
                    </p>
                </article>
            ))}
        </div>
    );
}

/** Ways to get in touch; cards with an `href` are tappable (call, email). */
export function ContactCards({ items }: { items: ContactCard[] }) {
    return (
        <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
            {items.map(({ icon: Icon, title, lines, href, action }) => {
                const body = (
                    <>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#E8A33D]">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h3 className="mt-4 font-serif text-lg font-semibold text-[#FBF8F2]">
                            {title}
                        </h3>
                        {lines.map((line, index) => (
                            <p
                                key={line}
                                className={
                                    index === 0
                                        ? 'mt-1.5 font-semibold break-words text-[#FBF8F2]'
                                        : 'mt-0.5 text-sm text-[#FBF8F2]/70'
                                }
                            >
                                {line}
                            </p>
                        ))}
                        {href && action && (
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#E8A33D]">
                                {action}
                                <ArrowRight
                                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                                    aria-hidden="true"
                                />
                            </span>
                        )}
                    </>
                );

                const className =
                    'group flex flex-col rounded-2xl bg-[#1B4D34] p-6';

                return href ? (
                    <a
                        key={title}
                        href={href}
                        className={`${className} transition-colors hover:bg-[#215C3F]`}
                    >
                        {body}
                    </a>
                ) : (
                    <div key={title} className={className}>
                        {body}
                    </div>
                );
            })}
        </div>
    );
}

/** Opening-hours cards: a title and label/value rows. */
export function HoursCards({
    items,
}: {
    items: {
        icon: LucideIcon;
        title: string;
        rows: { label: string; value: string }[];
    }[];
}) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(({ icon: Icon, title, rows }) => (
                <div
                    key={title}
                    className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F6F4E]/10 text-[#2F6F4E]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                        {title}
                    </h3>
                    <dl className="mt-3 divide-y divide-[#1F2A24]/10 text-sm">
                        {rows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-baseline justify-between gap-3 py-2"
                            >
                                <dt className="text-[#1F2A24]/65">
                                    {row.label}
                                </dt>
                                <dd className="text-right font-semibold text-[#1F2A24]">
                                    {row.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ))}
        </div>
    );
}

/** Closing call to action, plus links to the neighbouring sibling pages. */
export function ClosingCta({
    title,
    copy,
    pages,
    current,
    siblingNoun,
    primaryAction = { label: 'Enroll Now', href: '/admission' },
}: {
    title: string;
    copy: string;
    pages: readonly SiblingPage[];
    current: string;
    /** What the sibling pages are, e.g. "program" or "service". */
    siblingNoun: string;
    primaryAction?: { label: string; href: string };
}) {
    const index = pages.findIndex((page) => page.key === current);
    const previous = pages[index - 1];
    const next = pages[index + 1];

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
                            {title}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#FBF8F2]/80">
                            {copy}
                        </p>
                    </div>
                    <Link
                        href={primaryAction.href}
                        className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#E8A33D] px-7 text-base font-semibold text-[#1F2A24] shadow-lg shadow-black/20 transition-colors hover:bg-[#F0B458]"
                    >
                        {primaryAction.label}
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                </div>
            </div>

            <nav
                aria-label={`Other ${siblingNoun}s`}
                className="mx-auto mt-6 grid max-w-7xl grid-cols-2 gap-4"
            >
                {previous ? (
                    <Link
                        href={previous.href}
                        className="group flex min-h-16 items-center gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white px-5 py-3 transition-colors hover:border-[#2F6F4E]/30"
                    >
                        <ArrowLeft
                            className="h-5 w-5 shrink-0 text-[#2F6F4E] transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
                            aria-hidden="true"
                        />
                        <span>
                            <span className="block text-xs text-[#1F2A24]/55">
                                Previous {siblingNoun}
                            </span>
                            <span className="block font-semibold text-[#1F2A24]">
                                {previous.title}
                            </span>
                        </span>
                    </Link>
                ) : (
                    <span />
                )}
                {next && (
                    <Link
                        href={next.href}
                        className="group col-start-2 flex min-h-16 items-center justify-end gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white px-5 py-3 text-right transition-colors hover:border-[#2F6F4E]/30"
                    >
                        <span>
                            <span className="block text-xs text-[#1F2A24]/55">
                                Next {siblingNoun}
                            </span>
                            <span className="block font-semibold text-[#1F2A24]">
                                {next.title}
                            </span>
                        </span>
                        <ArrowRight
                            className="h-5 w-5 shrink-0 text-[#2F6F4E] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                            aria-hidden="true"
                        />
                    </Link>
                )}
            </nav>
        </section>
    );
}
