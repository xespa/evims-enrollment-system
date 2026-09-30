import { Head } from '@inertiajs/react';
import {
    Activity,
    Award,
    Baby,
    Brain,
    Clock,
    GraduationCap,
    Heart,
    Leaf,
    MessageCircle,
    Palette,
    Smile,
    Sparkles,
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
    {
        time: '7:00 AM',
        title: 'Arrival & Free Play',
        copy: 'Gentle start with choice activities',
    },
    {
        time: '8:00 AM',
        title: 'Morning Circle',
        copy: 'Greetings, calendar, and daily plan',
    },
    {
        time: '8:30 AM',
        title: 'Learning Centers',
        copy: 'Literacy, math, and skill building',
    },
    {
        time: '9:30 AM',
        title: 'Snack & Social Time',
        copy: 'Healthy snack and conversation',
    },
    {
        time: '10:00 AM',
        title: 'Outdoor Play',
        copy: 'Physical activity and fresh air',
    },
    {
        time: '11:00 AM',
        title: 'Creative Arts',
        copy: 'Art, music, or dramatic play',
    },
    {
        time: '12:00 PM',
        title: 'Lunch Time',
        copy: 'Nutritious meal and social skills',
    },
    {
        time: '1:00 PM',
        title: 'Quiet Time/Rest',
        copy: 'Stories, relaxation, or nap',
    },
    {
        time: '2:00 PM',
        title: 'Science & Discovery',
        copy: 'Hands-on exploration',
    },
    {
        time: '3:00 PM',
        title: 'Closing Circle',
        copy: 'Review day and prepare for home',
    },
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

            <ProgramHero
                current="pre-elementary"
                eyebrow="Early Childhood · Nursery – Pre-K 2"
                title="Pre-Elementary"
                intro="Building strong foundations for lifelong learning — a warm, playful start where young children grow in independence, curiosity, and confidence."
                stats={STATS}
            />

            <ProgramSection
                tone="white"
                title="Early Learning Programs"
                description="Comprehensive programs designed to nurture young minds."
            >
                <FeatureCards items={PROGRAMS} />
            </ProgramSection>

            <ProgramSection
                title="Developmental Focus Areas"
                description="A comprehensive approach to early childhood development."
            >
                <IconCards items={FOCUS_AREAS} />
            </ProgramSection>

            <ProgramSection
                tone="white"
                title="A Day in Pre-Elementary"
                description="A structured yet flexible daily routine."
            >
                <DaySchedule slots={SCHEDULE} />
            </ProgramSection>

            <ProgramSection
                title="What Parents Say"
                description="Hear from families who have experienced our program."
            >
                <Testimonials items={TESTIMONIALS} />
            </ProgramSection>

            <ProgramCta
                current="pre-elementary"
                title="Give Your Child the Best Start"
                copy="Join our nurturing pre-elementary community."
            />
        </>
    );
}
