import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Admin Log In" />

            <div className="mb-5">
                <h2 className="text-base font-semibold text-[#1F2A24]">
                    Administrator Login
                </h2>
                <p className="mt-0.5 text-sm text-[#1F2A24]/60">
                    Log in to access the admin dashboard.
                </p>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div>
                                <Label
                                    htmlFor="email"
                                    className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-medium text-[#1F2A24]/80"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-[#2F6F4E] hover:text-[#25573E]"
                                            tabIndex={4}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember" className="text-sm text-[#1F2A24]/80">
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-full bg-[#2F6F4E] py-5 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                                tabIndex={5}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log In
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 text-center text-sm font-medium text-[#2F6F4E]">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Welcome Back',
    description: 'Log in to continue to your account',
};
