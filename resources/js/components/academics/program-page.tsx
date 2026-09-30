import {
    ClosingCta,
    PageHero,
    PageSection,
    PageSwitcher,
} from '@/components/site/page-sections';
import type { Stat } from '@/components/site/page-sections';

/*
 * The Academics pages' own pieces: the four programs and the hero and
 * closing sections that link between them. Everything else is shared with
 * the rest of the site's content pages.
 */

export {
    DaySchedule,
    FeatureCards,
    Highlights,
    IconCards,
    Testimonials,
} from '@/components/site/page-sections';

export const PROGRAMS = [
    {
        key: 'pre-elementary',
        title: 'Pre-Elementary',
        subtitle: 'Nursery – Pre-K 2',
        href: '/academics/pre-elementary',
    },
    {
        key: 'lower-elementary',
        title: 'Lower Elementary',
        subtitle: 'Grades 1–3',
        href: '/academics/lower-elementary',
    },
    {
        key: 'upper-elementary',
        title: 'Upper Elementary',
        subtitle: 'Grades 4–6',
        href: '/academics/upper-elementary',
    },
    {
        key: 'high-school',
        title: 'High School',
        subtitle: 'Grades 7–10',
        href: '/academics/high-school',
    },
] as const;

export type ProgramKey = (typeof PROGRAMS)[number]['key'];

export const ProgramSection = PageSection;

export function ProgramHero({
    current,
    ...props
}: {
    current: ProgramKey;
    eyebrow: string;
    title: string;
    intro: string;
    stats: Stat[];
}) {
    return (
        <PageHero
            {...props}
            section="Academics"
            nav={
                <PageSwitcher
                    label="Academic programs"
                    pages={PROGRAMS}
                    current={current}
                />
            }
        />
    );
}

export function ProgramCta({
    current,
    title,
    copy,
}: {
    current: ProgramKey;
    title: string;
    copy: string;
}) {
    return (
        <ClosingCta
            title={title}
            copy={copy}
            pages={PROGRAMS}
            current={current}
            siblingNoun="program"
        />
    );
}
