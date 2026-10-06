import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/two-factor/login';

/**
 * The second sign-in step for staff with two-factor turned on: the code
 * from their authenticator app, or one of their recovery codes.
 */
export default function TwoFactorChallenge() {
    const [isUsingRecoveryCode, setIsUsingRecoveryCode] = useState(false);

    return (
        <>
            <Head title="Two-factor authentication" />

            <Form
                {...store.form()}
                resetOnError
                // Remounts the inputs when switching, so only one is sent.
                key={isUsingRecoveryCode ? 'recovery' : 'code'}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        {isUsingRecoveryCode ? (
                            <div className="grid gap-2">
                                <Label htmlFor="recovery_code">
                                    Recovery code
                                </Label>
                                <Input
                                    id="recovery_code"
                                    name="recovery_code"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="xxxxxxxxxx-xxxxxxxxxx"
                                    aria-invalid={!!errors.recovery_code}
                                />
                                <InputError message={errors.recovery_code} />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor="code">
                                    Authentication code
                                </Label>
                                <Input
                                    id="code"
                                    name="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    autoFocus
                                    placeholder="123456"
                                    className="text-center text-lg tracking-[0.4em] tabular-nums"
                                    aria-invalid={!!errors.code}
                                />
                                <InputError message={errors.code} />
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Continue
                        </Button>

                        <button
                            type="button"
                            onClick={() =>
                                setIsUsingRecoveryCode((current) => !current)
                            }
                            className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            {isUsingRecoveryCode
                                ? 'Use the code from my authenticator app'
                                : "Can't use your app? Use a recovery code"}
                        </button>
                    </div>
                )}
            </Form>
        </>
    );
}

TwoFactorChallenge.layout = {
    title: 'Two-factor authentication',
    description:
        'Enter the 6-digit code from your authenticator app to finish signing in.',
};
