import { Form, Head, Link, usePage } from '@inertiajs/react';
import { FileCheck2, Upload } from 'lucide-react';
import { useState } from 'react';
import AcceptedIdsDialog from '@/components/accepted-ids-dialog';
import AccountRoleSelect from '@/components/account-role-select';
import type {
    AccountRoleOption,
    AccountRoleValue,
} from '@/components/account-role-select';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PortalAuthShell from '@/components/portal-auth-shell';
import TermsContent from '@/components/site/terms-content';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { logout as portalLogout } from '@/routes/portal';
import { store as portalRegister } from '@/routes/portal/register';
import { store as staffRegister } from '@/routes/staff-registrations';

type Reapplication = {
    /** Signed URL the form submits to. */
    action: string;
    email: string;
    name: string;
    accountType: AccountRoleValue | null;
    /** The parent or guardian a student account named last time. */
    parentEmail: string | null;
    /** What went wrong with the previous attempt. */
    reasons: { label: string; guidance: string }[];
    note: string | null;
};

type Props = {
    /** Sent here on the way to the admission form. */
    isApplying?: boolean;
    roles: AccountRoleOption[];
    /** Preselected from ?role=, e.g. from the login page. */
    selectedRole?: AccountRoleValue | null;
    /** Set when trying again from the link in a rejection email. */
    reapplication?: Reapplication;
};

const INPUT_CLASS =
    'h-10 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

const LINK_CLASS =
    'font-semibold text-[#2F6F4E] underline-offset-2 hover:text-[#25573E] hover:underline';

/** The ID we ask for depends on who is registering. */
const VALID_ID_HINTS: Partial<Record<AccountRoleValue, string>> = {
    PARENT_GUARDIAN: "Gov't-issued ID · max 10MB",
};

const DEFAULT_VALID_ID_HINT = "School or gov't ID · max 10MB";

function PreviousAttemptNotice({
    reapplication,
}: {
    reapplication: Reapplication;
}) {
    return (
        <div
            role="status"
            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-3 py-2 text-[13px] leading-snug text-[#1F2A24]/85"
        >
            <p className="font-semibold text-[#1F2A24]">
                Your previous attempt wasn't approved:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {reapplication.reasons.map((reason) => (
                    <li key={reason.label} title={reason.guidance}>
                        <span className="font-medium">{reason.label}</span> —{' '}
                        {reason.guidance}
                    </li>
                ))}
            </ul>
            {reapplication.note && (
                <p className="mt-1">
                    <span className="font-medium">Note:</span>{' '}
                    {reapplication.note}
                </p>
            )}
        </div>
    );
}

/**
 * One sign-up page for everyone. Students and parents/guardians create a
 * portal account; staff roles send a request an administrator approves.
 */
