import { Form, Head, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PortalAuthShell from '@/components/portal-auth-shell';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    /** Sent here on the way to the admission form. */
    isApplying?: boolean;
};

const INPUT_CLASS =
    'h-10 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

const LINK_CLASS = 'font-semibold text-[#2F6F4E] hover:text-[#25573E]';

export default function Login({ isApplying = false }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const notice =
        props.flash?.success ??
        (isApplying
            ? 'Log in to start an enrollment application. Your account must be verified by the school first.'
            : null);

    return (
        <>
            <Head title="Student Portal Login" />

            <PortalAuthShell
                title="Welcome back"
                description="Log in to follow your applications and pay tuition."
                notice={
                    notice && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2.5 text-[13px] leading-snug text-[#1F2A24]/80"
                        >
                            {notice}
                        </div>
                    )
                }
                footer={
                    <>
                        New to the portal?{' '}
                        <TextLink
                            href={route('portal.register')}
                            className={LINK_CLASS}
                        >
                            Create an account
                        </TextLink>
                    </>
                }
            >
                <Form
                    action={route('portal.login.store')}
                    method="post"
                    resetOnSuccess={['password']}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div>
                                <Label htmlFor="email" className={LABEL_CLASS}>
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    aria-invalid={
                                        errors.email ? true : undefined
                                    }
                                    className={INPUT_CLASS}
                                />
                                <InputError message={errors.email} />
                            </div>
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
                                    autoComplete="current-password"
                                    aria-invalid={
                                        errors.password ? true : undefined
                                    }
                                    className={INPUT_CLASS}
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    className="data-[state=checked]:border-[#2F6F4E] data-[state=checked]:bg-[#2F6F4E]"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal text-[#1F2A24]/75"
                                >
                                    Keep me logged in
                                </Label>
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-10 w-full rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </>
                    )}
                </Form>
            </PortalAuthShell>
        </>
    );
}
