import { Head, Link } from '@inertiajs/react';
import {
    Award,
    Bot,
    BookOpen,
    Brain,
    Calculator,
    Code,
    Compass,
    Crown,
    Drama,
    FlaskConical,
    GraduationCap,
    Globe,
    Leaf,
    Lightbulb,
    MessageCircle,
    Microscope,
    Music,
    Newspaper,
    Palette,
    Puzzle,
    Quote,
    Trophy,
    Users,
} from 'lucide-react';

const STATS = [
    { icon: GraduationCap, value: '4-6', label: 'Grade Levels' },
    { icon: Users, value: '1:15', label: 'Teacher to Student Ratio' },
    { icon: BookOpen, value: '12', label: 'Core & Elective Subjects' },
    { icon: Award, value: '95%', label: 'Middle School Readiness' },
];

const SUBJECTS = [
    {
        icon: BookOpen,
        title: 'English Language Arts',
        copy: 'Advanced reading, writing, grammar, and literature analysis developing critical thinking and communication skills.',
        features: [
            'Novel studies and book clubs',
            'Research and report writing',
            'Poetry analysis and creative writing',
            'Public speaking and presentations',
        ],
    },
    {
        icon: Calculator,
        title: 'Mathematics',
        copy: 'Comprehensive math program covering advanced operations, problem-solving, and pre-algebra concepts.',
        features: [
            'Multi-step problem solving',
            'Fractions, decimals, and percentages',
            'Geometry and measurement',
            'Data analysis and statistics',
        ],
    },
    {
        icon: FlaskConical,
        title: 'Science',
        copy: 'Hands-on scientific inquiry exploring life science, earth science, and physical science concepts.',
        features: [
            'Laboratory experiments',
            'Scientific method application',
            'Research projects',
            'STEM integration activities',
        ],
    },
    {
        icon: Globe,
        title: 'Social Studies',
        copy: 'Exploration of history, geography, civics, and cultures developing global awareness and citizenship.',
        features: [
            'American and world history',
            'Geography and map skills',
            'Government and civic responsibility',
            'Cultural studies and diversity',
        ],
    },
    {
        icon: Code,
        title: 'Technology',
        copy: 'Digital literacy and computer science fundamentals preparing students for a technology-driven world.',
        features: [
            'Coding and programming basics',
            'Digital citizenship and safety',
            'Multimedia presentations',
            'Research and information literacy',
        ],
    },
    {
        icon: Palette,
        title: 'Arts & Enrichment',
        copy: 'Creative expression through visual arts, music, physical education, and specialized enrichment programs.',
        features: [
            'Visual arts and crafts',
            'Music theory and performance',
            'Physical education and sports',
            'Foreign language introduction',
        ],
    },
];

const SKILLS = [
    {
        icon: Brain,
        title: 'Critical Thinking',
        copy: 'Analyzing information, evaluating sources, and making logical connections across subjects and real-world situations.',
    },
    {
        icon: Lightbulb,
        title: 'Problem Solving',
        copy: 'Developing strategies to tackle complex challenges using creativity, logic, and systematic approaches.',
    },
    {
        icon: Users,
        title: 'Collaboration',
        copy: 'Working effectively in teams, communicating ideas clearly, and contributing to group success.',
    },
    {
        icon: Crown,
        title: 'Leadership',
        copy: 'Taking initiative, making responsible decisions, and inspiring others through positive example.',
    },
    {
        icon: MessageCircle,
        title: 'Communication',
        copy: 'Expressing ideas clearly in writing and speaking, listening actively, and adapting to different audiences.',
    },
    {
        icon: Compass,
        title: 'Adaptability',
        copy: 'Embracing change, learning from mistakes, and adjusting strategies based on new information.',
    },
];

const ACTIVITIES = [
    {
        icon: Puzzle,
        title: 'Chess Club',
        copy: 'Strategic thinking and problem-solving through competitive chess',
    },
    {
        icon: Bot,
        title: 'Robotics Team',
        copy: 'Building and programming robots for competitions',
    },
    {
        icon: Newspaper,
        title: 'Student Newspaper',
        copy: 'Writing, editing, and publishing school news',
    },
    {
        icon: Leaf,
        title: 'Environmental Club',
        copy: 'Sustainability projects and environmental awareness',
    },
    {
        icon: Drama,
        title: 'Drama Club',
        copy: 'Acting, set design, and theatrical productions',
    },
    {
        icon: Trophy,
        title: 'Sports Teams',
        copy: 'Basketball, soccer, track, and other competitive sports',
    },
    {
        icon: Music,
        title: 'School Band',
        copy: 'Musical performance and concert preparation',
    },
    {
        icon: Microscope,
        title: 'Science Fair',
        copy: 'Independent research and scientific investigation',
    },
];

