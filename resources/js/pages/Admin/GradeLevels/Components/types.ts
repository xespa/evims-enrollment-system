export type Subject = {
    id: number;
    name: string;
    code: string | null;
    enrollments_count: number;
};

/** One of a grade level's classes for one school year; mirrors Section. */
export type Section = {
    id: number;
    name: string;
    slots: number;
    /** Students placed in it and holding a slot; it can't shrink below this. */
    students_count: number;
};

/** One grade level's fees and subjects for one school year. */
export type Curriculum = {
    id: number;
    school_year: string;
    registration_fee: string;
    miscellaneous_fee: string;
    books_fee: string;
    monthly_tuition: string;
    monthly_laboratory_fee: string;
    tuition_fee: string;
    /** Applications already made for this grade level and year. */
    enrollments_count: number;
    subjects: Subject[];
    /** A first; none means there's no limit on applications. */
    sections: Section[];
    /** Pending or approved applications, each holding one slot. */
    slots_taken: number;
};

/** Every section's slots together, or null when there's no limit. */
export function totalSlots(curriculum: Curriculum): number | null {
    return curriculum.sections.length === 0
        ? null
        : curriculum.sections.reduce((total, s) => total + s.slots, 0);
}

export type GradeLevel = {
    id: number;
    name: string;
    level_order: number;
    /** Null when the grade level isn't offered in the selected school year. */
    curriculum: Curriculum | null;
};

/** When applications for a school year open and close (Y-m-d, inclusive). */
export type EnrollmentPeriod = {
    opens_on: string;
    closes_on: string;
};

/** Mirrors EnrollmentPeriod::REMINDER_DAYS_AHEAD. */
export const REMINDER_DAYS_AHEAD = 3;

export type FeeName =
    | 'registration_fee'
    | 'miscellaneous_fee'
    | 'books_fee'
    | 'monthly_tuition'
    | 'monthly_laboratory_fee';

export const ONE_TIME_FEES: { name: FeeName; label: string }[] = [
    { name: 'registration_fee', label: 'Registration' },
    { name: 'miscellaneous_fee', label: 'Miscellaneous' },
    { name: 'books_fee', label: 'Books' },
];

export const MONTHLY_FEES: { name: FeeName; label: string }[] = [
    { name: 'monthly_tuition', label: 'Tuition' },
    { name: 'monthly_laboratory_fee', label: 'Laboratory' },
];

export const INPUT_CLASS =
    'min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B]';
