import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

type Portal = 'staff' | 'admin';

export default function Login({ status, canResetPassword }: Props) {
    const [portal, setPortal] = useState<Portal>('staff');

    const portalCopy: Record<Portal, { heading: string; description: string }> = {
        staff: {
            heading: 'Parent / Staff Login',
            description: 'Log in to manage enrollment and payments.',
        },
        admin: {
            heading: 'Administrator Login',
            description: 'Log in to access the admin dashboard.',
        },
    };

    return (
        <>
            <Head title="Log in" />

            <div
                className="mb-6 inline-flex w-full gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800"
                role="tablist"
                aria-label="Choose login type"
            >
                {(['staff', 'admin'] as Portal[]).map((option) => (
                    <button
                        key={option}
                        type="button"
                        role="tab"
                        aria-selected={portal === option}
                        onClick={() => setPortal(option)}
                        className={cn(
                            'flex-1 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                            portal === option
                                ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                        )}
                    >
                        {option === 'staff' ? 'Parent / Staff' : 'Admin'}
                    </button>
                ))}
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
                {portalCopy[portal].description}
            </p>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                transform={(data) => ({ ...data, portal })}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
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
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in as {portal === 'admin' ? 'Admin' : 'Parent/Staff'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
