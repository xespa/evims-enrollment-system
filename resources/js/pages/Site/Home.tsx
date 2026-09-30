import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    ClipboardList,
    GraduationCap,
    ListChecks,
    School,
    ShieldCheck,
    Sparkles,
    Wallet,
} from 'lucide-react';

type GradeLevel = { id: number | string; name: string };

type Props = {
    gradeLevels: GradeLevel[];
    openSchoolYear: string | null;
};

const HIGHLIGHTS = [
    {
        icon: School,
        label: 'Nursery – Grade 10',
        title: 'One campus, every stage',
        copy: 'A single continuous track from Nursery through Grade 10, so families never have to switch schools mid-journey.',
    },
    {
        icon: CalendarClock,
        label: 'Morning · Afternoon · Service',
        title: 'Sessions built around your day',
        copy: "Choose the morning session, afternoon session, or door-to-door school service — whichever fits your family's schedule.",
    },
    {
        icon: Wallet,
        label: 'Cash or GCash',
        title: 'Flexible tuition plans',
        copy: 'Pay in full, bi-monthly, or monthly — at the counter or online — with a payment schedule generated the moment you enroll.',
    },
];

const STEPS = [
    {
        icon: ClipboardList,
        title: 'Submit your application',
        copy: 'Complete the online enrollment form with student, parent, and academic details.',
    },
    {
        icon: ListChecks,
        title: 'Choose subjects & session',
        copy: 'Pick your grade-level subjects and the session time that fits your household.',
    },
    {
        icon: Wallet,
        title: 'Settle your tuition plan',
        copy: 'Select a payment option and confirm your first installment, in person or via GCash.',
    },
    {
        icon: ShieldCheck,
        title: 'Get confirmed',
        copy: "Our registrar reviews your documents and confirms your child's slot for the school year.",
    },
];

// The Montessori programs, in order, with which grade levels belong to each.
const PROGRAMS = [
    {
        title: 'Pre-Elementary',
        href: '/academics/pre-elementary',
        includes: (name: string) => /nursery|pre-k|kinder/i.test(name),
    },
    {
        title: 'Lower Elementary',
        href: '/academics/lower-elementary',
        includes: (name: string) => /^grade [1-3]$/i.test(name),
    },
    {
        title: 'Upper Elementary',
        href: '/academics/upper-elementary',
        includes: (name: string) => /^grade [4-6]$/i.test(name),
    },
    {
        title: 'High School',
        href: '/academics/high-school',
        includes: (name: string) => /^grade (7|8|9|1\d)$/i.test(name),
    },
];

