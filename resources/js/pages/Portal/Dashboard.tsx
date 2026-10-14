import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Clock,
    FolderOpen,
    Wallet,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import DocumentViewerDialog, {
    isPdfPath,
} from '@/components/document-viewer-dialog';
import ApplicationCard from '@/components/portal/application-card';
import DocumentChecklist from '@/components/portal/document-checklist';
import NextStepCard from '@/components/portal/next-step-card';
import type { DashboardTab } from '@/components/portal/next-step-card';
import PaymentHistory, {
    paymentRows,
} from '@/components/portal/payment-history';
import ProfileHeader from '@/components/portal/profile-header';
import { useConfirm } from '@/hooks/use-confirm';
import {
    MAX_DOCUMENT_BYTES,
    MAX_PHOTO_BYTES,
    formatFileSize,
    hasOutstandingBalance,
    missingDocuments,
    studentName,
} from '@/lib/portal-enrollment';
import { formatCurrency } from '@/lib/transactions';
import { cn } from '@/lib/utils';
import { create as admissionCreate } from '@/routes/admission';
import { logout } from '@/routes/portal';
import { cancel as cancelEnrollment } from '@/routes/portal/enrollments';
import { store as storeDocument } from '@/routes/portal/enrollments/documents';
import { update as updatePhoto } from '@/routes/portal/profile/photo';
import type {
    PortalDocumentType,
    PortalEnrollment,
    PortalPaymentMethod,
} from '@/types/portal';

const TABS: DashboardTab[] = ['Applications', 'Payments', 'Documents'];

const ALLOWED_DOCUMENT_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;

function Metric({
    icon: Icon,
    label,
    value,
    emphasis = false,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    emphasis?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-[#1F2A24]/10 bg-white p-4 shadow-sm">
            <span
                aria-hidden="true"
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    emphasis
                        ? 'bg-[#C6473B]/10 text-[#A83A30]'
                        : 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
                )}
            >
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p
                    className={cn(
                        'truncate text-lg font-semibold tabular-nums',
                        emphasis ? 'text-[#A83A30]' : 'text-[#1F2A24]',
                    )}
                >
                    {value}
                </p>
                <p className="text-xs text-[#1F2A24]/65">{label}</p>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#1F2A24]/20 bg-white px-6 py-10 text-center">
            <FolderOpen
                className="h-8 w-8 text-[#1F2A24]/30"
                aria-hidden="true"
            />
            <p className="text-sm text-[#1F2A24]/65">{message}</p>
            <Link
                href={admissionCreate().url}
                className="inline-flex min-h-11 items-center rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
            >
                Start an application
            </Link>
        </div>
    );
}