export default function Register({
    isApplying = false,
    roles,
    selectedRole = null,
    reapplication,
}: Props) {
    const { props } = usePage<{ auth?: { enrollee?: unknown } }>();
    const isLoggedIn = Boolean(props.auth?.enrollee);
    const [role, setRole] = useState<AccountRoleValue | ''>(
        reapplication?.accountType ?? selectedRole ?? '',
    );
    const [validIdName, setValidIdName] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    const isStaff = Boolean(
        roles.find((option) => option.value === role)?.isStaff,
    );
    const action =
        reapplication?.action ??
        (isStaff ? staffRegister.url() : portalRegister.url());
    const validIdHint = (role && VALID_ID_HINTS[role]) || DEFAULT_VALID_ID_HINT;

    return (
        <>
            <Head title="Create an Account" />

            <PortalAuthShell
                title={
                    reapplication
                        ? 'Create your account again'
                        : 'Create your account'
                }
                description={
                    reapplication
                        ? 'Fix the issue below and upload a clear photo of a valid ID.'
                        : isStaff
                          ? 'An administrator approves staff accounts before you can log in.'
                          : 'Takes about a minute — have a photo of a valid ID ready.'
                }
                highlights={
                    isStaff
                        ? [
                              'For teachers, cashiers, and registrars.',
                              'An administrator reviews your request.',
                              "We'll email you once you can log in.",
                          ]
                        : [
                              'For parents/guardians and students.',
                              'Confirm your email, then the school reviews your account.',
                              'Enroll, upload documents, and pay with GCash online.',
                          ]
                }
                notice={
                    reapplication ? (
                        <PreviousAttemptNotice reapplication={reapplication} />
                    ) : (
                        isApplying &&
                        !isStaff && (
                            <div
                                role="status"
                                className="mb-4 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2 text-[13px] leading-snug text-[#1F2A24]/80"
                            >
                                You need a verified account to enroll. Create
                                one, confirm your email, and once the school
                                approves your account you can submit
                                applications.
                            </div>
                        )
                    )
                }
                footer={
                    reapplication ? (
                        <>
                            Questions? Contact the school registrar.
                            {isLoggedIn && (
                                <>
                                    {' '}
                                    <Link
                                        href={portalLogout()}
                                        method="post"
                                        as="button"
                                        className={LINK_CLASS}
                                    >
                                        Log out
                                    </Link>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <TextLink
                                href={login({ query: role ? { role } : {} })}
                                className={LINK_CLASS}
                            >
                                Log in
                            </TextLink>
                        </>
                    )
                }
            >
                <Form
                    action={action}
                    method="post"
                    resetOnSuccess={['password', 'password_confirmation']}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                                <AccountRoleSelect
                                    roles={roles}
                                    value={role}
                                    onChange={setRole}
                                    label="I am a"
                                    name={isStaff ? 'role' : 'account_type'}
                                    error={errors.account_type ?? errors.role}
                                />

                                <div>
                                    <Label
                                        htmlFor="name"
                                        className={LABEL_CLASS}
                                    >
                                        Full name
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={reapplication?.name}
                                        required
                                        autoComplete="name"
                                        placeholder="Juan Dela Cruz"
                                        aria-invalid={
                                            errors.name ? true : undefined
                                        }
                                        className={INPUT_CLASS}
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <Label
                                        htmlFor="email"
                                        className={LABEL_CLASS}
                                    >
                                        Email address
                                    </Label>
                                    {reapplication ? (
                                        // The account keeps its email; it's
                                        // the one this link was sent to.
                                        <Input
                                            id="email"
                                            type="email"
                                            value={reapplication.email}
                                            readOnly
                                            aria-readonly="true"
                                            className={`${INPUT_CLASS} cursor-not-allowed bg-[#1F2A24]/5 text-[#1F2A24]/70`}
                                        />
                                    ) : (
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            aria-invalid={
                                                errors.email ? true : undefined
                                            }
                                            className={INPUT_CLASS}
                                        />
                                    )}
                                    <InputError message={errors.email} />
                                </div>

                                {role === 'STUDENT' && (
                                    <div className="sm:col-span-2">
                                        <Label
                                            htmlFor="parent_email"
                                            className={LABEL_CLASS}
                                        >
                                            Parent or guardian's email
                                        </Label>
                                        <Input
                                            id="parent_email"
                                            name="parent_email"
                                            type="email"
                                            required
                                            defaultValue={
                                                reapplication?.parentEmail ??
                                                undefined
                                            }
                                            autoComplete="off"
                                            placeholder="parent@example.com"
                                            aria-invalid={
                                                errors.parent_email
                                                    ? true
                                                    : undefined
                                            }
                                            aria-describedby="parent_email-hint"
                                            className={INPUT_CLASS}
                                        />
                                        {errors.parent_email ? (
                                            <InputError
                                                message={errors.parent_email}
                                            />
                                        ) : (
                                            <p
                                                id="parent_email-hint"
                                                className="mt-1 text-xs text-[#1F2A24]/55"
                                            >
                                                We'll email them a link to
                                                confirm your account. The school
                                                reviews it once they do.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* The school checks staff itself, so only
                                    portal accounts send an ID. */}
                                {!isStaff && (
                                    <div>
                                        <Label
                                            htmlFor="valid_id"
                                            className={LABEL_CLASS}
                                        >
                                            Valid ID
                                        </Label>
                                        <label
                                            className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 transition-colors focus-within:border-[#2F6F4E] focus-within:ring-[3px] focus-within:ring-[#2F6F4E]/30 hover:border-[#2F6F4E]/50 hover:bg-[#2F6F4E]/5 ${
                                                errors.valid_id
                                                    ? 'border-[#C6473B]/60'
                                                    : validIdName
                                                      ? 'border-[#2F6F4E]/40 bg-[#2F6F4E]/5'
                                                      : 'border-[#1F2A24]/25'
                                            }`}
                                        >
                                            {validIdName ? (
                                                <FileCheck2
                                                    className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <Upload
                                                    className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <span
                                                className={`min-w-0 flex-1 truncate text-sm ${validIdName ? 'text-[#1F2A24]' : 'text-[#1F2A24]/50'}`}
                                            >
                                                {validIdName ||
                                                    'Photo or scan of your ID'}
                                            </span>
                                            <span className="shrink-0 text-xs font-semibold text-[#2F6F4E]">
                                                {validIdName
                                                    ? 'Change'
                                                    : 'Browse'}
                                            </span>
                                            <input
                                                id="valid_id"
                                                name="valid_id"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                required
                                                onChange={(e) =>
                                                    setValidIdName(
                                                        e.target.files?.[0]
                                                            ?.name ?? '',
                                                    )
                                                }
                                                aria-describedby="valid_id-hint"
                                                aria-invalid={
                                                    errors.valid_id
                                                        ? true
                                                        : undefined
                                                }
                                                className="sr-only"
                                            />
                                        </label>
                                        {errors.valid_id ? (
                                            <InputError
                                                message={errors.valid_id}
                                            />
                                        ) : (
                                            <div className="mt-1 flex items-center gap-2 text-xs">
                                                <p
                                                    id="valid_id-hint"
                                                    className="min-w-0 flex-1 truncate text-[#1F2A24]/55"
                                                    title={`${validIdHint}. PDF, JPG or PNG up to 10MB. Only school staff can see it.`}
                                                >
                                                    {validIdHint}
                                                </p>
                                                <AcceptedIdsDialog
                                                    trigger={
                                                        <button
                                                            type="button"
                                                            className="shrink-0 font-semibold text-[#2F6F4E] underline-offset-2 hover:underline"
                                                        >
                                                            See accepted IDs
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <Label
                                        htmlFor="password"
                                        className={LABEL_CLASS}
                                    >
                                        Password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="new-password"
                                        aria-invalid={
                                            errors.password ? true : undefined
                                        }
                                        className={INPUT_CLASS}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div>
                                    <Label
                                        htmlFor="password_confirmation"
                                        className={LABEL_CLASS}
                                    >
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="terms"
                                        name="terms"
                                        value="1"
                                        required
                                        checked={agreedToTerms}
                                        onCheckedChange={(checked) =>
                                            setAgreedToTerms(checked === true)
                                        }
                                        aria-invalid={
                                            errors.terms ? true : undefined
                                        }
                                        className="mt-0.5 data-[state=checked]:border-[#2F6F4E] data-[state=checked]:bg-[#2F6F4E]"
                                    />
                                    <Label
                                        htmlFor="terms"
                                        className="block text-sm leading-snug font-normal text-[#1F2A24]/75"
                                    >
                                        I agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setIsTermsOpen(true)}
                                            className={LINK_CLASS}
                                        >
                                            Terms and Conditions
                                        </button>
                                        , including how the school handles my
                                        personal data.
                                    </Label>
                                </div>
                                <InputError message={errors.terms} />
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-10 w-full rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                            >
                                {processing && <Spinner />}
                                {reapplication
                                    ? 'Send for review'
                                    : isStaff
                                      ? 'Request account'
                                      : 'Create account'}
                            </Button>
                        </>
                    )}
                </Form>
            </PortalAuthShell>

            <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                <DialogContent className="flex max-h-[85vh] flex-col gap-0 rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-2xl">
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-4 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Terms and Conditions
                        </DialogTitle>
                        <DialogDescription className="text-[#1F2A24]/65">
                            EVIMS Student Portal and online enrollment
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        <TermsContent />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#1F2A24]/10 px-6 py-3">
                        <button
                            type="button"
                            onClick={() => setIsTermsOpen(false)}
                            className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAgreedToTerms(true);
                                setIsTermsOpen(false);
                            }}
                            className="min-h-10 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] hover:bg-[#25573E]"
                        >
                            I agree
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
