import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Register({ prefillName = '', prefillEmail = '' }) {
    return (
        <div className="min-h-screen bg-[#FBF8F2] px-4 py-16">
            <Head title="Create Parent Account" />

            <div className="mx-auto max-w-md">
                <div className="mb-6 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                        Student Portal
                    </span>
                    <h1 className="mt-3 font-serif text-2xl font-semibold text-[#1F2A24] sm:text-3xl">
                        Track Your Application
                    </h1>
                    <p className="mt-1 text-sm text-[#1F2A24]/60">
                        Create an account to view status updates and manage your enrollment.
                    </p>
                </div>

                <div className="rounded-[2rem] border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/5 sm:p-8">
                    <Form
                        action={route('portal.register.store')}
                        method="post"
                        resetOnSuccess={['password', 'password_confirmation']}
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div>
                                    <Label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                                        Full Name
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={prefillName}
                                        required
                                        autoFocus
                                        className="border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div>
                                    <Label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={prefillEmail}
                                        required
                                        className="border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div>
                                    <Label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                                        Password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="new-password"
                                        className="border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30"
                                    />
                                    <InputError message={errors.password} />
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80">
                                        Confirm Password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        className="border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-full bg-[#2F6F4E] py-5 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                                >
                                    {processing && <Spinner />}
                                    Create Account
                                </Button>
                            </>
                        )}
                    </Form>
                </div>

                <p className="mt-6 text-center text-sm text-[#1F2A24]/60">
                    Already have an account?{' '}
                    <TextLink href={route('portal.login')} className="font-medium text-[#2F6F4E] hover:text-[#25573E]">
                        Log in
                    </TextLink>
                </p>
            </div>
        </div>
    );
}
