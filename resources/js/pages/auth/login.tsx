import { Form, Head, usePage } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import AccountRoleSelect from '@/components/account-role-select';
import type {
    AccountRoleOption,
    AccountRoleValue,
} from '@/components/account-role-select';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PortalAuthShell from '@/components/portal-auth-shell';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store as staffSignIn } from '@/routes/login';
import { request } from '@/routes/password';
import { store as portalSignIn } from '@/routes/portal/login';
import { terms } from '@/routes/site';
import { store as studentSignIn } from '@/routes/student/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
    /** Sent here on the way to the admission form. */
    isApplying?: boolean;
    roles: AccountRoleOption[];
    /** Preselected from ?role=, e.g. from a student page or an email. */
    selectedRole: AccountRoleValue | null;
};

const INPUT_CLASS =
    'h-10 border-ink/15 focus-visible:border-brand focus-visible:ring-brand/30 aria-[invalid=true]:border-danger';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-ink/80';

const LINK_CLASS =
    'font-semibold text-brand-ink underline-offset-2 hover:text-brand-deep-ink hover:underline';

/**
 * Where the form signs in, by role. Staff go through Fortify (so two-factor
 * still applies), families through the portal, and students through the
 * portal with an email or the student sign-in with an LRN.
 */
function signInTarget(role: AccountRoleValue | '', identifier: string) {
    if (role === 'STUDENT' && !identifier.includes('@')) {
        return {
            action: studentSignIn.url(),
            identifierName: 'lrn',
            hidden: {},
        };
    }

    if (role === 'STUDENT' || role === 'PARENT_GUARDIAN') {
        return {
            action: portalSignIn.url(),
            identifierName: 'email',
            hidden: { account_type: role },
        };
    }

    return {
        action: staffSignIn.url(),
        identifierName: 'email',
        hidden: role ? { role } : {},
    };
}

/** One login page for students, families, and school staff. */
export default function Login({
    status,
    canResetPassword,
    isApplying = false,
    roles,
    selectedRole,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [role, setRole] = useState<AccountRoleValue | ''>(selectedRole ?? '');
    const [identifier, setIdentifier] = useState('');
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);

    const isStudent = role === 'STUDENT';
    const isStaff = roles.find((option) => option.value === role)?.isStaff;
    const target = signInTarget(role, identifier);

    const notice =
        status ??
        props.flash?.success ??
        (isApplying
            ? 'Log in to start an enrollment application. Your account must be verified by the school first.'
            : null);

    const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
        setIsCapsLockOn(event.getModifierState('CapsLock'));
    };

    return (
        <>
            <Head title="Log in" />

            <PortalAuthShell
                title="Welcome back"
                description="Choose who you are, then log in with your account."
                notice={
                    notice && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2.5 text-[13px] leading-snug text-ink/80"
                        >
                            {notice}
                        </div>
                    )
                }
                footer={
                    <div className="space-y-2">
                        <p>
                            Don't have an account?{' '}
                            <TextLink
                                href={register({
                                    query: role ? { role } : {},
                                })}
                                className={LINK_CLASS}
                            >
                                Create one
                            </TextLink>
                        </p>
                        <p className="text-xs text-ink/55">
                            Logging in uses only essential cookies.{' '}
                            <TextLink
                                href={`${terms.url()}#cookies`}
                                className={LINK_CLASS}
                            >
                                Cookie policy
                            </TextLink>
                        </p>
                    </div>
                }
            >
                <Form
                    action={target.action}
                    method="post"
                    resetOnSuccess={['password']}
                    className="space-y-4"
                >
                    {({ processing, errors }) => {
                        const identifierError = errors.email ?? errors.lrn;

                        return (
                            <>
                                <AccountRoleSelect
                                    roles={roles}
                                    value={role}
                                    onChange={setRole}
                                    label="I am logging in as"
                                    error={errors.role ?? errors.account_type}
                                />

                                {Object.entries(target.hidden).map(
                                    ([name, value]) => (
                                        <input
                                            key={name}
                                            type="hidden"
                                            name={name}
                                            value={value}
                                        />
                                    ),
                                )}

                                <div>
                                    <Label
                                        htmlFor="identifier"
                                        className={LABEL_CLASS}
                                    >
                                        {isStudent
                                            ? 'Email or LRN'
                                            : 'Email address'}
                                    </Label>
                                    <Input
                                        id="identifier"
                                        name={target.identifierName}
                                        type={isStudent ? 'text' : 'email'}
                                        required
                                        value={identifier}
                                        onChange={(e) =>
                                            setIdentifier(e.target.value)
                                        }
                                        autoComplete="username"
                                        placeholder={
                                            isStudent
                                                ? 'you@example.com or your 12-digit LRN'
                                                : 'you@example.com'
                                        }
                                        aria-invalid={
                                            identifierError ? true : undefined
                                        }
                                        aria-describedby={
                                            isStudent
                                                ? 'identifier-hint'
                                                : undefined
                                        }
                                        className={INPUT_CLASS}
                                    />
                                    {identifierError ? (
                                        <InputError message={identifierError} />
                                    ) : (
                                        isStudent && (
                                            <p
                                                id="identifier-hint"
                                                className="mt-1 text-xs text-ink/55"
                                            >
                                                Enrolled students can use the
                                                LRN on their report card. The
                                                first time, the password is the
                                                LRN too.
                                            </p>
                                        )
                                    )}
                                </div>

                                <div>
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <Label
                                            htmlFor="password"
                                            className="text-sm font-medium text-ink/80"
                                        >
                                            Password
                                        </Label>
                                        {isStaff && canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="text-xs font-medium text-brand-ink hover:text-brand-deep-ink"
                                            >
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        onKeyUp={trackCapsLock}
                                        onKeyDown={trackCapsLock}
                                        onBlur={() => setIsCapsLockOn(false)}
                                        aria-invalid={
                                            errors.password ? true : undefined
                                        }
                                        aria-describedby={
                                            isCapsLockOn
                                                ? 'caps-lock-warning'
                                                : undefined
                                        }
                                        className={INPUT_CLASS}
                                    />
                                    {isCapsLockOn && (
                                        <p
                                            id="caps-lock-warning"
                                            role="status"
                                            className="mt-1 flex items-center gap-1.5 text-xs font-medium text-warn-ink"
                                        >
                                            <TriangleAlert
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                            Caps Lock is on
                                        </p>
                                    )}
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        className="data-[state=checked]:border-brand data-[state=checked]:bg-brand"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm font-normal text-ink/75"
                                    >
                                        Keep me logged in on this device
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="login-button"
                                    className="h-10 w-full rounded-full bg-brand text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-deep"
                                >
                                    {processing && <Spinner />}
                                    {processing ? 'Logging in…' : 'Log in'}
                                </Button>
                            </>
                        );
                    }}
                </Form>
            </PortalAuthShell>
        </>
    );
}