export default function Dashboard({
    enrollments,
    paymentMethods,
}: {
    enrollments: PortalEnrollment[];
    paymentMethods: PortalPaymentMethod[];
}) {
    const { props } = usePage();
    const enrollee = props.auth.enrollee;
    const serverErrors = Object.values(props.errors ?? {});
    const [activeTab, setActiveTab] = useState<DashboardTab>('Applications');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [uploadingDocumentKey, setUploadingDocumentKey] = useState<
        string | null
    >(null);
    const [clientError, setClientError] = useState<string | null>(null);
    // Kept apart from `isViewingDocument` so the viewer doesn't blank out while closing.
    const [viewingDocument, setViewingDocument] = useState<{
        title: string;
        path: string;
    } | null>(null);
    const [isViewingDocument, setIsViewingDocument] = useState(false);
    const [confirm, confirmDialog] = useConfirm();

    const activeEnrollments = enrollments.filter(
        (enrollment) => !enrollment.cancelled_at,
    );
    const approvedCount = activeEnrollments.filter(
        (enrollment) => enrollment.enrollment_status === 'APPROVED',
    ).length;
    const underReviewCount = activeEnrollments.filter(
        (enrollment) => enrollment.enrollment_status === 'PENDING',
    ).length;
    const outstandingBalance = activeEnrollments
        .filter(hasOutstandingBalance)
        .reduce(
            (sum, enrollment) => sum + (enrollment.remaining_balance ?? 0),
            0,
        );
    const missingDocumentCount = enrollments.reduce(
        (sum, enrollment) => sum + missingDocuments(enrollment).length,
        0,
    );
    const payments = paymentRows(enrollments);

    const tabCounts: Record<DashboardTab, number> = {
        Applications: activeEnrollments.length,
        Payments: payments.length,
        Documents: missingDocumentCount,
    };

    const openTab = (tab: DashboardTab) => {
        setActiveTab(tab);
        document
            .getElementById('portal-tabs')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById(`portal-tab-${tab}`)?.focus({
            preventScroll: true,
        });
    };

    const cancel = async (enrollment: PortalEnrollment) => {
        const confirmed = await confirm({
            title: 'Cancel this application?',
            description: `The application for ${studentName(enrollment)} (${enrollment.grade_level.name}, SY ${enrollment.school_year}) will be withdrawn. You can submit a new one later.`,
            confirmLabel: 'Cancel Application',
            cancelLabel: 'Keep Application',
            destructive: true,
        });

        if (!confirmed) {
            return;
        }

        router.post(
            cancelEnrollment.url(enrollment.id),
            {},
            { preserveScroll: true },
        );
    };

    const uploadPhoto = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setClientError('Please choose an image file for your photo.');

            return;
        }

        if (file.size > MAX_PHOTO_BYTES) {
            setClientError(
                `That photo is too large. Please choose one under ${formatFileSize(MAX_PHOTO_BYTES)}.`,
            );

            return;
        }

        setClientError(null);
        setIsUploadingPhoto(true);
        router.post(
            updatePhoto.url(),
            { photo: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setIsUploadingPhoto(false),
            },
        );
    };

    const uploadDocument = (
        enrollment: PortalEnrollment,
        type: PortalDocumentType,
        file: File,
    ) => {
        if (!ALLOWED_DOCUMENT_EXTENSIONS.test(file.name)) {
            setClientError('Documents must be a PDF, JPG or PNG file.');

            return;
        }

        if (file.size > MAX_DOCUMENT_BYTES) {
            setClientError(
                `That file is too large. Please upload one under ${formatFileSize(MAX_DOCUMENT_BYTES)}.`,
            );

            return;
        }

        setClientError(null);
        setUploadingDocumentKey(`${enrollment.id}:${type}`);
        router.post(
            storeDocument.url({ enrollment: enrollment.id, type }),
            { file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploadingDocumentKey(null),
            },
        );
    };

    const viewDocument = (title: string, path: string) => {
        setViewingDocument({ title, path });
        setIsViewingDocument(true);
    };

    const handleTabKeyDown = (event: ReactKeyboardEvent) => {
        const offsets: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
        };

        if (!(event.key in offsets)) {
            return;
        }

        event.preventDefault();
        const nextTab =
            TABS[
                (TABS.indexOf(activeTab) + offsets[event.key] + TABS.length) %
                    TABS.length
            ];
        setActiveTab(nextTab);
        document.getElementById(`portal-tab-${nextTab}`)?.focus();
    };

    const errorMessages = clientError ? [clientError] : serverErrors;

    return (
        <div className="mx-auto max-w-5xl px-4 pb-16">
            <Head title="My Profile" />
            {confirmDialog}
            {viewingDocument && (
                <DocumentViewerDialog
                    title={viewingDocument.title}
                    url={`/storage/${viewingDocument.path}`}
                    isPdf={isPdfPath(viewingDocument.path)}
                    open={isViewingDocument}
                    onOpenChange={setIsViewingDocument}
                />
            )}

            <ProfileHeader
                enrollee={enrollee}
                isUploadingPhoto={isUploadingPhoto}
                onPhotoSelected={uploadPhoto}
                onLogout={() => router.post(logout.url())}
            />

            <div className="mt-6 space-y-3">
                {props.flash?.success && errorMessages.length === 0 && (
                    <div
                        role="status"
                        className="flex items-start gap-2 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                    >
                        <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />
                        {props.flash.success}
                    </div>
                )}

                {errorMessages.length > 0 && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#A83A30]"
                    >
                        <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />
                        <ul className="flex-1 space-y-1">
                            {errorMessages.map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                        {clientError && (
                            <button
                                type="button"
                                onClick={() => setClientError(null)}
                                className="-m-1 rounded-full p-1 hover:bg-[#C6473B]/10"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                                <span className="sr-only">Dismiss</span>
                            </button>
                        )}
                    </div>
                )}

                <NextStepCard enrollments={enrollments} onOpenTab={openTab} />
            </div>

            <section aria-label="Account summary" className="mt-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Metric
                        icon={ClipboardList}
                        label="Applications"
                        value={activeEnrollments.length}
                    />
                    <Metric
                        icon={Clock}
                        label="Under review"
                        value={underReviewCount}
                    />
                    <Metric
                        icon={CheckCircle2}
                        label="Approved"
                        value={approvedCount}
                    />
                    <Metric
                        icon={Wallet}
                        label="Outstanding balance"
                        value={formatCurrency(outstandingBalance)}
                        emphasis={outstandingBalance > 0}
                    />
                </div>
            </section>

            <div
                id="portal-tabs"
                className="mt-8 scroll-mt-24 overflow-x-auto border-b border-[#1F2A24]/10"
            >
                <div
                    role="tablist"
                    aria-label="Account sections"
                    className="-mb-px flex gap-6"
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        const count = tabCounts[tab];
                        const needsAttention = tab === 'Documents' && count > 0;

                        return (
                            <button
                                key={tab}
                                id={`portal-tab-${tab}`}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-controls="portal-tabpanel"
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => setActiveTab(tab)}
                                onKeyDown={handleTabKeyDown}
                                className={cn(
                                    'inline-flex min-h-11 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'border-[#2F6F4E] text-[#2F6F4E]'
                                        : 'border-transparent text-[#1F2A24]/65 hover:text-[#1F2A24]/80',
                                )}
                            >
                                {tab}
                                {count > 0 && (
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
                                            needsAttention
                                                ? 'bg-[#E8A33D]/20 text-[#a4670f]'
                                                : 'bg-[#1F2A24]/5 text-[#1F2A24]/65',
                                        )}
                                    >
                                        {count}
                                        <span className="sr-only">
                                            {needsAttention
                                                ? ' documents still needed'
                                                : ''}
                                        </span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                id="portal-tabpanel"
                role="tabpanel"
                aria-labelledby={`portal-tab-${activeTab}`}
                className="mt-6"
            >
                {activeTab === 'Applications' &&
                    (enrollments.length === 0 ? (
                        <EmptyState message="You don't have any applications yet." />
                    ) : (
                        <div className="space-y-4">
                            {enrollments.map((enrollment) => (
                                <ApplicationCard
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    paymentMethods={paymentMethods}
                                    onCancel={cancel}
                                />
                            ))}
                        </div>
                    ))}

                {activeTab === 'Payments' && <PaymentHistory rows={payments} />}

                {activeTab === 'Documents' &&
                    (enrollments.length === 0 ? (
                        <EmptyState message="No applications to show documents for yet." />
                    ) : (
                        <div className="space-y-4">
                            {enrollments.map((enrollment) => (
                                <DocumentChecklist
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    uploadingKey={uploadingDocumentKey}
                                    onUpload={uploadDocument}
                                    onView={viewDocument}
                                />
                            ))}
                        </div>
                    ))}
            </div>
        </div>
    );
}
