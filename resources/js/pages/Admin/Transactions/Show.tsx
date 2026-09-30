import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    MethodLabel,
    STATUS_LABELS,
    STATUS_STYLES,
    formatCurrency,
    formatDateTime,
    referenceId,
} from '@/lib/transactions';
import type { TransactionStatus } from '@/lib/transactions';

type Props = {
    payment: {
        id: number;
        enrollment_id: number;
        amount: string;
        method: 'GCASH' | 'CASH';
        receipt_number: string | null;
        status: TransactionStatus;
        paymongo_source_id: string | null;
        paymongo_payment_intent_id: string | null;
        paid_at: string | null;
        created_at: string;
        updated_at: string;
        recorded_by: { id: number; name: string } | null;
        voided_at: string | null;
        voided_by: { id: number; name: string } | null;
        void_reason: string | null;
        enrollment: {
            id: number;
            email: string | null;
            school_year: string;
            student: {
                first_name: string;
                last_name: string;
                lrn: string | null;
            };
            grade_level: { name: string } | null;
        };
        installment: {
            installment_number: number;
            amount_due: string;
            due_date: string;
            status: string;
        };
    };
};

type TimelineEvent = {
    label: string;
    at: string | null;
    tone: 'done' | 'waiting' | 'failed';
};

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-[#1F2A24]/10 bg-white">
            <h2 className="border-b border-[#1F2A24]/10 px-5 py-3 text-sm font-semibold text-[#1F2A24]">
                {title}
            </h2>
            <dl className="divide-y divide-[#1F2A24]/5 px-5">{children}</dl>
        </section>
    );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm text-[#1F2A24]/60">{label}</dt>
            <dd className="text-sm break-all text-[#1F2A24] sm:col-span-2">
                {children}
            </dd>
        </div>
    );
}

function timelineFor(payment: Props['payment']): TimelineEvent[] {
    if (payment.method === 'CASH') {
        const events: TimelineEvent[] = [
            {
                label: payment.recorded_by
                    ? `Counter payment recorded by ${payment.recorded_by.name}`
                    : 'Counter payment recorded',
                at: payment.paid_at ?? payment.created_at,
                tone: 'done',
            },
        ];

        if (payment.status === 'VOIDED') {
            events.push({
                label: `Voided${payment.voided_by ? ` by ${payment.voided_by.name}` : ''}${payment.void_reason ? `: ${payment.void_reason}` : ''}`,
                at: payment.voided_at,
                tone: 'failed',
            });
        }

        return events;
    }

    const events: TimelineEvent[] = [
        {
            label: 'GCash checkout started',
            at: payment.created_at,
            tone: 'done',
        },
    ];

    if (payment.status === 'COMPLETED') {
        events.push({
            label: 'Payment received',
            at: payment.paid_at,
            tone: 'done',
        });
    } else if (payment.status === 'FAILED') {
        events.push({
            label: 'Payment failed, expired or was cancelled',
            at: payment.updated_at,
            tone: 'failed',
        });
    } else {
        events.push({
            label: 'Waiting for the payer to finish in GCash',
            at: null,
            tone: 'waiting',
        });
    }

    return events;
}

const TIMELINE_ICONS = {
    done: (
        <CheckCircle2 className="h-5 w-5 text-[#2F6F4E]" aria-hidden="true" />
    ),
    waiting: (
        <CircleDashed className="h-5 w-5 text-[#a4670f]" aria-hidden="true" />
    ),
    failed: <XCircle className="h-5 w-5 text-[#A83A30]" aria-hidden="true" />,
};

