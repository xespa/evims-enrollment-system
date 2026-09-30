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
    ShieldAlert,
    Target,
    UsersRound,
} from 'lucide-react';
import {
    ContactCards,
    FeatureCards,
    IconCards,
    PageSection,
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
        lines: [SCHOOL_PHONE, 'Monday – Friday', '7:30 AM – 4:00 PM'],
        href: SCHOOL_PHONE_LINK,
        action: 'Call now',
    },
    {
        icon: Mail,
        title: 'Email Us',
        lines: [SCHOOL_EMAIL, 'We respond within school hours'],
        href: `mailto:${SCHOOL_EMAIL}`,
        action: 'Send an email',
    },
    {
        icon: MapPin,
        title: 'Location',
        lines: ['Santiago Street, Brgy. Balud', 'Borongan City · Main Campus'],
    },
];

export default function GuidanceCounseling() {
    return (
        <>
            <Head title="EVIMS — Guidance & Counseling" />

            <ServiceHero
                current="guidance-counseling"
                eyebrow="Student Services"
                title="Guidance & Counseling"
                intro="Support services dedicated to helping every student achieve academic success, personal growth, and emotional well-being throughout their educational journey."
                stats={STATS}
            />

            <PageSection
                tone="white"
                title="Our Counseling Services"
                description="Support designed around the academic, social, and emotional needs of every student."
            >
                <FeatureCards items={SERVICES} />
            </PageSection>

            <PageSection
                title="Student & Family Resources"
                description="Tools and resources that support student success and family involvement."
            >
                <IconCards items={RESOURCES} />
            </PageSection>

            <PageSection
                tone="white"
                title="Student & Parent Testimonials"
                description="Hear from our school community about the difference guidance and counseling makes."
            >
                <Testimonials items={TESTIMONIALS} />
            </PageSection>

            <PageSection
                title="Get the Support You Need"
                description="Our caring counseling team is here to help students and families navigate challenges, reach their goals, and thrive."
            >
                <ContactCards items={CONTACT_INFO} />
            </PageSection>

            <ServiceCta
                current="guidance-counseling"
                title="We're here to listen"
                copy="Talk to our guidance office about academics, friendships, or anything on your child's mind."
            />
        </>
    );
}
