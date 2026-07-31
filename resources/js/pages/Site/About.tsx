import { Head, Link } from '@inertiajs/react';

const VALUES = [
    {
        mark: '01',
        title: 'Child-Centered Learning',
        copy: 'We believe each child is unique and deserves personalized attention to reach their full potential through self-directed learning.',
    },
    {
        mark: '02',
        title: 'Community Partnership',
        copy: 'We foster strong relationships between students, families, and educators to create a supportive learning environment.',
    },
    {
        mark: '03',
        title: 'Excellence in Education',
        copy: 'We maintain the highest standards in Montessori education while continuously improving our methods and facilities.',
    },
    {
        mark: '04',
        title: 'Global Perspective',
        copy: 'We prepare students to be global citizens who respect diversity and contribute positively to their communities.',
    },
    {
        mark: '05',
        title: 'Innovation and Creativity',
        copy: 'We encourage creative thinking and problem-solving skills through hands-on learning experiences.',
    },
    {
        mark: '06',
        title: 'Character Development',
        copy: 'We nurture strong moral values, independence, and social responsibility in all our students.',
    },
];

const FACILITIES = [
    { year: '', title: 'Prepared Environments', copy: 'Carefully designed classrooms that promote independence and self-directed learning with authentic Montessori materials.' },
    { year: '', title: 'Sports & Recreation', copy: 'Outdoor playground, sports facilities, and covered courts for physical development and recreational activities.' },
    { year: '', title: 'Library & Learning Center', copy: 'Extensive collection of books and educational resources to support research and independent learning.' },
    { year: '', title: 'Science Laboratory', copy: 'Hands-on science exploration with age-appropriate equipment and materials for experiential learning.' },
    { year: '', title: 'Arts & Crafts Studio', copy: 'Creative spaces for artistic expression, including visual arts, music, and performing arts activities.' },
    { year: '', title: 'Dining Hall & Kitchen', copy: 'Nutritious meal preparation and communal dining spaces that promote healthy eating habits and social interaction.' },
];

const STATS = [
    { value: '16', label: 'Years serving the community' },
    { value: '11', label: 'Grade levels, Kinder–10' },
    { value: '3', label: 'Session options for families' },
];

export default function About() {
    return (
        <>
            <Head title="EVIMS — About Us" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        About EVIMS
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        A community school built for the
                        <span className="text-[#2F6F4E]"> whole child.</span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Eastern Visayas International Montessori School was founded in 2010 with a vision to bring authentic Montessori education to the children of Eastern Visayas. What started as a small dream has grown into a thriving educational community that serves families across the region.

                        Our founder, inspired by Dr. Maria Montessori's revolutionary approach to child development, believed that every child deserves an environment where they can learn at their own pace, develop independence, and cultivate a lifelong love of learning. Today, we continue this mission with the same passion and dedication.

                        Located in the heart of Eastern Visayas, our school has become a beacon of progressive education, combining traditional Montessori principles with modern educational innovations to prepare our students for success in the 21st century.
                    </p>

                    <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-[#1F2A24]/10 pt-6">
                        {STATS.map((stat) => (
                            <div key={stat.label}>
                                <dt className="text-2xl font-semibold text-[#1F2A24]">{stat.value}</dt>
                                <dd className="text-xs text-[#1F2A24]/60">{stat.label}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white gap-10">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-16 lg:grid-cols-2 lg:gap-10">
                    <div className="rounded-2xl border border-[#1F2A24]/10 p-6">
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Our Mission</p>
                        <p className="mt-3 font-serif text-xl leading-snug text-[#1F2A24]">
                            Eastern Visayas International Montessori School, Inc. is committed to the development of the whole childwhich enables him to reach his greatest potential.
                            We encourage personal responsibility and allow freedom of choice as we offer guidance in setting individual goals.
                            It is our mission to inspire academic excellence and nurture curiosity, creativity and imagination within an environment filled with warmth kindness and respect.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#1F2A24]/10 p-6">
                        <p className="text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">Our Vision</p>
                        <p className="mt-3 font-serif text-xl leading-snug text-[#1F2A24]">
                            Our school's vision is to provide the best education in an open environment and to assist children on their individual paths to development.
                            It is also our vision to help them acquire essential knowledge, good character and attitude, with a strong foundation of basic faith in God.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">What Drives Us Forward</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">The fundamental principles that guide our actions and shape our community</h2>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {VALUES.map((item) => (
                        <div key={item.mark} className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6">
                            <p className="font-serif text-3xl font-semibold text-[#E8A33D]">{item.mark}</p>
                            <h3 className="mt-2 font-serif text-lg font-semibold text-[#1F2A24]">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">{item.copy}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Our story</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">Growing with the community</h2>

                    <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FACILITIES.map((item) => (
                            <li key={item.year} className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]">
                                <p className="text-xs font-semibold tracking-[0.14em] text-[#E8A33D] uppercase">{item.year}</p>
                                <h3 className="mt-3 font-serif text-lg font-semibold">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/70">{item.copy}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                            Come see EVIMS for yourself.
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Have questions before you apply? Our registrar's office is happy
                            to walk you through grade levels, sessions, and tuition options.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                        <Link
                            href="/contact"
                            className="rounded-full border border-[#FBF8F2]/40 px-6 py-3 text-sm font-semibold text-[#FBF8F2] transition-colors hover:border-[#FBF8F2]"
                        >
                            Contact Us
                        </Link>
                        <Link
                            href="/admission"
                            className="rounded-full bg-[#FBF8F2] px-6 py-3 text-sm font-semibold text-[#2F6F4E] shadow-sm transition-colors hover:bg-white"
                        >
                            Enroll Now
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
