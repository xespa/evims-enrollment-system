import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Register() {
    return (
        <div className="mx-auto max-w-sm px-4 py-16">
            <Head title="Create Parent Account" />
            <h1 className="mb-1 font-serif text-2xl font-semibold text-[#1F2A24]">
                Track Your Application
            </h1>
            <p className="mb-6 text-sm text-[#1F2A24]/60">
                Create an account to view status updates and manage your enrollment.
            </p>

            <Form action={route('portal.register.store')} method="post" resetOnSuccess={['password', 'password_confirmation']} className="space-y-4">
                {({ processing, errors }) => (
                    <>
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required autoFocus />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required />
                            <InputError message={errors.email} />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput id="password" name="password" required autoComplete="new-password" />
                            <InputError message={errors.password} />
                        </div>
                        <div>
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <PasswordInput id="password_confirmation" name="password_confirmation" required autoComplete="new-password" />
                        </div>
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing && <Spinner />}
                            Create Account
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-4 text-center text-sm text-[#1F2A24]/60">
                Already have an account? <TextLink href={route('portal.login')}>Log in</TextLink>
            </p>
        </div>
    );
}
