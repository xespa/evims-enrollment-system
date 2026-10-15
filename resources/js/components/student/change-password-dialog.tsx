import { Form } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update as updatePassword } from '@/routes/student/password';

const INPUT_CLASS =
    'h-11 border-ink/15 focus-visible:border-brand focus-visible:ring-brand/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-ink/80';

/**
 * The student's change-password form, opened from Settings. After a reset by
 * the school, the current password is the LRN or the temporary one given.
 */
export default function ChangePasswordDialog({
    open,
    onOpenChange,
    mustChangePassword,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mustChangePassword: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border-ink/10 bg-surface text-ink sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif text-xl">
                        <KeyRound
                            className="h-5 w-5 text-brand-ink"
                            aria-hidden="true"
                        />
                        Change password
                    </DialogTitle>
                    <DialogDescription className="text-ink/65">
                        {mustChangePassword
                            ? 'The school reset your password. Enter the password they gave you (or your LRN), then choose a new one.'
                            : 'Choose a password only you know. Your first password is your LRN.'}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...updatePassword.form()}
                    resetOnSuccess
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div>
                                <Label
                                    htmlFor="current_password"
                                    className={LABEL_CLASS}
                                >
                                    Current password
                                </Label>
                                <PasswordInput
                                    id="current_password"
                                    name="current_password"
                                    required
                                    autoComplete="current-password"
                                    className={INPUT_CLASS}
                                />
                                <InputError message={errors.current_password} />
                            </div>
                            <div>
                                <Label
                                    htmlFor="password"
                                    className={LABEL_CLASS}
                                >
                                    New password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                    className={INPUT_CLASS}
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div>
                                <Label
                                    htmlFor="password_confirmation"
                                    className={LABEL_CLASS}
                                >
                                    Confirm new password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 bg-surface px-5 text-sm font-semibold text-ink/75 hover:bg-ink/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-deep disabled:opacity-60"
                                >
                                    {processing && <Spinner />}
                                    Change password
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
