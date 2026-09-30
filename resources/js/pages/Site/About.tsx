import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Eye,
    FlaskConical,
    Globe2,
    HandHeart,
    Heart,
    Lightbulb,
    Medal,
    Palette,
    Shapes,
    Target,
    Trophy,
    Users,
    UtensilsCrossed,
} from 'lucide-react';
import type { ReactNode } from 'react';

// The year EVIMS was founded, as shown on the school seal ("Since 2003").
// Everything on this page that mentions the founding year or the school's
// age reads it from here.
const FOUNDED_YEAR = 2003;

const VALUES = [
    {
        icon: Heart,
        title: 'Child-Centered Learning',
        copy: 'We believe each child is unique and deserves personalized attention to reach their full potential through self-directed learning.',
    },
    {
        icon: Users,
        title: 'Community Partnership',
        copy: 'We foster strong relationships between students, families, and educators to create a supportive learning environment.',
    },
    {
        icon: Medal,
        title: 'Excellence in Education',
        copy: 'We maintain the highest standards in Montessori education while continuously improving our methods and facilities.',
    },
    {
        icon: Globe2,
        title: 'Global Perspective',
        copy: 'We prepare students to be global citizens who respect diversity and contribute positively to their communities.',
    },
    {
        icon: Lightbulb,
        title: 'Innovation and Creativity',
        copy: 'We encourage creative thinking and problem-solving skills through hands-on learning experiences.',
    },
    {
        icon: HandHeart,
        title: 'Character Development',
        copy: 'We nurture strong moral values, independence, and social responsibility in all our students.',
    },
];

const FACILITIES = [
    {
        icon: Shapes,
        title: 'Prepared Environments',
        copy: 'Carefully designed classrooms that promote independence and self-directed learning with authentic Montessori materials.',
    },
    {
        icon: Trophy,
        title: 'Sports & Recreation',
        copy: 'Outdoor playground, sports facilities, and covered courts for physical development and recreational activities.',
    },
    {
        icon: BookOpen,
        title: 'Library & Learning Center',
        copy: 'Extensive collection of books and educational resources to support research and independent learning.',
    },
    {
        icon: FlaskConical,
        title: 'Science Laboratory',
        copy: 'Hands-on science exploration with age-appropriate equipment and materials for experiential learning.',
    },
    {
        icon: Palette,
        title: 'Arts & Crafts Studio',
        copy: 'Creative spaces for artistic expression, including visual arts, music, and performing arts activities.',
    },
    {
        icon: UtensilsCrossed,
        title: 'Dining Hall & Kitchen',
        copy: 'Nutritious meal preparation and communal dining spaces that promote healthy eating habits and social interaction.',
    },
];

function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
            {children}
        </p>
    );
}

