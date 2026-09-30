export type Subject = {
    id: number;
    name: string;
    code: string | null;
    enrollments_count: number;
};

export type GradeLevel = {
    id: number;
    name: string;
    level_order: number;
    registration_fee: string;
    miscellaneous_fee: string;
    books_fee: string;
    monthly_tuition: string;
    monthly_laboratory_fee: string;
    tuition_fee: string;
    subjects: Subject[];
};

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
