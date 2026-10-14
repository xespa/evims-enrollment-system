import type { TransactionStatus } from '@/lib/transactions';
import type { DocumentAppointmentData } from '@/lib/document-appointment';

export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SessionTimePreference =
    'MORNING_SESSION' | 'AFTERNOON_SESSION' | 'SCHOOL_SERVICE';

export type PortalDocumentType =
    'form_138' | 'birth_certificate' | 'good_moral';

/** An App\Enums\PaymentMethod value, stored as the bill's payment_channel. */
export type PaymentChannel =
    'COUNTER' | 'GCASH' | 'MAYA' | 'SEABANK' | 'PAYPAL';

/** One option in the Pay Tuition chooser, from PaymentMethod::options(). */
export type PortalPaymentMethod = {
    value: PaymentChannel;
    label: string;
    description: string;
    logo: string | null;
    available: boolean;
};

export type PortalPayment = {
    id: number;
    amount: string;
    method: 'GCASH' | 'CASH';
    receipt_number: string | null;
    status: TransactionStatus;
    paid_at: string | null;
    created_at: string;
};

export type PortalInstallment = {
    id: number;
    installment_number: number;
    amount_due: string;
    due_date: string;
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
    payments: PortalPayment[];
};

export type PortalOfficeVerification = {
    has_form_138: boolean;
    has_birth_certificate: boolean;
    has_good_moral_certificate: boolean;
    form_138_path: string | null;
    birth_certificate_path: string | null;
    good_moral_path: string | null;
};

export type RejectionDetail = {
    label: string;
    guidance: string;
};

/** One application as the portal dashboard receives it. */
export type PortalEnrollment = {
    id: number;
    school_year: string;
    enrollment_status: EnrollmentStatus;
    session_time_preference: SessionTimePreference;
    cancelled_at: string | null;
    created_at: string;
    rejection_note: string | null;
    rejection_details: RejectionDetail[];
    is_returning: boolean;
    payment_url: string | null;
    total_billed: number | null;
    remaining_balance: number | null;
    student: {
        first_name: string;
        last_name: string;
        lrn: string | null;
    };
    grade_level: {
        name: string;
    };
    billing_contract: {
        payment_channel: PaymentChannel;
        installments: PortalInstallment[];
    } | null;
    office_verification: PortalOfficeVerification | null;
    document_appointment: DocumentAppointmentData | null;
};
