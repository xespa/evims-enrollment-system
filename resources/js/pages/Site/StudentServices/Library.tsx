import { Head } from '@inertiajs/react';
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
    Mail,
    Monitor,
    Phone,
    ScrollText,
    Search,
    UserRound,
    UsersRound,
    Video,
    Wifi,
} from 'lucide-react';

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

            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Student Services
                    </span>

                    <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
                        Library Services
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#1F2A24]/70 sm:text-lg">
                        Your gateway to knowledge and learning resources.
                        Discover our extensive collection of books, digital
                        resources, research databases, and collaborative
                        learning spaces designed to support your academic
                        journey and foster lifelong learning
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
                        Our Library Services
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Comprehensive library services and resources designed to
                        support research, learning, and academic excellence for
                        students, faculty, and staff
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {SERVICES.map((service) => (
                            <div
                                key={service.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                    <service.icon className="h-5 w-5 text-[#2F6F4E]" />
                                </span>
                                <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                    {service.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                    {service.copy}
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {service.features.map((feature) => (
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
                    Meet Our Library Team
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Dedicated librarians and information specialists committed
                    to supporting your academic success and research endeavors
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {TEAM.map((member) => (
                        <div
                            key={member.name}
                            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-6"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                                <UserRound className="h-6 w-6 text-[#2F6F4E]" />
                            </span>
                            <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                                {member.name}
                            </h3>
                            <p className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                {member.role}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[#1F2A24]/70">
                                {member.bio}
                            </p>
                            <div className="mt-4 flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2F6F4E]">
                                    <Mail className="h-4 w-4" /> Email
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2F6F4E]">
                                    <Phone className="h-4 w-4" /> Call
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Digital Resources & Collections
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Comprehensive digital resources and specialized
                        collections providing access to scholarly content,
                        research materials, and learning tools
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {DIGITAL_COLLECTIONS.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-[#1F2A24]/10 p-6"
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
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                    Library Hours & Access
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                    Our library is open throughout the week with extended hours
                    during finals week. Digital resources are available 24/7 for
                    remote access.
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {HOURS.map((group) => (
                        <div
                            key={group.title}
                            className="rounded-2xl bg-[#1F2A24] p-6 text-[#FBF8F2]"
                        >
                            <group.icon className="h-5 w-5 text-[#E8A33D]" />
                            <h3 className="mt-3 font-serif text-lg font-semibold">
                                {group.title}
                            </h3>
                            <dl className="mt-3 space-y-2">
                                {group.rows.map((row) => (
                                    <div key={row.label}>
                                        <dt className="text-xs text-[#FBF8F2]/60">
                                            {row.label}
                                        </dt>
                                        <dd className="text-sm text-[#FBF8F2]/90">
                                            {row.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#1F2A24]/10 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-16">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[#2F6F4E] uppercase">
                        Library Events & Programs
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#1F2A24]">
                        Join our educational workshops, cultural events, and
                        learning programs designed to enhance your academic
                        experience and research skills
                    </h2>

                    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1F2A24]/15 py-16 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10">
                            <CalendarOff className="h-6 w-6 text-[#2F6F4E]" />
                        </span>
                        <h3 className="mt-4 font-serif text-lg font-semibold text-[#1F2A24]">
                            No Upcoming Events
                        </h3>
                        <p className="mt-2 max-w-md text-sm text-[#1F2A24]/70">
                            Check back soon for new workshops, seminars, and
                            library programs!
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