export default function About() {
    const yearsServing = new Date().getFullYear() - FOUNDED_YEAR;

    const stats = [
        { value: String(FOUNDED_YEAR), label: 'Year founded' },
        { value: `${yearsServing}`, label: 'Years serving the community' },
        { value: '13', label: 'Grade levels, Nursery–10' },
        { value: '3', label: 'Session options for families' },
    ];

    return (
        <>
            <Head title="EVIMS — About Us" />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#E8A33D]/15 blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                            About EVIMS
                        </span>
                        <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                            A community school built for the
                            <span className="text-[#2F6F4E]">
                                {' '}
                                whole child.
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                            Since {FOUNDED_YEAR}, Eastern Visayas International
                            Montessori School has brought authentic Montessori
                            education to the children of Borongan City and
                            Eastern Samar — where every child learns at their
                            own pace, grows in independence, and discovers a
                            lifelong love of learning.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/admission"
                                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                            >
                                Start Enrollment
                                <ArrowRight
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </Link>
                            <a
                                href="#our-story"
                                className="inline-flex min-h-12 items-center rounded-full border border-[#1F2A24]/15 px-6 text-sm font-semibold text-[#1F2A24] transition-colors hover:border-[#1F2A24]/30 hover:bg-[#1F2A24]/5"
                            >
                                Read our story
                            </a>
                        </div>
                    </div>

                    {/* School seal */}
                    <div className="relative mx-auto w-full max-w-sm">
                        <div
                            className="absolute inset-6 rounded-full bg-gradient-to-br from-[#2F6F4E] via-[#E8A33D] to-[#2F6F4E] opacity-30 blur-2xl"
                            aria-hidden="true"
                        />
                        <div className="relative aspect-square rounded-full border-[10px] border-white bg-white shadow-2xl ring-4 shadow-[#1F2A24]/15 ring-[#E8A33D]/60">
                            <img
                                src="/images/logoevims.png"
                                alt="The EVIMS school seal"
                                className="h-full w-full rounded-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#1B4D34] px-5 py-2 text-center shadow-lg">
                            <p className="text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-[#E8A33D] uppercase">
                                Since {FOUNDED_YEAR}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* At a glance */}
            <section className="mx-auto max-w-7xl px-5">
                <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-[#1B4D34] p-6 sm:p-8 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <dt className="sr-only">{stat.label}</dt>
                            <dd>
                                <span className="block font-serif text-3xl font-semibold text-[#FBF8F2]">
                                    {stat.value}
                                </span>
                                <span className="mt-1 block text-xs text-[#FBF8F2]/75">
                                    {stat.label}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Our story */}
            <section
                id="our-story"
                className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 lg:py-24"
            >
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <div>
                        <SectionLabel>Our story</SectionLabel>
                        <h2 className="mt-2 font-serif text-3xl leading-tight font-semibold text-[#1F2A24] sm:text-4xl">
                            From a small dream to a thriving community
                        </h2>
                        <figure className="mt-8 border-l-4 border-[#E8A33D] pl-5">
                            <blockquote className="font-serif text-xl leading-snug text-[#1F2A24] italic">
                                “Every child deserves an environment where they
                                can learn at their own pace.”
                            </blockquote>
                            <figcaption className="mt-2 text-sm text-[#1F2A24]/60">
                                The belief EVIMS was founded on
                            </figcaption>
                        </figure>
                    </div>
                    <div className="space-y-5 text-base leading-relaxed text-[#1F2A24]/75">
                        <p>
                            Eastern Visayas International Montessori School was
                            founded in {FOUNDED_YEAR} with a vision to bring
                            authentic Montessori education to the children of
                            Eastern Visayas. What started as a small dream has
                            grown into a thriving educational community that
                            serves families across the region.
                        </p>
                        <p>
                            Our founder, inspired by Dr. Maria Montessori's
                            revolutionary approach to child development,
                            believed that every child deserves an environment
                            where they can learn at their own pace, develop
                            independence, and cultivate a lifelong love of
                            learning. Today, we continue this mission with the
                            same passion and dedication.
                        </p>
                        <p>
                            Located in the heart of Eastern Visayas, our school
                            has become a beacon of progressive education,
                            combining traditional Montessori principles with
                            modern educational innovations to prepare our
                            students for success in the 21st century.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & vision */}
            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-16 lg:grid-cols-2">
                    <article className="relative overflow-hidden rounded-2xl border border-[#2F6F4E]/15 bg-[#2F6F4E]/[0.04] p-8">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2F6F4E] text-white">
                            <Target className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <h2 className="mt-5 text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                            Our Mission
                        </h2>
                        <p className="mt-3 font-serif text-lg leading-relaxed text-[#1F2A24] sm:text-xl">
                            Eastern Visayas International Montessori School,
                            Inc. is committed to the development of the whole
                            child, which enables him to reach his greatest
                            potential. We encourage personal responsibility and
                            allow freedom of choice as we offer guidance in
                            setting individual goals. It is our mission to
                            inspire academic excellence and nurture curiosity,
                            creativity and imagination within an environment
                            filled with warmth, kindness and respect.
                        </p>
                    </article>
                    <article className="relative overflow-hidden rounded-2xl border border-[#E8A33D]/25 bg-[#E8A33D]/[0.06] p-8">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8A33D] text-[#1F2A24]">
                            <Eye className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <h2 className="mt-5 text-xs font-semibold tracking-[0.14em] text-[#8A5A12] uppercase">
                            Our Vision
                        </h2>
                        <p className="mt-3 font-serif text-lg leading-relaxed text-[#1F2A24] sm:text-xl">
                            Our school's vision is to provide the best education
                            in an open environment and to assist children on
                            their individual paths to development. It is also
                            our vision to help them acquire essential knowledge,
                            good character and attitude, with a strong
                            foundation of basic faith in God.
                        </p>
                    </article>
                </div>
            </section>

            {/* Core values */}
            <section className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                <div className="max-w-2xl">
                    <SectionLabel>What drives us forward</SectionLabel>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        The principles that guide our actions and shape our
                        community
                    </h2>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {VALUES.map(({ icon: Icon, ...value }) => (
                        <div
                            key={value.title}
                            className="group rounded-2xl border border-[#1F2A24]/10 bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-[#2F6F4E]/25 hover:shadow-lg hover:shadow-[#1F2A24]/5 motion-reduce:transition-none"
                        >
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F6F4E]/10 text-[#2F6F4E] transition-colors group-hover:bg-[#2F6F4E] group-hover:text-white motion-reduce:transition-none">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {value.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {value.copy}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Campus & facilities */}
            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <div className="max-w-2xl">
                        <SectionLabel>Our campus</SectionLabel>
                        <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                            Spaces designed for hands-on learning
                        </h2>
                    </div>

                    <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {FACILITIES.map(({ icon: Icon, ...facility }) => (
                            <li
                                key={facility.title}
                                className="flex gap-4 rounded-2xl bg-[#FBF8F2] p-6"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#2F6F4E] shadow-sm">
                                    <Icon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <h3 className="font-serif text-lg font-semibold text-[#1F2A24]">
                                        {facility.title}
                                    </h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#1F2A24]/70">
                                        {facility.copy}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Closing call to action */}
            <section className="px-5 py-16">
                <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#1B4D34] px-6 py-12 sm:px-12">
                    <div
                        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#E8A33D]/20 blur-2xl"
                        aria-hidden="true"
                    />
                    <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                                Come see EVIMS for yourself.
                            </h2>
                            <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                                Have questions before you apply? Our registrar's
                                office is happy to walk you through grade
                                levels, sessions, and tuition options.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-3">
                            <Link
                                href="/contact"
                                className="inline-flex min-h-12 items-center rounded-full border border-[#FBF8F2]/40 px-6 text-sm font-semibold text-[#FBF8F2] transition-colors hover:border-[#FBF8F2] hover:bg-white/5"
                            >
                                Contact Us
                            </Link>
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
        </>
    );
}
