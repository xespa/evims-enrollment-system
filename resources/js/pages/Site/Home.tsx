import { Head, Link } from '@inertiajs/react';

const HIGHLIGHTS = [
    {
        label: 'Kinder – Grade 10',
        title: 'One campus, every stage',
        copy: 'A single continuous track from Kinder through Grade 10, so families never have to switch schools mid-journey.',
    },
    {
        label: 'Morning · Afternoon · Service',
        title: 'Sessions built around your day',
        copy: "Choose the morning session, afternoon session, or door-to-door school service — whichever fits your family's schedule.",
    },
    {
        label: 'Cash or GCash',
        title: 'Flexible tuition plans',
        copy: 'Pay in full, bi-monthly, or monthly — at the counter or online — with a payment schedule generated the moment you enroll.',
    },
];

const STEPS = [
    { mark: 'Step 1', title: 'Submit your application', copy: 'Complete the online enrollment form with student, parent, and academic details.' },
    { mark: 'Step 2', title: 'Choose subjects & session', copy: 'Pick your grade-level subjects and the session time that fits your household.' },
    { mark: 'Step 3', title: 'Settle your tuition plan', copy: 'Select a payment option and confirm your first installment, in person or via GCash.' },
    { mark: 'Step 4', title: 'Get confirmed', copy: "Our registrar reviews your documents and confirms your child's slot for the school year." },
];

export default function Home({ gradeLevels }) {
    const displayGrades =
        gradeLevels && gradeLevels.length > 0
            ? gradeLevels
            : [
                  { id: 'kinder', name: 'Kinder' },
                  { id: 'g1', name: 'Grade 1' },
                  { id: 'g2', name: 'Grade 2' },
                  { id: 'g3', name: 'Grade 3' },
                  { id: 'g4', name: 'Grade 4' },
                  { id: 'g5', name: 'Grade 5' },
                  { id: 'g6', name: 'Grade 6' },
                  { id: 'g7', name: 'Grade 7' },
                  { id: 'g8', name: 'Grade 8' },
                  { id: 'g9', name: 'Grade 9' },
                  { id: 'g10', name: 'Grade 10' },
              ];

    return (
        <>
            <Head title="EVIMS — Home" />

            <section className="relative overflow-hidden">
                <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                            School Year 2026–2027 Enrollment is Open
                        </span>

                        <h1 className="mt-5 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl lg:text-6xl">
                            Where every child's
                            <span className="block text-[#2F6F4E]">first chapter</span>
                            is written well.
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                            EVIMS is a Kinder-to-Grade-10 community school built on steady
                            teachers, small class sizes, and a registrar that makes
                            enrollment painless for busy parents.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            <Link
                                href="/enroll"
                                className="rounded-full bg-[#2F6F4E] px-6 py-3 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                            >
                                Start Enrollment
                            </Link>
                            <Link
                                href="/about"
                                className="rounded-full border border-[#1F2A24]/15 px-6 py-3 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30"
                            >
                                Meet the School
                            </Link>
                        </div>

                        <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[#1F2A24]/10 pt-6">
                            <div>
                                <dt className="text-2xl font-semibold text-[#1F2A24]">11</dt>
                                <dd className="text-xs text-[#1F2A24]/60">Grade levels, Kinder–10</dd>
                            </div>
                            <div>
                                <dt className="text-2xl font-semibold text-[#1F2A24]">3</dt>
                                <dd className="text-xs text-[#1F2A24]/60">Session options</dd>
                            </div>
                            <div>
                                <dt className="text-2xl font-semibold text-[#1F2A24]">2</dt>
                                <dd className="text-xs text-[#1F2A24]/60">Ways to pay tuition</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-[#E8A33D]/20" />
                        <div className="rounded-[2rem] border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/5">
                            <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                                Grade Levels Offered
                            </p>
                            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-[#1F2A24]/80">
                                {displayGrades.map((grade) => (
                                    <li
                                        key={grade.id}
                                        className="rounded-lg bg-[#FBF8F2] px-3 py-2 text-center font-medium"
                                    >
                                        {grade.name}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/academics"
                                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#2F6F4E] hover:underline"
                            >
                                See full curriculum →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Why families choose EVIMS</p>
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {HIGHLIGHTS.map((item) => (
                            <div key={item.title} className="rounded-2xl border border-[#1F2A24]/10 p-6">
                                <p className="text-xs font-semibold text-[#E8A33D] uppercase">{item.label}</p>
                                <h3 className="mt-2 font-serif text-xl font-semibold text-[#1F2A24]">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">{item.copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-5 py-16">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">How enrollment works</p>
                        <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">Four steps, start to finish</h2>
                    </div>
                    <Link href="/admission" className="text-sm font-semibold text-[#2F6F4E] hover:underline">
                        Full admission guide →
                    </Link>
                </div>

                <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((step) => (
                        <li key={step.mark} className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]">
                            <p className="text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">{step.mark}</p>
                            <h3 className="mt-3 font-serif text-lg font-semibold">{step.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/70">{step.copy}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                            Ready to reserve your child's seat?
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Applications for School Year 2026–2027 are open for new, returning,
                            and transferee students.
                        </p>
                    </div>
                    <Link
                        href="/enroll"
                        className="shrink-0 rounded-full bg-[#FBF8F2] px-6 py-3 text-sm font-semibold text-[#2F6F4E] shadow-sm transition-colors hover:bg-white"
                    >
                        Enroll Now
                    </Link>
                </div>
            </section>
        </>
    );
}
