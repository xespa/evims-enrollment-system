import {
    ClosingCta,
    PageHero,
    PageSwitcher,
} from '@/components/site/page-sections';
import type { Stat } from '@/components/site/page-sections';

/*
 * The Student Services pages' own pieces: the three services and the hero
 * and closing sections that link between them. Everything else comes from
 * the shared site page sections.
 */

export const SERVICES = [
    {
        key: 'guidance-counseling',
        title: 'Guidance & Counseling',
        subtitle: 'Academic & personal support',
        href: '/student-services/guidance-counseling',
    },
    {
        key: 'health-services',
        title: 'Health Services',
        subtitle: 'Clinic & wellness',
        href: '/student-services/health-services',
    },
    {
        key: 'library',
        title: 'Library',
        subtitle: 'Books & learning spaces',
        href: '/student-services/library',
    },
] as const;

export type ServiceKey = (typeof SERVICES)[number]['key'];

/** The school's real main line and email, used across the services pages. */
export const SCHOOL_PHONE = '0936 084 2412';
export const SCHOOL_PHONE_LINK = 'tel:+639360842412';
export const SCHOOL_EMAIL = 'evimstech2020@gmail.com';

export function ServiceHero({
    current,
    ...props
}: {
    current: ServiceKey;
    eyebrow: string;
    title: string;
    intro: string;
    stats: Stat[];
}) {
    return (
        <PageHero
            {...props}
            section="Student Services"
            primaryAction={{ label: 'Contact the Office', href: '/contact' }}
            secondaryAction={{ label: 'Enroll Now', href: '/admission' }}
            nav={
                <PageSwitcher
                    label="Student services"
                    pages={SERVICES}
                    current={current}
                />
            }
        />
    );
}

export function ServiceCta({
    current,
    title,
    copy,
}: {
    current: ServiceKey;
    title: string;
    copy: string;
}) {
    return (
        <ClosingCta
            title={title}
            copy={copy}
            pages={SERVICES}
            current={current}
            siblingNoun="service"
        />
    );
}
