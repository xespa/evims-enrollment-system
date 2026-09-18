import { Head } from '@inertiajs/react';
import {
    BookOpenCheck,
    CalendarCheck,
    ClipboardList,
    Compass,
    FileText,
    GraduationCap,
    Handshake,
    Heart,
    HeartPulse,
    Home,
    LifeBuoy,
    Mail,
    MapPin,
    Phone,
    Quote,
    ShieldAlert,
    Target,
    UsersRound,
} from 'lucide-react';

const STATS = [
    { icon: UsersRound, value: '5', label: 'Professional Counselors' },
    { icon: LifeBuoy, value: '24/7', label: 'Crisis Support Available' },
    { icon: Heart, value: '98%', label: 'Student Success Rate' },
    { icon: GraduationCap, value: '1000+', label: 'Students Served Annually' },
];

const SERVICES = [
    {
        icon: GraduationCap,
        title: 'Academic Counseling',
        copy: 'Supporting students in achieving their academic potential through personalized planning and intervention strategies.',
        features: [
            'Course selection and scheduling',
            'Study skills development',
            'Academic goal setting',
            'Learning support coordination',
        ],
    },
    {
        icon: Compass,
        title: 'Career Awareness & Exploration',
        copy: 'Helping students discover their interests, strengths, and potential career paths through age-appropriate activities.',
        features: [
            'Career interest assessments',
            'Job shadowing opportunities',
            'Guest speaker programs',
            'Future planning activities',
        ],
    },
    {
        icon: Heart,
        title: 'Personal & Emotional Support',
        copy: 'Individual and group counseling to support mental health, emotional well-being, and personal development.',
        features: [
            'Individual counseling sessions',
            'Group therapy programs',
            'Crisis intervention',
            'Stress and anxiety management',
        ],
    },
    {
        icon: Handshake,
        title: 'Social Skills Development',
        copy: 'Programs designed to enhance interpersonal skills, peer relationships, and social competence.',
        features: [
            'Peer mediation programs',
            'Conflict resolution training',
            'Leadership development',
            'Social skills workshops',
        ],
    },
    {
        icon: Home,
        title: 'Family Support Services',
        copy: 'Collaborative programs involving parents and families to support student success and well-being.',
        features: [
            'Parent consultation meetings',
            'Family counseling sessions',
            'Home-school communication',
            'Parenting workshops',
        ],
    },
    {
        icon: ShieldAlert,
        title: 'Crisis & Prevention Programs',
        copy: 'Comprehensive crisis response and prevention programs to ensure student safety and mental health.',
        features: [
            '24/7 crisis hotline',
            'Bullying prevention programs',
            'Safety awareness',
            'Mental health education',
        ],
    },
];

const RESOURCES = [
    {
        icon: HeartPulse,
        title: 'Mental Health Resources',
        copy: 'Crisis hotlines, mental health support, and counseling resources',
    },
    {
        icon: BookOpenCheck,
        title: 'Academic Support Tools',
        copy: 'Study guides, tutoring services, and learning resources',
    },
    {
        icon: Target,
        title: 'Career Exploration',
        copy: 'Career assessments, interest inventories, and future planning activities',
    },
    {
        icon: ClipboardList,
        title: 'Study Skills Resources',
        copy: 'Study guides, time management tools, and organizational strategies',
    },
    {
        icon: UsersRound,
        title: 'Peer Support Groups',
        copy: 'Student-led support groups and peer mentoring programs',
    },
    {
        icon: Home,
        title: 'Parent Resources',
        copy: 'Parenting guides, communication tips, and family workshops',
    },
    {
        icon: LifeBuoy,
        title: 'Crisis Support',
        copy: '24/7 crisis hotlines and emergency support services',
    },
    {
        icon: CalendarCheck,
        title: 'Appointment Scheduling',
        copy: 'Online booking system for counseling appointments',
    },
    {
        icon: FileText,
        title: 'Forms & Documents',
        copy: 'Counseling forms, referral documents, and parent consent forms',
    },
];

