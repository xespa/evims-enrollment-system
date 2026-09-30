import { Head } from '@inertiajs/react';
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
    Trophy,
    Users,
} from 'lucide-react';
import {
    FeatureCards,
    Highlights,
    IconCards,
    ProgramCta,
    ProgramHero,
    ProgramSection,
    Testimonials,
} from '@/components/academics/program-page';

const STATS = [
    { icon: GraduationCap, value: '4–6', label: 'Grade Levels' },
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

            <ProgramHero
                current="upper-elementary"
                eyebrow="Grades 4–6"
                title="Upper Elementary"
                intro="Building academic excellence and independence through a challenging curriculum, critical thinking, and leadership development opportunities."
                stats={STATS}
            />

            <ProgramSection
                tone="white"
                title="Core Academic Subjects"
                description="A rigorous, standards-based curriculum designed to challenge students and prepare them for advanced learning."
            >
                <FeatureCards items={SUBJECTS} />
            </ProgramSection>

            <ProgramSection
                title="21st Century Skills"
                description="Essential skills and competencies for success in high school and beyond."
            >
                <IconCards items={SKILLS} />
            </ProgramSection>

            <ProgramSection
                tone="white"
                title="Enrichment Activities"
                description="Beyond academics, students explore interests, develop talents, and build friendships through diverse activities."
            >
                <IconCards items={ACTIVITIES} variant="dark" columns={4} />
            </ProgramSection>

            <ProgramSection
                title="Student Achievements"
                description="Our upper elementary students consistently excel in academics, competitions, and personal growth."
            >
                <Highlights items={ACHIEVEMENTS} />
            </ProgramSection>

            <ProgramSection
                tone="white"
                title="Student Spotlights"
                description="Celebrating the outstanding work and achievements of our upper elementary students."
            >
                <Testimonials items={SPOTLIGHTS} />
            </ProgramSection>

            <ProgramCta
                current="upper-elementary"
                title="Prepare for Future Success"
                copy="Join our upper elementary program where academic excellence meets character development, preparing confident, capable students for the challenges ahead."
            />
        </>
    );
}
