import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PortalAuthShell from '@/components/portal-auth-shell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store as signIn } from '@/routes/student/login';

const INPUT_CLASS =
    'h-11 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

/** Students sign in with their LRN and the password set on consent. */
export default function Login() {
    return (
        <>
            <Head title="Student sign in" />

            <PortalAuthShell
                title="Student sign in"
                description="Sign in with your LRN. If this is your first time, your password is also your LRN."
                footer="Your account works once your parent or guardian agrees to it."
            >
                <Form
                    {...signIn.form()}
                    resetOnSuccess={['password']}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div>
                                <Label htmlFor="lrn" className={LABEL_CLASS}>
                                    LRN
                                </Label>
                                <Input
                                    id="lrn"
                                    name="lrn"
                                    inputMode="numeric"
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="As printed on your report card"
                                    aria-invalid={errors.lrn ? true : undefined}
                                    className={`${INPUT_CLASS} tabular-nums`}
                                />
                                <InputError message={errors.lrn} />
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
                                    Keep me signed in
                                </Label>
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 w-full rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                            >
                                {processing && <Spinner />}
                                Sign in
                            </Button>
                        </>
                    )}
                </Form>
            </PortalAuthShell>
        </>
    );
}
