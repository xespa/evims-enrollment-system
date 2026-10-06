import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/invitation';

type Props = {
    token: string;
    email: string;
    /** Only given when the link is valid. */
    name: string | null;
    isValid: boolean;
    passwordRules: string;
};

export default function AcceptInvitation({
    token,
    email,
    name,
    isValid,
    passwordRules,
}: Props) {
    if (!isValid) {
        return (
            <>
                <Head title="Invitation expired" />

                <div className="grid gap-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        This invitation link is invalid, has already been used,
                        or has expired. Ask an administrator to send you a new
                        one.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={login()}>Go to log in</Link>
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Set your password" />

            {name && (
                <p className="mb-6 text-center text-sm text-muted-foreground">
                    Welcome, {name}. Choose a password to finish setting up your
                    account.
                </p>
            )}

            <Form
                {...store.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="username"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Set password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

AcceptInvitation.layout = {
    title: 'Set up your account',
    description: 'You were invited to the EVIMS admin panel',
};