const TESTIMONIALS = [
    {
        quote: "My counselor helped me navigate through a difficult time and connected me with resources I didn't know existed. I feel supported and understood, and my grades have improved significantly.",
        name: 'Alex Martinez',
        relation: 'Grade 6 Student',
    },
    {
        quote: "The guidance program helped my daughter develop better study habits and cope with test anxiety. She's more confident now and her grades have improved tremendously.",
        name: 'Sophia Williams',
        relation: 'Parent of Grade 4 Student',
    },
    {
        quote: "As a parent, I was worried about my son's social struggles. The counseling team provided both individual support for him and guidance for our whole family. We're so grateful.",
        name: 'Jennifer Thompson',
        relation: 'Parent of Grade 3 Student',
    },
    {
        quote: 'The career exploration activities opened my eyes to many possibilities. I now have goals and know what subjects to focus on to achieve my dreams.',
        name: 'Marcus Johnson',
        relation: 'Grade 9 Student',
    },
    {
        quote: "The peer mediation program taught me valuable conflict resolution skills that I use not just at school, but at home with my siblings. I'm more confident in handling difficult situations.",
        name: 'Emma Davis',
        relation: 'Grade 7 Student',
    },
    {
        quote: 'When our family was going through a crisis, the counseling team provided compassionate support and practical resources. They truly care about the whole child and whole family.',
        name: 'David Rodriguez',
        relation: 'Parent of Grade 5 Student',
    },
];

const CONTACT_INFO = [
    {
        icon: Phone,
        title: 'Main Office',
        primary: '0936 084 2412',
        secondary: 'Monday - Friday',
        tertiary: '7:30 AM - 4:00 PM',
    },
    {
        icon: Mail,
        title: 'Email Us',
        primary: 'evimstech2020@gmail.com',
        secondary: 'We respond within',
        tertiary: 'school hours',
    },
    {
        icon: MapPin,
        title: 'Location',
        primary: 'Santiago Street, Brgy. Balud, Borongan City',
        secondary: 'Main Campus',
        tertiary: '',
    },
];

export default function GuidanceCounseling() {
    return (
        <>
            <Head title="EVIMS — Guidance & Counseling" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Student Services
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Guidance & Counseling
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Comprehensive support services dedicated to helping
                        every student achieve academic success, personal growth,
                        and emotional well-being throughout their educational
                        journey
                    </p>

                    <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-[#1F2A24]/10 pt-6 sm:grid-cols-4">
                        {STATS.map((stat) => (
                            <div
                                key={stat.label}
                                className="flex flex-col items-start gap-2"
                            >
                                <stat.icon className="h-5 w-5 text-[#2F6F4E]" />
                                <dt className="text-2xl font-semibold text-[#1F2A24]">
                                    {stat.value}
                                </dt>
                                <dd className="text-xs text-[#1F2A24]/60">
                                    {stat.label}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Our Counseling Services
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Comprehensive support services designed to address the
                        academic, social, emotional, and career development
                        needs of all students
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {SERVICES.map((service) => (
                            <div
                                key={service.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                    <service.icon className="h-5 w-5 text-[#2F6F4E]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {service.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {service.copy}
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {service.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2 text-sm text-[#1F2A24]/70"
                                        >
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8A33D]" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    Student & Family Resources
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Comprehensive resources and tools to support student
                    success, mental health, and family engagement
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {RESOURCES.map((resource) => (
                        <div
                            key={resource.title}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A33D]/10">
                                <resource.icon className="h-5 w-5 text-[#E8A33D]" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {resource.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {resource.copy}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Student & Parent Testimonials
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Hear from our school community about the positive impact
                        of our guidance and counseling services
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {TESTIMONIALS.map((testimonial) => (
                            <div
                                key={testimonial.name}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <Quote className="h-6 w-6 text-[#E8A33D]" />
                                <p className="mt-4 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {testimonial.quote}
                                </p>
                                <p className="mt-4 font-serif text-base font-semibold text-[#1F2A24]">
                                    {testimonial.name}
                                </p>
                                <p className="text-xs text-[#1F2A24]/60">
                                    {testimonial.relation}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                        Get the Support You Need
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-[#FBF8F2]/80">
                        Our caring, professional counseling team is here to help
                        students and families navigate challenges, achieve
                        goals, and thrive academically and personally.
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {CONTACT_INFO.map((info) => (
                            <div
                                key={info.title}
                                className="rounded-2xl bg-[#FBF8F2]/10 p-6"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF8F2]/15">
                                    <info.icon className="h-5 w-5 text-[#FBF8F2]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#FBF8F2]">
                                    {info.title}
                                </h3>
                                <p className="mt-2 text-sm font-medium text-[#FBF8F2]/90">
                                    {info.primary}
                                </p>
                                {info.secondary && (
                                    <p className="mt-1 text-xs text-[#FBF8F2]/70">
                                        {info.secondary}
                                    </p>
                                )}
                                {info.tertiary && (
                                    <p className="text-xs text-[#FBF8F2]/70">
                                        {info.tertiary}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
