import { Head, Link } from '@inertiajs/react';
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
    Quote,
    Users,
} from 'lucide-react';

const STATS = [
    { icon: GraduationCap, value: '9-12', label: 'Grade Levels' },
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

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Grades 9–12
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        High School
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Empowering tomorrow's leaders through rigorous
                        academics, character development, and innovative
                        learning experiences that prepare students for college
                        success and lifelong achievement
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
                        Academic Programs
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Comprehensive high school programs designed to
                        challenge, inspire, and prepare students for success in
                        college and beyond
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {PROGRAMS.map((program) => (
                            <div
                                key={program.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                    <program.icon className="h-5 w-5 text-[#2F6F4E]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {program.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {program.copy}
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {program.features.map((feature) => (
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
                    Student Development Focus
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Comprehensive approach to adolescent development preparing
                    students for college, career, and citizenship
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {DEVELOPMENT_FOCUS.map((item) => (
                        <div
                            key={item.title}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A33D]/10">
                                <item.icon className="h-5 w-5 text-[#E8A33D]" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {item.copy}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Daily Schedule
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Structured academic day with flexibility for individual
                        learning needs and extracurricular engagement
                    </h2>

                    <ol className="mt-10 space-y-4 border-l border-[#1F2A24]/10 pl-6">
                        {SCHEDULE.map((slot) => (
                            <li key={slot.time} className="relative">
                                <span className="absolute top-1.5 -left-[29px] h-3 w-3 rounded-full bg-[#2F6F4E]" />
                                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                                    {slot.time}
                                </p>
                                <h3 className="mt-1 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {slot.title}
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {slot.copy}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    What Families Say
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Hear from parents and students who have experienced the
                    transformative power of our high school education
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {TESTIMONIALS.map((testimonial) => (
                        <div
                            key={testimonial.name}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            <Quote className="h-6 w-6 text-[#E8A33D]" />
                            <p className="mt-4 text-sm leading-relaxed text-[#1F2A24]/70">
                                {testimonial.quote}
                            </p>
                            <p className="mt-4 font-serif text-base font-semibold text-[#1F2A24]">
                                {testimonial.name}
                            </p>
                            <p className="text-xs text-[#1F2A24]/60">
                                {testimonial.relation}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-[#2F6F4E]">
                <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl font-semibold text-[#FBF8F2]">
                            Shape Your Future Today
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-[#FBF8F2]/80">
                            Join our dynamic high school community where
                            academic excellence meets character development,
                            preparing students to become confident leaders and
                            responsible global citizens ready for college
                            success.
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
