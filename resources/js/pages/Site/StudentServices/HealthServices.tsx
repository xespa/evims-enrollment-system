import { Head } from '@inertiajs/react';
import {
    Activity,
    Ambulance,
    Apple,
    Bed,
    Brain,
    Building2,
    CalendarCheck,
    ClipboardPlus,
    Dumbbell,
    GraduationCap,
    HandHeart,
    Hospital,
    LifeBuoy,
    Mail,
    MapPin,
    Phone,
    Quote,
    ShieldCheck,
    Siren,
    Stethoscope,
    Syringe,
    UserRound,
} from 'lucide-react';

const STATS = [
    { icon: LifeBuoy, value: '24/7', label: 'Healthcare Available' },
    { icon: UserRound, value: '5+', label: 'Healthcare Professionals' },
    { icon: HandHeart, value: '98%', label: 'Student Satisfaction' },
    { icon: Activity, value: '1000+', label: 'Students Served Monthly' },
];

const SERVICES = [
    {
        icon: Stethoscope,
        title: 'Primary & Preventive Care',
        copy: 'Routine checkups, wellness visits, and preventive screenings to keep students healthy year-round.',
        features: [
            'Annual physical examinations',
            'Vision and hearing screenings',
            'Growth and development monitoring',
            'Referrals to specialists when needed',
        ],
    },
    {
        icon: Ambulance,
        title: 'Emergency & Urgent Care',
        copy: 'Rapid response to injuries, illnesses, and medical emergencies during school hours.',
        features: [
            'On-site first aid and triage',
            'Emergency medication administration',
            'Coordination with EMS and parents',
            'Injury and incident documentation',
        ],
    },
    {
        icon: Syringe,
        title: 'Immunizations & Screenings',
        copy: 'Keeping students up-to-date on required vaccines and monitoring for common health concerns.',
        features: [
            'Immunization compliance tracking',
            'Vaccination clinics and reminders',
            'Communicable disease screening',
            'BMI and wellness checks',
        ],
    },
    {
        icon: Brain,
        title: 'Mental Health & Counseling',
        copy: 'Confidential support for emotional well-being, stress, and mental health concerns.',
        features: [
            'Individual and group counseling',
            'Crisis intervention and referrals',
            'Stress and anxiety management',
            'Family support coordination',
        ],
    },
    {
        icon: ClipboardPlus,
        title: 'Chronic Condition Management',
        copy: 'Personalized care plans for students managing asthma, diabetes, allergies, and other conditions.',
        features: [
            'Individualized health care plans',
            'Medication administration and monitoring',
            'Staff training for student needs',
            'Ongoing communication with families',
        ],
    },
    {
        icon: GraduationCap,
        title: 'Health Education & Records',
        copy: 'Promoting lifelong wellness habits while maintaining accurate, secure student health records.',
        features: [
            'Health and hygiene education',
            'Nutrition and wellness workshops',
            'Secure digital health records',
            'Parent health portal access',
        ],
    },
];

const TEAM = [
    {
        name: 'Dr. Sarah Martinez',
        role: 'School Physician',
        bio: 'Board-certified physician with 15+ years experience in pediatric and adolescent medicine, dedicated to student health and wellness.',
    },
    {
        name: 'Jennifer Thompson, RN',
        role: 'Head Nurse',
        bio: 'Licensed registered nurse specializing in school health services, emergency care, and chronic disease management.',
    },
    {
        name: 'Michael Chen',
        role: 'Mental Health Counselor',
        bio: 'Licensed clinical social worker providing confidential counseling and mental health support for students and families.',
    },
];

const WELLNESS_PROGRAMS = [
    {
        icon: Dumbbell,
        title: 'Fitness Programs',
        copy: 'Physical activity initiatives including sports, yoga, and exercise programs to promote active lifestyles.',
    },
    {
        icon: HandHeart,
        title: 'Mental Wellness',
        copy: 'Mindfulness, meditation, and stress reduction workshops for emotional balance and mental clarity.',
    },
    {
        icon: Apple,
        title: 'Nutrition Education',
        copy: 'Healthy eating workshops, nutritional counseling, and meal planning guidance for optimal health.',
    },
    {
        icon: Activity,
        title: 'Health Screenings',
        copy: 'Regular health assessments including BMI, blood pressure, and general wellness checks.',
    },
    {
        icon: Bed,
        title: 'Sleep Health',
        copy: 'Education on sleep hygiene, healthy sleep habits, and importance of adequate rest for students.',
    },
    {
        icon: ShieldCheck,
        title: 'Disease Prevention',
        copy: 'Immunization programs, hygiene education, and infectious disease prevention strategies.',
    },
];

const EMERGENCY_CONTACTS = [
    {
        icon: Building2,
        title: 'School Health Office',
        lines: [
            'Main Line: (555) 123-4567',
            'Available: Monday-Friday, 7:30 AM - 4:00 PM',
        ],
    },
    {
        icon: Siren,
        title: 'Emergency Services',
        lines: [
            '911 - For life-threatening emergencies',
            'Immediate medical assistance',
        ],
    },
    {
        icon: Hospital,
        title: 'Local Hospital',
        lines: [
            'Memorial General Hospital',
            '(555) 987-6543',
            'Emergency Room open 24/7',
        ],
    },
    {
        icon: LifeBuoy,
        title: 'Crisis Hotline',
        lines: ['National Crisis Hotline: 988', '24/7 Mental Health Support'],
    },
];

