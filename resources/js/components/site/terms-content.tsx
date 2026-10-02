import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

export const TERMS_EFFECTIVE_DATE = 'October 2, 2026';

type Section = { title: string; body: ReactNode };

const SECTIONS: Section[] = [
    {
        title: 'About these terms',
        body: (
            <p>
                These terms cover your use of the EVIMS Student Portal and
                online enrollment of Eastern Visayas International Montessori
                School (“the School”, “we”). By creating an account you agree
                to them. If you register on behalf of a child, you confirm
                that you are their parent or legal guardian.
            </p>
        ),
    },
    {
        title: 'Your account',
        body: (
            <ul>
                <li>
                    Give your real name and an email address you can access.
                    We use it to confirm your account and to send application
                    and payment updates.
                </li>
                <li>
                    Keep your password private. You are responsible for what
                    is done through your account; tell us right away if you
                    think someone else has used it.
                </li>
                <li>
                    One person per account. A parent or guardian may enroll
                    several children from one account.
                </li>
                <li>
                    Students registering for themselves should do so with the
                    knowledge of a parent or guardian, who remains responsible
                    for fees.
                </li>
            </ul>
        ),
    },
    {
        title: 'Valid ID and account review',
        body: (
            <ul>
                <li>
                    You must upload a valid ID when you register — a
                    government-issued ID for parents and guardians, or a school
                    or government-issued ID for students.
                </li>
                <li>
                    School staff verify every new account. Until it is
                    approved you cannot submit enrollment applications, use the
                    portal dashboard, or pay online.
                </li>
                <li>
                    We may decline or later revoke an account if its details
                    or ID cannot be verified, and we will tell you why by
                    email.
                </li>
            </ul>
        ),
    },
    {
        title: 'Enrollment applications',
        body: (
            <ul>
                <li>
                    Everything you submit — student details, school records
                    and uploaded documents — must be true, complete and your
                    own to share. False or altered information may lead to the
                    application being rejected or the enrollment being
                    cancelled.
                </li>
                <li>
                    Submitting an application reserves nothing until the
                    School approves it. Approval depends on available slots,
                    the School’s admission requirements, and complete
                    documents (e.g. Form 138, PSA birth certificate, good
                    moral certificate).
                </li>
                <li>
                    You may cancel an application from the portal while it is
                    still pending.
                </li>
            </ul>
        ),
    },
    {
        title: 'Fees and payments',
        body: (
            <ul>
                <li>
                    Fees are those published for the school year and grade
                    level you apply for. The amount on your approved
                    application is the amount you are billed, even if fees
                    change later.
                </li>
                <li>
                    Online payments are made through GCash, processed by our
                    payment provider PayMongo. We never see or store your
                    GCash PIN or account credentials. Counter payments are
                    made at the School cashier, who issues an official
                    receipt.
                </li>
                <li>
                    A payment counts once it is confirmed by the provider or
                    recorded by the cashier. Refunds and adjustments follow
                    the School’s refund policy; ask the registrar for
                    details.
                </li>
            </ul>
        ),
    },
    {
        title: 'Privacy and your personal data',
        body: (
            <>
                <p>
                    We handle personal data in line with the Data Privacy Act
                    of 2012 (Republic Act No. 10173).
                </p>
                <ul>
                    <li>
                        We collect what enrollment needs: your account details
                        and ID; the student’s identity, address, family,
                        school, health and history information; uploaded
                        documents; and payment records.
                    </li>
                    <li>
                        We use it only to verify accounts, process enrollment,
                        bill and receive fees, keep school records, and
                        contact you. We do not sell it.
                    </li>
                    <li>
                        Your ID and documents are visible only to authorized
                        School staff. Payment details are shared with PayMongo
                        only as needed to process a payment, and records may
                        be shared with the Department of Education where the
                        law requires.
                    </li>
                    <li>
                        We keep records for as long as school regulations and
                        the law require, then dispose of them securely.
                    </li>
                    <li>
                        You may ask to access or correct your data, or raise a
                        privacy concern, through the registrar.
                    </li>
                </ul>
            </>
        ),
    },
    {
        title: 'Using the portal properly',
        body: (
            <p>
                Do not try to access another family’s information, upload
                harmful files, or interfere with the portal. We may suspend
                accounts that misuse the service. The portal may occasionally
                be unavailable for maintenance.
            </p>
        ),
    },
    {
        title: 'Changes and contact',
        body: (
            <p>
                We may update these terms; the effective date below will
                change and continued use means you accept the update. For
                questions, visit the School registrar or reach us through the{' '}
                <Link
                    href={route('site.contact')}
                    className="font-medium text-[#2F6F4E] underline-offset-2 hover:underline"
                >
                    Contact Us
                </Link>{' '}
                page.
            </p>
        ),
    },
];

/**
 * The portal's Terms and Conditions, shown on the public Terms page and in
 * the dialog on the register form.
 */
export default function TermsContent() {
    return (
        <div className="space-y-5 text-sm leading-relaxed text-[#1F2A24]/80 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
            {SECTIONS.map((section, index) => (
                <section key={section.title}>
                    <h2 className="mb-1.5 font-serif text-base font-semibold text-[#1F2A24]">
                        {index + 1}. {section.title}
                    </h2>
                    {section.body}
                </section>
            ))}
            <p className="text-xs text-[#1F2A24]/55">
                Effective {TERMS_EFFECTIVE_DATE}.
            </p>
        </div>
    );
}
