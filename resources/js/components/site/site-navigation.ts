import { home } from '@/routes';
import { create as admission } from '@/routes/admission';
import { about, contact, events } from '@/routes/site';
import {
    highSchool,
    lowerElementary,
    preElementary,
    upperElementary,
} from '@/routes/site/academics';
import {
    guidanceCounseling,
    healthServices,
    library,
} from '@/routes/site/student-services';

export type NavLink = {
    label: string;
    href: string;
    /** One line shown under the label in dropdown menus. */
    description?: string;
};

export type NavGroup = {
    label: string;
    /** Every child URL starts with this, so the group shows as active. */
    matchPrefix: string;
    children: NavLink[];
};

export type NavItem = NavLink | NavGroup;

export const isNavGroup = (item: NavItem): item is NavGroup =>
    'children' in item;

export const ACADEMICS: NavGroup = {
    label: 'Academics',
    matchPrefix: '/academics',
    children: [
        {
            label: 'Pre-Elementary',
            href: preElementary().url,
            description: 'Nursery to Pre-K 2',
        },
        {
            label: 'Lower Elementary',
            href: lowerElementary().url,
            description: 'Kindergarten to Grade 3',
        },
        {
            label: 'Upper Elementary',
            href: upperElementary().url,
            description: 'Grades 4 to 6',
        },
        {
            label: 'High School',
            href: highSchool().url,
            description: 'Grades 7 to 10',
        },
    ],
};

export const STUDENT_SERVICES: NavGroup = {
    label: 'Student Services',
    matchPrefix: '/student-services',
    children: [
        {
            label: 'Guidance & Counseling',
            href: guidanceCounseling().url,
            description: 'Support for every learner',
        },
        {
            label: 'Health Services',
            href: healthServices().url,
            description: 'Clinic and wellness care',
        },
        {
            label: 'Library',
            href: library().url,
            description: 'Books, research and quiet study',
        },
    ],
};

export const NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: home().url },
    { label: 'About Us', href: about().url },
    ACADEMICS,
    { label: 'Admission', href: admission().url },
    STUDENT_SERVICES,
    { label: 'Events', href: events().url },
    { label: 'Contact Us', href: contact().url },
];

/** Whether the current page belongs to this nav item. */
export function isActiveItem(item: NavItem, currentUrl: string): boolean {
    const path = currentUrl.split('?')[0];
    const target = isNavGroup(item)
        ? item.matchPrefix
        : new URL(item.href, 'http://x').pathname;

    return target === '/' ? path === '/' : path.startsWith(target);
}