const FALLBACK_GRADES: GradeLevel[] = [
    'Nursery',
    'Pre-K 1',
    'Pre-K 2',
    ...Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`),
].map((name) => ({ id: name, name }));

/** "2026-2027" → "2026–2027" (en dash, as it's written in print). */
function formatSchoolYear(schoolYear: string): string {
    return schoolYear.replace('-', '–');
}

function SectionLabel({ children }: { children: string }) {
    return (
        <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
            {children}
        </p>
    );
}

export default function Home({ gradeLevels, openSchoolYear }: Props) {
    const grades = gradeLevels?.length > 0 ? gradeLevels : FALLBACK_GRADES;
    const programs = PROGRAMS.map((program) => ({
        ...program,
        grades: grades.filter((grade) => program.includes(grade.name)),
    })).filter((program) => program.grades.length > 0);

    const schoolYear = openSchoolYear ? formatSchoolYear(openSchoolYear) : null;

    return (
        <>
            <Head title="EVIMS — Home" />

            {/* Banner */}
            <section className="px-3 pt-3 sm:px-5 sm:pt-5">
                <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#1B4D34] shadow-xl shadow-[#1F2A24]/10 sm:rounded-[2rem]">
                    <img
                        src="/images/evims-banner.jpg"
                        alt="Give your child the world — Eastern Visayas International Montessori School (EVIMS), since 2003, Borongan City, Eastern Samar. Choose Montessori!"
                        width={2447}
                        height={906}
                        fetchPriority="high"
                        className="block aspect-[2447/906] h-auto w-full object-cover"
                    />
                </div>
            </section>

            {/* Enrollment call-out, overlapping the banner's bottom edge */}
            <section className="relative z-10 px-5">
                <div className="mx-auto -mt-6 flex max-w-5xl flex-col gap-5 rounded-2xl border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/10 sm:-mt-10 md:flex-row md:items-center md:justify-between md:p-8">
                    <div>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${
                                schoolYear
                                    ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                    : 'bg-[#E8A33D]/15 text-[#8A5A12]'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    schoolYear
                                        ? 'animate-pulse bg-[#2F6F4E] motion-reduce:animate-none'
                                        : 'bg-[#E8A33D]'
                                }`}
                                aria-hidden="true"
                            />
                            {schoolYear
                                ? `S.Y. ${schoolYear} enrollment is open`
                                : 'Enrollment opens soon'}
                        </span>
                        <h1 className="mt-3 font-serif text-2xl leading-tight font-semibold text-[#1F2A24] sm:text-3xl">
                            Be part of something{' '}
                            <span className="text-[#2F6F4E]">exceptional</span>
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#1F2A24]/70 sm:text-base">
                            At Eastern Visayas International Montessori School,
                            we cultivate excellence through innovative
                            education, dedicated teaching, and a thriving
                            community of learners and leaders.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                        <Link
                            href="/admission"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            Start Enrollment
                            <ArrowRight
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </Link>
                        <Link
                            href="/about"
                            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1F2A24]/15 px-6 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30 hover:bg-[#1F2A24]/5"
                        >
                            Meet the School
                        </Link>
                    </div>
                </div>
            </section>

            {/* At a glance */}
            <section className="mx-auto max-w-5xl px-5 pt-10">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { value: 'Since 2003', label: 'Serving Eastern Samar' },
                        {
                            value: String(grades.length),
                            label: 'Grade levels, Nursery–10',
                        },
                        { value: '3', label: 'Session options' },
                        { value: '2', label: 'Ways to pay tuition' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white/60 px-4 py-4 text-center"
                        >
                            <dt className="sr-only">{stat.label}</dt>
                            <dd>
                                <span className="block font-serif text-2xl font-semibold text-[#2F6F4E]">
                                    {stat.value}
                                </span>
                                <span className="mt-0.5 block text-xs text-[#1F2A24]/70">
                                    {stat.label}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Programs & grade levels */}
            <section className="mx-auto max-w-7xl px-5 py-16">
                <div className="max-w-2xl">
                    <SectionLabel>Programs &amp; grade levels</SectionLabel>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        A Montessori path from Nursery to Grade 10
                    </h2>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {programs.map((program) => (
                        <Link
                            key={program.title}
                            href={program.href}
                            className="group flex flex-col rounded-2xl border border-[#1F2A24]/10 bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#2F6F4E]/30 hover:shadow-lg hover:shadow-[#1F2A24]/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6F4E]/10 text-[#2F6F4E]">
                                <GraduationCap
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {program.title}
                            </h3>
                            <ul className="mt-3 flex flex-wrap gap-1.5">
                                {program.grades.map((grade) => (
                                    <li
                                        key={grade.id}
                                        className="rounded-full bg-[#FBF8F2] px-2.5 py-1 text-xs font-medium text-[#1F2A24]/80"
                                    >
                                        {grade.name}
                                    </li>
                                ))}
                            </ul>
                            <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-[#2F6F4E]">
                                Learn more
                                <ArrowRight
                                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                                    aria-hidden="true"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Why EVIMS */}
            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <SectionLabel>Why families choose EVIMS</SectionLabel>
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {HIGHLIGHTS.map(({ icon: Icon, ...item }) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8A33D]/15 text-[#8A5A12]">
                                    <Icon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <p className="mt-4 text-xs font-semibold text-[#8A5A12] uppercase">
                                    {item.label}
                                </p>
                                <h3 className="mt-1.5 font-serif text-xl font-semibold text-[#1F2A24]">
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

            {/* How enrollment works */}
            <section className="mx-auto max-w-7xl px-5 py-16">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <SectionLabel>How enrollment works</SectionLabel>
                        <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                            Four steps, start to finish
                        </h2>
                    </div>
                    <Link
                        href="/admission"
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#2F6F4E] hover:underline"
                    >
                        Start your application
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>

                <ol className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Connects the numbered steps on wide screens. */}
                    <span
                        className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-[#1F2A24]/15 lg:block"
                        aria-hidden="true"
                    />
                    {STEPS.map(({ icon: Icon, ...step }, index) => (
                        <li key={step.title} className="relative">
                            <div className="flex items-center gap-3 lg:flex-col lg:text-center">
                                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2F6F4E] font-serif text-lg font-semibold text-[#FBF8F2] ring-8 ring-[#FBF8F2]">
                                    {index + 1}
                                </span>
                                <p className="text-xs font-semibold tracking-[0.14em] text-[#8A5A12] uppercase lg:mt-2">
                                    Step {index + 1}
                                </p>
                            </div>
                            <div className="mt-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-5 lg:text-center">
                                <Icon
                                    className="h-5 w-5 text-[#2F6F4E] lg:mx-auto"
                                    aria-hidden="true"
                                />
                                <h3 className="mt-3 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {step.copy}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Closing call to action */}
            <section className="px-5 pb-16">
                <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#1B4D34] px-6 py-12 sm:px-12">
                    <div
                        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#E8A33D]/20 blur-2xl"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#2F6F4E] blur-2xl"
                        aria-hidden="true"
                    />
                    <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <img
                                src="/images/logoevims.png"
                                alt=""
                                className="hidden h-16 w-16 shrink-0 rounded-full bg-white object-cover p-0.5 sm:block"
                            />
                            <div>
                                <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">
                                    <Sparkles
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                    Give your child the world
                                </p>
                                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#FBF8F2]">
                                    Ready to reserve your child's seat?
                                </h2>
                                <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                                    {schoolYear
                                        ? `Applications for School Year ${schoolYear} are open for new, returning, and transferee students.`
                                        : 'Applications for the next school year open soon — you can start your application as soon as they do.'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/admission"
                            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#E8A33D] px-7 text-base font-semibold text-[#1F2A24] shadow-lg shadow-black/20 transition-colors hover:bg-[#F0B458]"
                        >
                            Enroll Now
                            <ArrowRight
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
