import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    Calculator,
    FlaskConical,
    Gamepad2,
    Globe,
    GraduationCap,
    Hand,
    Heart,
    Home,
    Notebook,
    Palette,
    PenLine,
    Quote,
    TrendingUp,
    Users,
} from 'lucide-react';

const STATS = [
    { icon: GraduationCap, value: 'K-3', label: 'Grade Levels' },
    { icon: Users, value: '1:12', label: 'Teacher to Student Ratio' },
    { icon: Notebook, value: '6.5', label: 'Hours of Learning Daily' },
    { icon: BookOpen, value: '100%', label: 'Reading Success Rate' },
];

const PROGRAMS = [
    {
        icon: PenLine,
        title: 'Kindergarten',
        copy: 'Introduction to formal learning with focus on phonics, number sense, social skills, and school readiness.',
        features: [
            'Letter recognition and phonics',
            'Numbers 1-20 and basic counting',
            'Following directions and routines',
            'Fine motor skill development',
        ],
    },
    {
        icon: BookOpen,
        title: 'First Grade',
        copy: 'Building reading fluency, math concepts, and independent learning skills through structured activities.',
        features: [
            'Beginning reading and sight words',
            'Addition and subtraction facts',
            'Basic writing and sentence structure',
            'Science observation and exploration',
        ],
    },
    {
        icon: Notebook,
        title: 'Second Grade',
        copy: 'Expanding literacy and numeracy skills while developing critical thinking and problem-solving abilities.',
        features: [
            'Reading comprehension strategies',
            'Two-digit math operations',
            'Creative writing and storytelling',
            'Social studies and community helpers',
        ],
    },
    {
        icon: GraduationCap,
        title: 'Third Grade',
        copy: 'Advanced skill development and increased independence preparing students for upper elementary challenges.',
        features: [
            'Chapter book reading and analysis',
            'Multiplication and division concepts',
            'Research projects and presentations',
            'Scientific method introduction',
        ],
    },
];

const LEARNING_AREAS = [
    {
        icon: BookOpen,
        title: 'Reading & Language Arts',
        copy: 'Phonics, vocabulary, comprehension, and writing skills through engaging literature and hands-on activities.',
    },
    {
        icon: Calculator,
        title: 'Mathematics',
        copy: 'Number sense, operations, patterns, and problem-solving using manipulatives and real-world connections.',
    },
    {
        icon: FlaskConical,
        title: 'Science Discovery',
        copy: 'Hands-on experiments, observations, and investigations fostering curiosity about the natural world.',
    },
    {
        icon: Globe,
        title: 'Social Studies',
        copy: 'Community awareness, cultural understanding, and basic geography through interactive lessons and projects.',
    },
    {
        icon: Palette,
        title: 'Creative Arts',
        copy: 'Visual arts, music, and creative expression integrated across all subject areas for enhanced learning.',
    },
    {
        icon: Activity,
        title: 'Physical Education',
        copy: 'Gross motor development, coordination, teamwork, and healthy lifestyle habits through active play.',
    },
];

const TEACHING_APPROACH = [
    {
        icon: Hand,
        title: 'Hands-On Learning',
        copy: 'Interactive activities and manipulatives make abstract concepts concrete',
    },
    {
        icon: Users,
        title: 'Small Group Instruction',
        copy: 'Targeted teaching based on individual student needs and learning styles',
    },
    {
        icon: Gamepad2,
        title: 'Learning Through Play',
        copy: 'Educational games and activities that make learning fun and memorable',
    },
    {
        icon: TrendingUp,
        title: 'Progress Monitoring',
        copy: 'Regular assessment and feedback to ensure continuous growth and success',
    },
    {
        icon: Heart,
        title: 'Social-Emotional Learning',
        copy: 'Building confidence, empathy, and positive relationships alongside academics',
    },
    {
        icon: Home,
        title: 'Family Partnership',
        copy: 'Strong home-school connection supporting student success and growth',
    },
];