const ACHIEVEMENTS = [
    {
        value: '87%',
        title: 'Above Grade Level',
        copy: 'Students performing above expected grade level in core subjects',
    },
    {
        value: '15',
        title: 'Competition Wins',
        copy: 'Regional and state competition victories this academic year',
    },
    {
        value: '92%',
        title: 'Leadership Roles',
        copy: 'Students taking on leadership positions in clubs and activities',
    },
];

const SPOTLIGHTS = [
    {
        quote: 'My science fair project on renewable energy sources won first place at the regional competition. I learned so much about solar panels and wind turbines!',
        name: 'Alex Thompson',
        relation: '5th Grade - Science Fair Champion',
    },
    {
        quote: 'Writing and illustrating my own chapter book was challenging but so rewarding. Our teacher helped me publish it in the school library for other students to read.',
        name: 'Maya Patel',
        relation: '6th Grade - Published Author',
    },
    {
        quote: 'Leading the robotics team taught me about programming and teamwork. We made it to the state championship and placed third overall!',
        name: 'Jordan Martinez',
        relation: '6th Grade - Robotics Team Captain',
    },
    {
        quote: "Organizing our school's recycling program showed me how students can make a real difference in protecting our environment and our community.",
        name: 'Emma Chen',
        relation: '5th Grade - Environmental Leader',
    },
    {
        quote: 'Performing the lead role in our school play was scary at first, but it helped me become more confident speaking in front of people.',
        name: 'Lucas Rodriguez',
        relation: '4th Grade - Drama Club Star',
    },
    {
        quote: 'Creating my math tutoring program for younger students taught me that helping others learn also helps me understand concepts better.',
        name: 'Sophia Kim',
        relation: '6th Grade - Peer Tutor',
    },
];

export default function UpperElementary() {
    return (
        <>
            <Head title="EVIMS — Upper Elementary" />

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Grades 4–6
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Upper Elementary
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Building academic excellence and independence in grades
                        4-6 through challenging curriculum, critical thinking,
                        and leadership development opportunities
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
                        Core Academic Subjects
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Rigorous, standards-based curriculum designed to
                        challenge students and prepare them for advanced
                        learning
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {SUBJECTS.map((subject) => (
                            <div
                                key={subject.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                    <subject.icon className="h-5 w-5 text-[#2F6F4E]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {subject.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {subject.copy}
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {subject.features.map((feature) => (
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
                    21st Century Skills
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Essential skills and competencies for success in middle
                    school, high school, and beyond
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {SKILLS.map((skill) => (
                        <div
                            key={skill.title}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A33D]/10">
                                <skill.icon className="h-5 w-5 text-[#E8A33D]" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {skill.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {skill.copy}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Enrichment Activities
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Beyond academics, students explore interests, develop
                        talents, and build friendships through diverse
                        activities
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {ACTIVITIES.map((activity) => (
                            <div
                                key={activity.title}
                                className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]"
                            >
                                <activity.icon className="h-5 w-5 text-[#E8A33D]" />
                                <h3 className="mt-3 font-serif text-lg font-semibold">
                                    {activity.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#FBF8F2]/70">
                                    {activity.copy}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    Student Achievements
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Our upper elementary students consistently excel in
                    academics, competitions, and personal growth
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {ACHIEVEMENTS.map((achievement) => (
                        <div
                            key={achievement.title}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-8 text-center"
                        >
                            <p className="font-serif text-4xl font-semibold text-[#2F6F4E]">
                                {achievement.value}
                            </p>
                            <h3 className="mt-2 font-serif text-lg font-semibold text-[#1F2A24]">
                                {achievement.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {achievement.copy}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Student Spotlights
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Celebrating the outstanding work and achievements of our
                        upper elementary students
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {SPOTLIGHTS.map((spotlight) => (
                            <div
                                key={spotlight.name}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <Quote className="h-6 w-6 text-[#E8A33D]" />
                                <p className="mt-4 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {spotlight.quote}
                                </p>
                                <p className="mt-4 font-serif text-base font-semibold text-[#1F2A24]">
                                    {spotlight.name}
                                </p>
                                <p className="text-xs text-[#1F2A24]/60">
                                    {spotlight.relation}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                            Prepare for Future Success
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Join our upper elementary program where academic
                            excellence meets character development, preparing
                            confident, capable students ready for middle school
                            challenges and beyond.
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