const TESTIMONIALS = [
    {
        quote: 'The health services team has been incredible. When my son had an asthma attack, they responded immediately and kept me informed every step of the way. I feel safe knowing such caring professionals are watching over our children.',
        name: 'Maria Johnson',
        relation: 'Parent of Grade 8 Student',
    },
    {
        quote: 'The mental health counseling I received helped me through a really difficult time. The counselor was understanding, professional, and genuinely cared about my well-being. I am so grateful for this support.',
        name: 'Alex Rivera',
        relation: 'Grade 11 Student',
    },
    {
        quote: 'As a teacher, I appreciate how the health office handles student needs efficiently and compassionately. They communicate well with staff and parents, creating a safe health environment for everyone.',
        name: 'Robert Chen',
        relation: 'Mathematics Teacher',
    },
    {
        quote: 'The immunization program made it so easy to keep my daughter up-to-date with required vaccines. The nurses were gentle, explained everything, and made her feel comfortable throughout the process.',
        name: 'Patricia Williams',
        relation: 'Parent of Grade 5 Student',
    },
    {
        quote: 'I was nervous about my first physical exam, but Nurse Jennifer made me feel comfortable and explained everything. The health office is always welcoming and the staff really cares about students.',
        name: 'Emma Davis',
        relation: 'Grade 9 Student',
    },
    {
        quote: 'The wellness programs have helped me develop better habits. From nutrition workshops to stress management sessions, I have learned so much about taking care of my health. These programs are truly valuable.',
        name: 'James Mitchell',
        relation: 'Grade 12 Student',
    },
];

const CONTACT_INFO = [
    {
        icon: MapPin,
        title: 'Visit Our Office',
        lines: [
            'Health Services Center',
            'Building A, Ground Floor',
            'Open: Mon-Fri, 7:30 AM - 4:00 PM',
        ],
    },
    {
        icon: Phone,
        title: 'Call Us',
        lines: [
            'Main Office: (555) 123-4567',
            'Emergency: (555) 123-HELP',
            'Fax: (555) 123-4569',
        ],
    },
    {
        icon: Mail,
        title: 'Email Us',
        lines: [
            'health@school.edu',
            'For appointments, questions,',
            'or health concerns',
        ],
    },
    {
        icon: CalendarCheck,
        title: 'Book Appointment',
        lines: [
            'Schedule online or call',
            'Same-day appointments available',
            'Walk-ins welcome for emergencies',
        ],
    },
];

export default function HealthServices() {
    return (
        <>
            <Head title="EVIMS — Health Services" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Your Health, Our Priority
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Health Services
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Comprehensive healthcare solutions dedicated to the
                        physical, mental, and emotional well-being of our entire
                        school community with professional medical support
                        available 24/7
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
                        Our Services
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Comprehensive Healthcare Solutions
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-[#1F2A24]/70">
                        From preventive care to emergency response, we provide
                        complete health services tailored to your needs
                    </p>

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
                    Our Team
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Expert Healthcare Professionals
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#1F2A24]/70">
                    Meet our dedicated team of licensed professionals committed
                    to your well-being
                </p>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {TEAM.map((member) => (
                        <div
                            key={member.name}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                <UserRound className="h-6 w-6 text-[#2F6F4E]" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {member.name}
                            </h3>
                            <p className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                {member.role}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {member.bio}
                            </p>
                            <div className="mt-4 flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2F6F4E]">
                                    <Mail className="h-4 w-4" /> Email
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2F6F4E]">
                                    <Phone className="h-4 w-4" /> Call
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Wellness Programs
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Holistic Health Initiatives
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-[#1F2A24]/70">
                        Comprehensive programs designed to promote physical,
                        mental, and emotional well-being
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {WELLNESS_PROGRAMS.map((program) => (
                            <div
                                key={program.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A33D]/10">
                                    <program.icon className="h-5 w-5 text-[#E8A33D]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {program.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {program.copy}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    Emergency Contacts
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Important information for health emergencies and urgent
                    situations
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {EMERGENCY_CONTACTS.map((contact) => (
                        <div
                            key={contact.title}
                            className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]"
                        >
                            <contact.icon className="h-5 w-5 text-[#E8A33D]" />
                            <h3 className="mt-3 font-serif text-lg font-semibold">
                                {contact.title}
                            </h3>
                            {contact.lines.map((line) => (
                                <p
                                    key={line}
                                    className="mt-1 text-sm leading-relaxed text-[#FBF8F2]/70"
                                >
                                    {line}
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Testimonials
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        What Our Community Says
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-[#1F2A24]/70">
                        Real experiences from students, parents, and staff
                        members
                    </p>

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
                                <div className="mt-4 flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F6F4E]/10 font-serif text-sm font-semibold text-[#2F6F4E]">
                                        {testimonial.name.charAt(0)}
                                    </span>
                                    <div>
                                        <p className="font-serif text-base font-semibold text-[#1F2A24]">
                                            {testimonial.name}
                                        </p>
                                        <p className="text-xs text-[#1F2A24]/60">
                                            {testimonial.relation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                        Get in Touch
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-[#FBF8F2]/80">
                        Our dedicated health team is here to support you. Reach
                        out for appointments, questions, or health concerns.
                    </p>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                                {info.lines.map((line) => (
                                    <p
                                        key={line}
                                        className="mt-1 text-xs text-[#FBF8F2]/70"
                                    >
                                        {line}
                                    </p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
