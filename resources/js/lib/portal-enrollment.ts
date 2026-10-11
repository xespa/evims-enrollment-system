import type {
    PortalDocumentType,
    PortalEnrollment,
    PortalOfficeVerification,
    SessionTimePreference,
} from '@/types/portal';

export const SESSION_LABELS: Record<SessionTimePreference, string> = {
    MORNING_SESSION: 'Morning Session',
    AFTERNOON_SESSION: 'Afternoon Session',
    SCHOOL_SERVICE: 'School Service',
};

/** Mirrors App\Models\OfficeVerification::DOCUMENT_COLUMNS. */
export const DOCUMENTS: {
    type: PortalDocumentType;
    label: string;
    verifiedKey: keyof PortalOfficeVerification;
    pathKey: keyof PortalOfficeVerification;
}[] = [
    {
        type: 'form_138',
        label: 'Form 138 (Report Card)',
        verifiedKey: 'has_form_138',
        pathKey: 'form_138_path',
    },
    {
        type: 'birth_certificate',
        label: 'PSA Birth Certificate',
        verifiedKey: 'has_birth_certificate',
        pathKey: 'birth_certificate_path',
    },
    {
        type: 'good_moral',
        label: 'Good Moral Certificate',
        verifiedKey: 'has_good_moral_certificate',
        pathKey: 'good_moral_path',
    },
];

/** Upload limits, matching the server-side validation rules. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type DocumentState =
    'verified' | 'pending' | 'missing' | 'school-provided';

export function studentName(enrollment: PortalEnrollment): string {
    return `${enrollment.student.first_name} ${enrollment.student.last_name}`;
}

export function documentState(
    enrollment: PortalEnrollment,
    type: PortalDocumentType,
): { state: DocumentState; path: string | null } {
    const doc = DOCUMENTS.find((candidate) => candidate.type === type)!;
    const verification = enrollment.office_verification;
    const path = (verification?.[doc.pathKey] as string | null) ?? null;

    if (verification?.[doc.verifiedKey]) {
        return { state: 'verified', path };
    }

    if (path) {
        return { state: 'pending', path };
    }

    // The registrar attaches a returning student's latest report card.
    if (enrollment.is_returning && type === 'form_138') {
        return { state: 'school-provided', path };
    }

    return { state: 'missing', path };
}

/** Whether the parent can still upload or replace documents. */
export function canUploadDocuments(enrollment: PortalEnrollment): boolean {
    return (
        !enrollment.cancelled_at && enrollment.enrollment_status !== 'APPROVED'
    );
}

/** Documents the parent still has to upload for an editable application. */
export function missingDocuments(enrollment: PortalEnrollment) {
    if (!canUploadDocuments(enrollment)) {
        return [];
    }

    return DOCUMENTS.filter(
        (doc) => documentState(enrollment, doc.type).state === 'missing',
    );
}

export function hasOutstandingBalance(enrollment: PortalEnrollment): boolean {
    return (
        !enrollment.cancelled_at &&
        enrollment.enrollment_status === 'APPROVED' &&
        enrollment.remaining_balance !== null &&
        enrollment.remaining_balance > 0
    );
}

export function formatFileSize(bytes: number): string {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
}
