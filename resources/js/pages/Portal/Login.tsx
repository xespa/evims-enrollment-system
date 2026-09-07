import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Login() {
    return (
        <div className="mx-auto max-w-sm px-4 py-16">
            <Head title="Parent Login" />
            <h1 className="mb-6 font-serif text-2xl font-semibold text-[#1F2A24]">
                Log In to Your Account
            </h1>

            <Form action={route('portal.login.store')} method="post" resetOnSuccess={['password']} className="space-y-4">
                {({ processing, errors }) => (
                    <>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required autoFocus />
                            <InputError message={errors.email} />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput id="password" name="password" required autoComplete="current-password" />
                            <InputError message={errors.password} />
                        </div>
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing && <Spinner />}
                            Log In
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-4 text-center text-sm text-[#1F2A24]/60">
                Don't have an account? <TextLink href={route('portal.register')}>Register</TextLink>
            </p>
        </div>
    );
}
