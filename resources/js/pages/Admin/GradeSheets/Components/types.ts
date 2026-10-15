/** A grade sheet's details; mirrors GradeSheet::summary(). */
export type GradeSheetSummary = {
    id: number;
    number: string;
    subject: string;
    grade_level: string;
    school_year: string;
    teacher: string;
};

/** One student's row on a grade sheet; mirrors StudentGrade::row(). */
export type StudentGradeRow = {
    id: number;
    enrollment_id: number;
    student_name: string;
    lrn: string | null;
    term_1: string | null;
    term_2: string | null;
    term_3: string | null;
    final_grade: number | null;
    remarks: 'Passed' | 'Failed' | null;
};

export const TERMS = [
    { key: 'term_1', label: 'Term 1' },
    { key: 'term_2', label: 'Term 2' },
    { key: 'term_3', label: 'Term 3' },
] as const;

export type TermKey = (typeof TERMS)[number]['key'];

/** Mirrors StudentGrade::PASSING_GRADE. */
export const PASSING_GRADE = 75;

export const SELECT_CLASS =
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-base text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] disabled:bg-[#1F2A24]/5 disabled:text-[#1F2A24]/60 sm:text-sm';

/** The final grade with two decimals, or a dash until all terms are in. */
export function formatGrade(grade: string | number | null): string {
    return grade === null || grade === '' ? '—' : Number(grade).toFixed(2);
}
