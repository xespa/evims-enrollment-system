import { Head, Link } from '@inertiajs/react';
import {
    Archive,
    BookCopy,
    BookMarked,
    BookOpen,
    CalendarOff,
    Clock,
    Database,
    FileText,
    GraduationCap,
    Library as LibraryIcon,
    Monitor,
    ScrollText,
    Search,
    UsersRound,
    Video,
    Wifi,
} from 'lucide-react';
import {
    FeatureCards,
    HoursCards,
    IconCards,
    PageSection,
    TeamCards,
} from '@/components/site/page-sections';
import {
    ServiceCta,
    ServiceHero,
} from '@/components/student-services/service-page';

const STATS = [
    { icon: LibraryIcon, value: '50,000+', label: 'Books & Resources' },
    { icon: Wifi, value: '24/7', label: 'Digital Access' },
    { icon: UsersRound, value: '1500+', label: 'Daily Visitors' },
    { icon: Database, value: '200+', label: 'Online Databases' },
];

const SERVICES = [
    {
        icon: BookOpen,
        title: 'Book Collection & Circulation',
        copy: 'Extensive collection of physical and digital books across all academic disciplines and recreational reading materials.',
        features: [
            '50,000+ physical books',
            'E-book collection access',
            'Interlibrary loan services',
            'Book reservation system',
        ],
    },
    {
        icon: Search,
        title: 'Research & Reference Services',
        copy: 'Professional research assistance and reference services to support academic and personal research projects.',
        features: [
            'One-on-one research consultations',
            'Citation and bibliography help',
            'Database training sessions',
            'Research methodology guidance',
        ],
    },
    {
        icon: Database,
        title: 'Digital Resources & Databases',
        copy: 'Access to extensive online databases, journals, and digital resources for comprehensive research and learning.',
        features: [
            'Academic databases access',
            'Online journals and articles',
            'Digital archives',
            '24/7 remote access',
        ],
    },
    {
        icon: UsersRound,
        title: 'Study Spaces & Collaboration',
        copy: 'Variety of study environments including quiet study areas, group collaboration spaces, and technology-equipped rooms.',
        features: [
            'Individual study carrels',
            'Group study rooms',
            'Collaborative work spaces',
            'Presentation practice rooms',
        ],
    },
    {
        icon: GraduationCap,
        title: 'Information Literacy Programs',
        copy: 'Educational programs and workshops designed to develop critical information literacy and research skills.',
        features: [
            'Information literacy classes',
            'Research skills workshops',
            'Academic writing support',
            'Digital citizenship training',
        ],
    },
    {
        icon: Monitor,
        title: 'Technology & Media Services',
        copy: 'Access to computers, printing services, multimedia equipment, and technical support for academic projects.',
        features: [
            'Computer and internet access',
            'Printing and scanning services',
            'Multimedia equipment checkout',
            'Technical support',
        ],
    },
];

const TEAM = [
    {
        name: 'Dr. Sarah Mitchell, MLS',
        role: 'Head Librarian',
        bio: 'Master of Library Science with 15 years experience in academic libraries and information systems management.',
    },
    {
        name: 'Mr. David Rodriguez, MLIS',
        role: 'Research Services Librarian',
        bio: 'Information specialist focused on research support, database management, and scholarly communication services.',
    },
    {
        name: 'Ms. Jennifer Lee, MLS',
        role: 'Collection Development Librarian',
        bio: 'Specialist in collection management, acquisitions, and digital resource development for academic programs.',
    },
    {
        name: 'Mr. Thomas Anderson, MIT',
        role: 'Digital Services Coordinator',
        bio: 'Technology specialist managing digital resources, online databases, and library technology infrastructure.',
    },
];

const DIGITAL_COLLECTIONS = [
    {
        icon: Database,
        title: 'Academic Databases',
        copy: 'Access to scholarly databases and journals',
    },
    {
        icon: BookMarked,
        title: 'E-Book Collection',
        copy: 'Digital books and reference materials',
    },
    {
        icon: FileText,
        title: 'Online Journals',
        copy: 'Current and archived journal articles',
    },
    {
        icon: Archive,
        title: 'Digital Archives',
        copy: 'Historical documents and special collections',
    },
    {
        icon: Video,
        title: 'Media Resources',
        copy: 'Videos, documentaries, and multimedia content',
    },
    {
        icon: ScrollText,
        title: 'Research Guides',
        copy: 'Subject-specific research assistance',
    },
    {
        icon: BookCopy,
        title: 'Citation Tools',
        copy: 'Bibliography and citation management',
    },
    {
        icon: Search,
        title: 'Online Catalog',
        copy: 'Search library holdings and resources',
    },
];

const HOURS = [
    {
        icon: Clock,
        title: 'Regular Hours',
        rows: [
            { label: 'Monday - Thursday', value: '7:00 AM - 10:00 PM' },
            { label: 'Friday', value: '7:00 AM - 8:00 PM' },
        ],
    },
    {
        icon: Clock,
        title: 'Weekend Hours',
        rows: [
            { label: 'Saturday', value: '9:00 AM - 6:00 PM' },
            { label: 'Sunday', value: '12:00 PM - 10:00 PM' },
        ],
    },
    {
        icon: Clock,
        title: 'Extended Hours',
        rows: [
            { label: 'Finals Week', value: '24/7 Access' },
            { label: 'Study Areas', value: 'Open 24 Hours' },
        ],
    },
    {
        icon: Wifi,
        title: 'Digital Access',
        rows: [
            { label: 'Online Resources', value: '24/7 Remote Access' },
            { label: 'Student Portal', value: 'Always Available' },
        ],
    },
];

export default function Library() {
    return (
        <>
            <Head title="EVIMS — Library Services" />

            <ServiceHero
                current="library"
                eyebrow="Student Services"
                title="Library Services"
                intro="Your gateway to knowledge — books, digital resources, and learning spaces that support your academic journey and a lifelong love of reading."
                stats={STATS}
            />

            <PageSection
                tone="white"
                title="Our Library Services"
                description="Services and resources designed to support learning, research, and reading for pleasure."
            >
                <FeatureCards items={SERVICES} />
            </PageSection>

            <PageSection
                title="Meet Our Library Team"
                description="Librarians and information specialists committed to helping every student find what they need."
            >
                <TeamCards members={TEAM} />
            </PageSection>

            <PageSection
                tone="white"
                title="Digital Resources & Collections"
                description="Digital resources and special collections for research and learning."
            >
                <IconCards
                    items={DIGITAL_COLLECTIONS}
                    variant="dark"
                    columns={4}
                />
            </PageSection>

            <PageSection
                title="Library Hours & Access"
                description="When you can visit, and how to reach our resources online."
            >
                <HoursCards items={HOURS} />
            </PageSection>

            <PageSection
                tone="white"
                title="Library Events & Programs"
                description="Workshops, reading programs, and cultural events are posted with the school's events."
            >
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1F2A24]/15 px-6 py-14 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                        <CalendarOff
                            className="h-6 w-6 text-[#2F6F4E]"
                            aria-hidden="true"
                        />
                    </span>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                        No library events right now
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-[#1F2A24]/70">
                        Check the school's Events page for workshops, seminars,
                        and library programs.
                    </p>
                    <Link
                        href="/events"
                        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                    >
                        See school events
                    </Link>
                </div>
            </PageSection>

            <ServiceCta
                current="library"
                title="Discover a love of reading"
                copy="Our library supports every learner, from first picture books to research projects."
            />
        </>
    );
}