const SCHEDULE = [
    { time: '8:00 AM', title: 'Morning Meeting', copy: 'Community building and daily preview' },
    { time: '8:30 AM', title: 'Reading Workshop', copy: 'Phonics, guided reading, and literacy centers' },
    { time: '9:45 AM', title: 'Math Exploration', copy: 'Number concepts and problem-solving' },
    { time: '10:30 AM', title: 'Snack & Recess', copy: 'Nutrition and outdoor play time' },
    { time: '11:00 AM', title: 'Writing Workshop', copy: 'Creative expression and communication' },
    { time: '12:00 PM', title: 'Lunch & Social Time', copy: 'Nutrition and peer interaction' },
    { time: '1:00 PM', title: 'Science Discovery', copy: 'Hands-on experiments and observations' },
    { time: '1:45 PM', title: 'Social Studies', copy: 'Community and cultural learning' },
    { time: '2:15 PM', title: 'Creative Arts', copy: 'Art, music, and creative expression' },
    { time: '2:45 PM', title: 'Closing Circle', copy: 'Reflection and preparation for home' },
];

const TESTIMONIALS = [
    {
        quote: "My daughter went from struggling with reading to loving books! The teachers are so patient and find creative ways to help every child succeed. She can't wait to go to school each day.",
        name: 'Amanda Rodriguez',
        relation: 'Parent of Isabella, 2nd Grade',
    },
    {
        quote: 'The hands-on math activities have made such a difference. My son actually enjoys math now and can explain concepts to me using the manipulatives they use in class.',
        name: 'Michael Chen',
        relation: 'Parent of Andrew, 1st Grade',
    },
    {
        quote: "The small class sizes mean the teacher really knows my child's strengths and areas for growth. The personalized attention has helped her confidence soar.",
        name: 'Sarah Johnson',
        relation: 'Parent of Emma, Kindergarten',
    },
    {
        quote: 'I love how they integrate learning across subjects. When studying butterflies in science, they write about them in language arts and count them in math. It all connects!',
        name: 'David Martinez',
        relation: 'Parent of Sofia, 3rd Grade',
    },
    {
        quote: "The communication between home and school is excellent. I receive regular updates on my child's progress and ways to support learning at home.",
        name: 'Lisa Thompson',
        relation: 'Parent of Jacob, 2nd Grade',
    },
    {
        quote: 'My shy kindergartener has blossomed socially and academically. The nurturing environment helps children feel safe to take risks and try new things.',
        name: 'Jennifer Kim',
        relation: 'Parent of Grace, Kindergarten',
    },
];

export default function LowerElementary() {
    return (
        <>
            <Head title="EVIMS — Lower Elementary" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Grades K–3
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Lower Elementary
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Building strong foundations for lifelong learning in grades K-3 through nurturing care, engaging
                        activities, and developmentally appropriate instruction
                    </p>

                    <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-[#1F2A24]/10 pt-6 sm:grid-cols-4">
                        {STATS.map((stat) => (
                            <div key={stat.label} className="flex flex-col items-start gap-2">
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
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Grade-Level Programs</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Developmentally appropriate learning experiences tailored to each grade level's unique needs and
                        milestones
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Core Learning Areas</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Comprehensive curriculum addressing all aspects of early elementary education and development
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {LEARNING_AREAS.map((area) => (
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
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Our Teaching Approach</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Research-based methods and strategies that make learning engaging, meaningful, and successful for
                        every child
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {TEACHING_APPROACH.map((item) => (
                            <div key={item.title} className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]">
                                <item.icon className="h-5 w-5 text-[#E8A33D]" />
                                <h3 className="mt-3 font-serif text-lg font-semibold">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/70">{item.copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">A Day of Learning</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Balanced daily schedule combining focused instruction, active learning, and creative exploration
                </h2>

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
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">Parent Experiences</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Hear from families who have watched their children thrive in our nurturing lower elementary
                        environment
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.name} className="rounded-2xl border border-[#1F2A24]/10 p-6">
                                <Quote className="h-6 w-6 text-[#E8A33D]" />
                                <p className="mt-4 text-sm leading-relaxed text-[#1F2A24]/70">{testimonial.quote}</p>
                                <p className="mt-4 font-serif text-base font-semibold text-[#1F2A24]">{testimonial.name}</p>
                                <p className="text-xs text-[#1F2A24]/60">{testimonial.relation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">Start Your Child's Learning Journey</h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Give your child the strong foundation they need for academic success and personal growth in our
                            nurturing, engaging lower elementary program.
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
