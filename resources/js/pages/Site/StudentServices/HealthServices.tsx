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
    LifeBuoy,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Siren,
    Stethoscope,
    Syringe,
    UserRound,
} from 'lucide-react';
import {
    ContactCards,
    FeatureCards,
    IconCards,
    PageSection,
    TeamCards,
    Testimonials,
} from '@/components/site/page-sections';
import {
    SCHOOL_EMAIL,
    SCHOOL_PHONE,
    SCHOOL_PHONE_LINK,
    ServiceCta,
    ServiceHero,
} from '@/components/student-services/service-page';

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

// Only numbers that really work belong here: the school's own line and
// the Philippines' national emergency hotline.
const EMERGENCY_CONTACTS = [
    {
        icon: Siren,
        title: 'Emergency Services',
        lines: [
            '911',
            'Philippine national emergency hotline, for life-threatening emergencies',
        ],
        href: 'tel:911',
        action: 'Call 911',
    },
    {
        icon: Building2,
        title: 'School Health Office',
        lines: [SCHOOL_PHONE, 'Monday – Friday, 7:30 AM – 4:00 PM'],
        href: SCHOOL_PHONE_LINK,
        action: 'Call the school',
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
            'Mon – Fri, 7:30 AM – 4:00 PM',
        ],
    },
    {
        icon: Phone,
        title: 'Call Us',
        lines: [SCHOOL_PHONE, 'School main line'],
        href: SCHOOL_PHONE_LINK,
        action: 'Call now',
    },
    {
        icon: Mail,
        title: 'Email Us',
        lines: [
            SCHOOL_EMAIL,
            'For appointments, questions, or health concerns',
        ],
        href: `mailto:${SCHOOL_EMAIL}`,
        action: 'Send an email',
    },
    {
        icon: CalendarCheck,
        title: 'Book an Appointment',
        lines: ['Call or visit the office', 'Walk-ins welcome for emergencies'],
    },
];

export default function HealthServices() {
    return (
        <>
            <Head title="EVIMS — Health Services" />

            <ServiceHero
                current="health-services"
                eyebrow="Your Health, Our Priority"
                title="Health Services"
                intro="Healthcare dedicated to the physical, mental, and emotional well-being of our whole school community."
                stats={STATS}
            />

            {/* Emergency numbers first, where they're easy to find. */}
            <section className="px-5">
                <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#C6473B]/20 bg-[#C6473B]/[0.04] p-6 sm:p-8">
                    <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C6473B] text-white">
                            <Siren className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                In an emergency
                            </h2>
                            <p className="mt-1 text-sm text-[#1F2A24]/70">
                                Call for help right away, then let the school
                                know.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <ContactCards items={EMERGENCY_CONTACTS} />
                    </div>
                </div>
            </section>

            <PageSection
                title="Our Services"
                description="From preventive care to emergency response, health services tailored to every student's needs."
            >
                <FeatureCards items={SERVICES} />
            </PageSection>

            <PageSection
                tone="white"
                title="Our Team"
                description="Meet the professionals committed to our students' well-being."
            >
                <TeamCards members={TEAM} />
            </PageSection>

            <PageSection
                title="Wellness Programs"
                description="Programs designed to promote physical, mental, and emotional well-being."
            >
                <IconCards items={WELLNESS_PROGRAMS} />
            </PageSection>

            <PageSection
                tone="white"
                title="What Our Community Says"
                description="Experiences from students, parents, and staff."
            >
                <Testimonials items={TESTIMONIALS} />
            </PageSection>

            <PageSection
                title="Get in Touch"
                description="Our health team is here to help. Reach out for appointments, questions, or health concerns."
            >
                <ContactCards items={CONTACT_INFO} />
            </PageSection>

            <ServiceCta
                current="health-services"
                title="Healthy students learn better"
                copy="Questions about your child's health needs, medication, or immunizations? Our health office is happy to help."
            />
        </>
    );
}