export default function Show({ payment }: Props) {
    const { enrollment, installment } = payment;
    const student = enrollment.student;

    return (
        <>
            <Head title={`Transaction ${referenceId(payment)}`} />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-4xl">
                    <Link
                        href={route('admin.transactions.index')}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#2F6F4E] hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to transactions
                    </Link>

                    {/* Header */}
                    <div className="mb-6 rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                        <p className="text-xs font-semibold tracking-wide text-[#1F2A24]/50 uppercase">
                            Payment
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                            <h1 className="font-serif text-3xl font-semibold text-[#1F2A24] tabular-nums">
                                {formatCurrency(payment.amount)}
                            </h1>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[payment.status]}`}
                            >
                                {STATUS_LABELS[payment.status]}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-[#1F2A24]/70">
                            {student.last_name}, {student.first_name} ·
                            Installment #{installment.installment_number} · S.Y.{' '}
                            {enrollment.school_year}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#1F2A24]/55">
                            {referenceId(payment)}
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-2">
                            <Section title="Payment details">
                                <Row label="Amount">
                                    <span className="tabular-nums">
                                        {formatCurrency(payment.amount)}
                                    </span>
                                </Row>
                                <Row label="Status">
                                    {STATUS_LABELS[payment.status]}
                                </Row>
                                <Row label="Method">
                                    <MethodLabel method={payment.method} />
                                </Row>
                                {payment.method === 'GCASH' && (
                                    <>
                                        <Row label="PayMongo payment ID">
                                            <span className="font-mono text-xs">
                                                {payment.paymongo_payment_intent_id ??
                                                    '—'}
                                            </span>
                                        </Row>
                                        <Row label="PayMongo source ID">
                                            <span className="font-mono text-xs">
                                                {payment.paymongo_source_id ??
                                                    '—'}
                                            </span>
                                        </Row>
                                    </>
                                )}
                                {payment.method === 'CASH' && (
                                    <>
                                        <Row label="OR / receipt no.">
                                            {payment.receipt_number ?? '—'}
                                        </Row>
                                        <Row label="Recorded by">
                                            {payment.recorded_by?.name ?? '—'}
                                        </Row>
                                    </>
                                )}
                                <Row label="Created">
                                    {formatDateTime(payment.created_at)}
                                </Row>
                                <Row label="Paid on">
                                    {payment.paid_at
                                        ? formatDateTime(payment.paid_at)
                                        : '—'}
                                </Row>
                                <Row label="Transaction no.">
                                    <span className="tabular-nums">
                                        #{payment.id}
                                    </span>
                                </Row>
                            </Section>

                            <Section title="Installment">
                                <Row label="Installment">
                                    #{installment.installment_number}
                                </Row>
                                <Row label="Amount due">
                                    <span className="tabular-nums">
                                        {formatCurrency(installment.amount_due)}
                                    </span>
                                </Row>
                                <Row label="Due date">
                                    {new Date(
                                        installment.due_date,
                                    ).toLocaleDateString('en-PH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </Row>
                                <Row label="Installment status">
                                    {installment.status === 'PAID'
                                        ? 'Fully paid'
                                        : 'Not yet fully paid'}
                                </Row>
                            </Section>
                        </div>

                        <div className="space-y-4">
                            <Section title="Student">
                                <Row label="Name">
                                    {student.last_name}, {student.first_name}
                                </Row>
                                <Row label="LRN">{student.lrn ?? '—'}</Row>
                                <Row label="Grade">
                                    {enrollment.grade_level?.name ?? '—'}
                                </Row>
                                <Row label="Email">
                                    {enrollment.email ?? '—'}
                                </Row>
                                <div className="py-3">
                                    <Link
                                        href={route(
                                            'admin.enrollments.show',
                                            enrollment.id,
                                        )}
                                        className="text-sm font-medium text-[#2F6F4E] hover:underline"
                                    >
                                        View application #{enrollment.id}
                                    </Link>
                                </div>
                            </Section>

                            <section className="rounded-2xl border border-[#1F2A24]/10 bg-white">
                                <h2 className="border-b border-[#1F2A24]/10 px-5 py-3 text-sm font-semibold text-[#1F2A24]">
                                    Timeline
                                </h2>
                                <ol className="space-y-4 px-5 py-4">
                                    {timelineFor(payment).map((event) => (
                                        <li
                                            key={event.label}
                                            className="flex gap-3"
                                        >
                                            {TIMELINE_ICONS[event.tone]}
                                            <div>
                                                <p className="text-sm text-[#1F2A24]">
                                                    {event.label}
                                                </p>
                                                {event.at && (
                                                    <p className="text-xs text-[#1F2A24]/55">
                                                        {formatDateTime(
                                                            event.at,
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
