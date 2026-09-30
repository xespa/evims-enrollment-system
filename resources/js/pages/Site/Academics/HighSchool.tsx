import { Head } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    Compass,
    Crown,
    Cpu,
    GraduationCap,
    Globe,
    HandHeart,
    Heart,
    HeartPulse,
    Lightbulb,
    Palette,
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
    { icon: GraduationCap, value: '7–10', label: 'Grade Levels' },
    { icon: Users, value: '1:15', label: 'Teacher to Student Ratio' },
    { icon: Award, value: '95%', label: 'College Acceptance Rate' },
    { icon: Compass, value: '25+', label: 'AP & Honors Courses' },
];

const PROGRAMS = [
    {
        icon: GraduationCap,
        title: 'Core Academic Curriculum',
        copy: 'Rigorous foundation in English, Mathematics, Science, and Social Studies with advanced placement opportunities.',
        features: [
            '4-year college preparatory track',
            'Honors and AP course options',
            'Small class sizes for personalized attention',
            'Research and critical thinking emphasis',
        ],
    },
    {
        icon: Cpu,
        title: 'STEM Excellence',
        copy: 'Advanced science, technology, engineering, and mathematics programs with hands-on laboratory experiences.',
        features: [
            'State-of-the-art science laboratories',
            'Robotics and engineering programs',
            'Computer science and coding',
            'STEM competition participation',
        ],
    },
    {
        icon: Palette,
        title: 'Arts & Humanities',
        copy: 'Creative expression and cultural understanding through visual arts, performing arts, and language studies.',
        features: [
            'Visual arts and digital media',
            'Theater and performing arts',
            'Foreign language programs',
            'Creative writing and journalism',
        ],
    },
    {
        icon: Briefcase,
        title: 'Business & Economics',
        copy: 'Entrepreneurship, financial literacy, and business fundamentals preparing students for the modern economy.',
        features: [
            'Business management principles',
            'Economics and financial literacy',
            'Entrepreneurship projects',
            'Internship opportunities',
        ],
    },
    {
        icon: HeartPulse,
        title: 'Health & Wellness',
        copy: 'Comprehensive health education, physical fitness, and mental wellness programs for holistic development.',
        features: [
            'Physical education and sports',
            'Health and nutrition education',
            'Mental health awareness',
            'Life skills development',
        ],
    },
    {
        icon: HandHeart,
        title: 'Service Learning',
        copy: 'Community engagement and social responsibility through service projects and volunteer opportunities.',
        features: [
            'Community service requirements',
            'Global awareness projects',
            'Environmental stewardship',
            'Social justice initiatives',
        ],
    },
];

const DEVELOPMENT_FOCUS = [
    {
        icon: GraduationCap,
        title: 'Academic Excellence',
        copy: 'Critical thinking, research skills, and intellectual curiosity through challenging coursework and innovative teaching methods.',
    },
    {
        icon: Crown,
        title: 'Leadership & Character',
        copy: 'Leadership opportunities, ethical decision-making, and character development through student government and service projects.',
    },
    {
        icon: Globe,
        title: 'Global Citizenship',
        copy: 'Cultural awareness, social responsibility, and global perspective through diverse curriculum and international connections.',
    },
    {
        icon: Lightbulb,
        title: 'Innovation & Creativity',
        copy: 'Problem-solving skills, creative thinking, and innovation through project-based learning and interdisciplinary approaches.',
    },
    {
        icon: Compass,
        title: 'College & Career Readiness',
        copy: 'College preparation, career exploration, and professional skills development through counseling and mentorship programs.',
    },
    {
        icon: Heart,
        title: 'Personal Wellness',
        copy: 'Physical health, mental wellness, and work-life balance through comprehensive health education and support services.',
    },
];

const SCHEDULE = [
    {
        time: '7:30 AM',
        title: 'Homeroom',
        copy: 'Daily announcements and planning',
    },
    { time: '8:00 AM', title: 'Period 1', copy: 'Core academic subject' },
    { time: '9:00 AM', title: 'Period 2', copy: 'Core academic subject' },
    { time: '10:00 AM', title: 'Break', copy: 'Social time and refreshments' },
    { time: '10:15 AM', title: 'Period 3', copy: 'Elective or specialization' },
    { time: '11:15 AM', title: 'Period 4', copy: 'Core academic subject' },
    {
        time: '12:15 PM',
        title: 'Lunch',
        copy: 'Nutritious meal and socialization',
    },
    { time: '1:00 PM', title: 'Period 5', copy: 'Laboratory or workshop time' },
    { time: '2:00 PM', title: 'Period 6', copy: 'Elective or support class' },
    {
        time: '3:00 PM',
        title: 'Dismissal/Activities',
        copy: 'Sports, clubs, tutoring',
    },
];

const TESTIMONIALS = [
    {
        quote: 'The academic rigor combined with supportive teachers helped my daughter gain admission to her dream university. The college counseling program is exceptional and truly individualized.',
        name: 'Patricia Williams',
        relation: 'Parent of Jessica, Class of 2024',
    },
    {
        quote: 'My son discovered his passion for engineering through the STEM program. The hands-on projects and competitions built his confidence and skills for his future career path.',
        name: 'Robert Martinez',
        relation: 'Parent of Alex, Grade 11',
    },
    {
        quote: 'The small class sizes mean teachers really know each student. My daughter receives personalized attention and challenging work that pushes her to excel academically.',
        name: 'Michelle Thompson',
        relation: 'Parent of Sarah, Grade 10',
    },
    {
        quote: 'The leadership opportunities and service learning projects have shaped my character and given me purpose. I feel prepared for college and confident about making a positive impact in the world.',
        name: 'Marcus Johnson',
        relation: 'Student, Grade 12',
    },
    {
        quote: 'The arts program is incredible! My son has flourished in theater and digital media classes. The school celebrates creativity while maintaining high academic standards.',
        name: 'Lisa Chang',
        relation: 'Parent of David, Grade 9',
    },
    {
        quote: 'The college counseling team guided me through every step of the application process. Their support and expertise helped me secure scholarships and admission to multiple top universities.',
        name: 'Emily Rodriguez',
        relation: 'Student, Class of 2024',
    },
];

export default function HighSchool() {
    return (
        <>
            <Head title="EVIMS — High School" />

            <ProgramHero
                current="high-school"
                eyebrow="Grades 7–10"
                title="High School"
                intro="Empowering tomorrow's leaders through rigorous academics, character development, and innovative learning experiences that prepare students for lifelong achievement."
                stats={STATS}
            />

            <ProgramSection
                tone="white"
                title="Academic Programs"
                description="Comprehensive high school programs designed to challenge, inspire, and prepare students for success beyond the classroom."
            >
                <FeatureCards items={PROGRAMS} />
            </ProgramSection>

            <ProgramSection
                title="Student Development Focus"
                description="A comprehensive approach to adolescent development, preparing students for further studies, career, and citizenship."
            >
                <IconCards items={DEVELOPMENT_FOCUS} />
            </ProgramSection>

            <ProgramSection
                tone="white"
                title="Daily Schedule"
                description="A structured academic day with flexibility for individual learning needs and extracurricular engagement."
            >
                <DaySchedule slots={SCHEDULE} />
            </ProgramSection>

            <ProgramSection
                title="What Families Say"
                description="Hear from parents and students who have experienced our high school education."
            >
                <Testimonials items={TESTIMONIALS} />
            </ProgramSection>

            <ProgramCta
                current="high-school"
                title="Shape Your Future Today"
                copy="Join our dynamic high school community where academic excellence meets character development, preparing students to become confident leaders and responsible global citizens."
            />
        </>
    );
}
