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
    'h-11 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

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
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white text-[#1F2A24] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif text-xl">
                        <KeyRound
                            className="h-5 w-5 text-[#2F6F4E]"
                            aria-hidden="true"
                        />
                        Change password
                    </DialogTitle>
                    <DialogDescription className="text-[#1F2A24]/65">
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
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1F2A24]/15 bg-white px-5 text-sm font-semibold text-[#1F2A24]/75 hover:bg-[#1F2A24]/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E] disabled:opacity-60"
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
