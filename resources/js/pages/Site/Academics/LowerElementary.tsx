import { Head } from '@inertiajs/react';
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
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    DaySchedule,
    FeatureCards,
    IconCards,
    ProgramCta,
    ProgramHero,
    ProgramSection,
    Testimonials,
} from '@/components/academics/program-page';

const STATS = [
    { icon: GraduationCap, value: '1–3', label: 'Grade Levels' },
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
    {
        time: '8:00 AM',
        title: 'Morning Meeting',
        copy: 'Community building and daily preview',
    },
    {
        time: '8:30 AM',
        title: 'Reading Workshop',
        copy: 'Phonics, guided reading, and literacy centers',
    },
    {
        time: '9:45 AM',
        title: 'Math Exploration',
        copy: 'Number concepts and problem-solving',
    },
    {
        time: '10:30 AM',
        title: 'Snack & Recess',
        copy: 'Nutrition and outdoor play time',
    },
    {
        time: '11:00 AM',
        title: 'Writing Workshop',
        copy: 'Creative expression and communication',
    },
    {
        time: '12:00 PM',
        title: 'Lunch & Social Time',
        copy: 'Nutrition and peer interaction',
    },
    {
        time: '1:00 PM',
        title: 'Science Discovery',
        copy: 'Hands-on experiments and observations',
    },
    {
        time: '1:45 PM',
        title: 'Social Studies',
        copy: 'Community and cultural learning',
    },
    {
        time: '2:15 PM',
        title: 'Creative Arts',
        copy: 'Art, music, and creative expression',
    },
    {
        time: '2:45 PM',
        title: 'Closing Circle',
        copy: 'Reflection and preparation for home',
    },
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

            <ProgramHero
                current="lower-elementary"
                eyebrow="Grades 1–3"
                title="Lower Elementary"
                intro="Building strong foundations for lifelong learning through nurturing care, engaging activities, and developmentally appropriate instruction."
                stats={STATS}
            />

            <ProgramSection
                tone="white"
                title="Grade-Level Programs"
                description="Developmentally appropriate learning experiences tailored to each grade level's unique needs and milestones."
            >
                <FeatureCards items={PROGRAMS} columns={4} />
            </ProgramSection>

            <ProgramSection
                title="Core Learning Areas"
                description="A comprehensive curriculum addressing every aspect of early elementary education and development."
            >
                <IconCards items={LEARNING_AREAS} />
            </ProgramSection>

            <ProgramSection
                tone="white"
                title="Our Teaching Approach"
                description="Research-based methods that make learning engaging, meaningful, and successful for every child."
            >
                <IconCards items={TEACHING_APPROACH} variant="dark" />
            </ProgramSection>

            <ProgramSection
                title="A Day of Learning"
                description="A balanced daily schedule combining focused instruction, active learning, and creative exploration."
            >
                <DaySchedule slots={SCHEDULE} />
            </ProgramSection>

            <ProgramSection
                tone="white"
                title="Parent Experiences"
                description="Hear from families who have watched their children thrive in our nurturing lower elementary environment."
            >
                <Testimonials items={TESTIMONIALS} />
            </ProgramSection>

            <ProgramCta
                current="lower-elementary"
                title="Start Your Child's Learning Journey"
                copy="Give your child the strong foundation they need for academic success and personal growth in our nurturing, engaging lower elementary program."
            />
        </>
    );
}
