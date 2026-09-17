import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    Award,
    Baby,
    Brain,
    CheckCircle2,
    Clock,
    GraduationCap,
    Heart,
    Leaf,
    MessageCircle,
    Palette,
    Quote,
    Smile,
    Sparkles,
    Users,
} from 'lucide-react';

const STATS = [
    { icon: Users, value: '1:10', label: 'Teacher to Student Ratio' },
    { icon: Users, value: '1:8', label: 'Teacher to Student Ratio' },
    { icon: Clock, value: '7', label: 'Hours Daily Program' },
    { icon: Heart, value: '100%', label: 'Love for Learning' },
];

const PROGRAMS = [
    {
        icon: Baby,
        title: 'Nursery (Age 3)',
        copy: 'Introduction to school environment with focus on social skills, basic routines, and sensory exploration.',
        features: [
            'Gentle separation from parents',
            'Basic potty training support',
            'Sensory play activities',
            'Circle time and singing',
        ],
    },
    {
        icon: GraduationCap,
        title: 'Pre-K 1 (Age 4)',
        copy: 'Building independence and social skills while introducing early literacy and numeracy concepts through play.',
        features: [
            'Letter and sound recognition',
            'Number concepts 1-10',
            'Fine motor skill development',
            'Cooperative play activities',
        ],
    },
    {
        icon: GraduationCap,
        title: 'Pre-K 2 (Age 5)',
        copy: 'Kindergarten readiness program focusing on academic skills, independence, and school-ready behaviors.',
        features: [
            'Phonics and early reading',
            'Math concepts and counting',
            'Writing and pre-writing skills',
            'Problem-solving activities',
        ],
    },
    {
        icon: Clock,
        title: 'Extended Day Care',
        copy: 'Before and after school care providing a safe, nurturing environment with additional learning opportunities.',
        features: [
            '6:30 AM - 6:00 PM coverage',
            'Healthy meals and snacks',
            'Outdoor play time',
            'Quiet time and rest',
        ],
    },
    {
        icon: Palette,
        title: 'Creative Arts',
        copy: 'Fostering creativity and self-expression through art, music, and dramatic play experiences.',
        features: [
            'Daily art exploration',
            'Music and movement',
            'Dramatic play centers',
            'Seasonal craft projects',
        ],
    },
    {
        icon: Leaf,
        title: 'Nature & Science',
        copy: 'Hands-on exploration of the natural world through experiments, gardening, and outdoor learning.',
        features: [
            'Garden-to-table experiences',
            'Simple science experiments',
            'Weather and seasons study',
            'Animal and habitat learning',
        ],
    },
];

const FOCUS_AREAS = [
    {
        icon: Brain,
        title: 'Cognitive Development',
        copy: 'Problem-solving, memory, attention span, and critical thinking skills through age-appropriate challenges and activities.',
    },
    {
        icon: MessageCircle,
        title: 'Language & Communication',
        copy: 'Vocabulary building, listening skills, storytelling, and early literacy through books, songs, and conversations.',
    },
    {
        icon: Smile,
        title: 'Social & Emotional',
        copy: 'Friendship skills, empathy, self-regulation, and emotional intelligence through group activities and guidance.',
    },
    {
        icon: Activity,
        title: 'Physical Development',
        copy: 'Gross and fine motor skills, coordination, and healthy habits through active play and movement activities.',
    },
    {
        icon: Sparkles,
        title: 'Creative Expression',
        copy: 'Imagination, artistic skills, and self-expression through art, music, dance, and dramatic play experiences.',
    },
    {
        icon: Award,
        title: 'Independence & Confidence',
        copy: 'Self-help skills, decision-making, and confidence building through age-appropriate responsibilities and choices.',
    },
];

const SCHEDULE = [
    { time: '7:00 AM', title: 'Arrival & Free Play', copy: 'Gentle start with choice activities' },
    { time: '8:00 AM', title: 'Morning Circle', copy: 'Greetings, calendar, and daily plan' },
    { time: '8:30 AM', title: 'Learning Centers', copy: 'Literacy, math, and skill building' },
    { time: '9:30 AM', title: 'Snack & Social Time', copy: 'Healthy snack and conversation' },
    { time: '10:00 AM', title: 'Outdoor Play', copy: 'Physical activity and fresh air' },
    { time: '11:00 AM', title: 'Creative Arts', copy: 'Art, music, or dramatic play' },
    { time: '12:00 PM', title: 'Lunch Time', copy: 'Nutritious meal and social skills' },
    { time: '1:00 PM', title: 'Quiet Time/Rest', copy: 'Stories, relaxation, or nap' },
    { time: '2:00 PM', title: 'Science & Discovery', copy: 'Hands-on exploration' },
    { time: '3:00 PM', title: 'Closing Circle', copy: 'Review day and prepare for home' },
];

