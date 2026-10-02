import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleCheck, Lock, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { login as portalLogin } from '@/routes/portal';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const INPUT_CLASS =
    'h-11 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30 aria-[invalid=true]:border-[#C6473B]';

const LABEL_CLASS = 'text-sm font-medium text-[#1F2A24]/80';

const LINK_CLASS =
    'font-semibold text-[#2F6F4E] underline-offset-2 hover:text-[#25573E] hover:underline';

export default function Login({ status, canResetPassword }: Props) {
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);

    const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
        setIsCapsLockOn(event.getModifierState('CapsLock'));
    };

    return (
        <>
            <Head title="Staff Log In" />

            <div className="mb-5 flex items-center justify-center gap-1.5 rounded-full bg-[#2F6F4E]/8 px-3 py-1.5 text-xs font-medium text-[#2F6F4E]">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Restricted to authorized school staff
            </div>

            {status && (
                <div
                    role="status"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2.5 text-sm text-[#2F6F4E]"
                >
                    <CircleCheck
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                    />
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="grid gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <Label
                                htmlFor="email"
                                className={`mb-1.5 block ${LABEL_CLASS}`}
                            >
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="username"
                                placeholder="you@evims.edu.ph"
                                aria-invalid={errors.email ? true : undefined}
                                aria-describedby={
                                    errors.email ? 'email-error' : undefined
                                }
                                className={INPUT_CLASS}
                            />
                            <div id="email-error">
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <Label
                                    htmlFor="password"
                                    className={LABEL_CLASS}
                                >
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs font-medium text-[#2F6F4E] hover:text-[#25573E]"
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
                                    className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#a4670f]"
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

                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                className="data-[state=checked]:border-[#2F6F4E] data-[state=checked]:bg-[#2F6F4E]"
                            />
                            <Label
                                htmlFor="remember"
                                className="text-sm font-normal text-[#1F2A24]/75"
                            >
                                Keep me signed in on this device
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            data-test="login-button"
                            className="h-11 w-full rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            {processing && <Spinner />}
                            {processing ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-6 space-y-3 border-t border-[#1F2A24]/10 pt-5 text-center text-sm text-[#1F2A24]/65">
                <p>
                    Parent or student?{' '}
                    <TextLink href={portalLogin()} className={LINK_CLASS}>
                        Log in to the Student Portal
                    </TextLink>
                </p>
                <Link
                    href={home()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1F2A24]/55 hover:text-[#1F2A24]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Back to the EVIMS website
                </Link>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Staff sign in',
    description:
        'EVIMS Admin Panel — manage enrollments, accounts, and payments.',
};