const TESTIMONIALS = [
    {
        quote: "My daughter loves coming to school every day! The teachers are so caring and patient. She's learned so much while having fun, and I can see her confidence growing daily.",
        name: 'Maria Santos',
        relation: 'Parent of Sofia, Pre-K 1',
    },
    {
        quote: 'The balance of learning and play is perfect. My son is reading simple books already and loves math games. The transition to kindergarten will be so smooth thanks to this program.',
        name: 'John Anderson',
        relation: 'Parent of Michael, Pre-K 2',
    },
    {
        quote: 'The extended day program is a lifesaver for working parents. I know my child is safe, happy, and continuing to learn even after regular school hours. The staff treats every child like family.',
        name: 'Lisa Chen',
        relation: 'Parent of Emma, Nursery',
    },
    {
        quote: 'What impressed me most is how they focus on the whole child - not just academics, but social skills, creativity, and emotional development. My shy son has blossomed here.',
        name: 'David Rodriguez',
        relation: 'Parent of Carlos, Pre-K 1',
    },
    {
        quote: "The communication between teachers and parents is excellent. I receive daily updates and photos, and the teachers really know my child's personality and learning style.",
        name: 'Sarah Johnson',
        relation: 'Parent of Lily, Pre-K 2',
    },
    {
        quote: 'The outdoor learning and nature activities are fantastic. My daughter comes home excited to tell me about the butterflies in their garden or the science experiment they did today.',
        name: 'Jennifer Kim',
        relation: 'Parent of Grace, Nursery',
    },
];

export default function PreElementary() {
    return (
        <>
            <Head title="EVIMS — Pre-Elementary" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Early Childhood Education
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Pre-Elementary
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Building strong foundations for lifelong learning
                    </p>

                    <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-[#1F2A24]/10 pt-6 sm:grid-cols-4">
                        {STATS.map((stat, index) => (
                            <div key={`${stat.label}-${index}`} className="flex flex-col items-start gap-2">
                                <stat.icon className="h-5 w-5 text-[#2F6F4E]" />
                                <dt className="text-2xl font-semibold text-[#1F2A24]">{stat.value}</dt>
                                <dd className="text-xs text-[#1F2A24]/60">{stat.label}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Early Learning Programs</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Comprehensive programs designed to nurture young minds
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {PROGRAMS.map((program) => (
                            <div key={program.title} className="rounded-2xl border border-[#1F2A24]/10 p-6">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                    <program.icon className="h-5 w-5 text-[#2F6F4E]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">{program.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">{program.copy}</p>
                                <ul className="mt-4 space-y-2">
                                    {program.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-[#1F2A24]/70">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E8A33D]" />
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
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Developmental Focus Areas</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Comprehensive approach to early childhood development
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FOCUS_AREAS.map((area) => (
                        <div key={area.title} className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A33D]/10">
                                <area.icon className="h-5 w-5 text-[#E8A33D]" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">{area.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">{area.copy}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">A Day in Pre-Elementary</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">Structured yet flexible daily routine</h2>

                    <ol className="mt-10 space-y-4 border-l border-[#1F2A24]/10 pl-6">
                        {SCHEDULE.map((slot) => (
                            <li key={slot.time} className="relative">
                                <span className="absolute top-1.5 -left-[29px] h-3 w-3 rounded-full bg-[#2F6F4E]" />
                                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">{slot.time}</p>
                                <h3 className="mt-1 font-serif text-lg font-semibold text-[#1F2A24]">{slot.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-[#1F2A24]/70">{slot.copy}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">What Parents Say</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Hear from families who have experienced our program
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {TESTIMONIALS.map((testimonial) => (
                        <div key={testimonial.name} className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6">
                            <Quote className="h-6 w-6 text-[#E8A33D]" />
                            <p className="mt-4 text-sm leading-relaxed text-[#1F2A24]/70">{testimonial.quote}</p>
                            <p className="mt-4 font-serif text-base font-semibold text-[#1F2A24]">{testimonial.name}</p>
                            <p className="text-xs text-[#1F2A24]/60">{testimonial.relation}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">Give Your Child the Best Start</h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Join our nurturing pre-elementary community
                        </p>
                    </div>
                    <Link
                        href="/admission"
                        className="rounded-full bg-[#FBF8F2] px-5 py-2 text-base font-semibold text-[#2F6F4E] shadow-sm transition-colors hover:bg-[#FBF8F2]/90"
                    >
                        Enroll Now
                    </Link>
                </div>
            </section>
        </>
    );
}
