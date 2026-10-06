import { Head, useForm } from '@inertiajs/react';
import { Check, Circle, X } from 'lucide-react';
import { useMemo } from 'react';
import type { FormEvent } from 'react';
import AdminSettingsShell from '@/components/admin-settings-nav';
import {
    SettingsField,
    SettingsFormFooter,
    SettingsSection,
    settingsInputClass,
} from '@/components/admin-settings-section';
import PasswordInput from '@/components/password-input';
import admin from '@/routes/admin';

type PasswordRequirement = {
    label: string;
    isMet: (password: string) => boolean;
};

/**
 * Turns Laravel's password rules string ("minlength: 12; required: lower;
 * required: upper; ...") into a checklist the new password is checked
 * against as it's typed. The server still has the final say.
 */
function passwordRequirements(passwordRules: string): PasswordRequirement[] {
    const rules = passwordRules
        .split(';')
        .map((rule) => rule.trim())
        .filter(Boolean);
    const isRequired = (kind: string) => rules.includes(`required: ${kind}`);
    const minLength = Number(
        rules.find((rule) => rule.startsWith('minlength:'))?.split(':')[1] ?? 0,
    );

    const requirements: PasswordRequirement[] = [];

    if (minLength > 0) {
        requirements.push({
            label: `At least ${minLength} characters`,
            isMet: (password) => password.length >= minLength,
        });
    }

    if (isRequired('upper')) {
        requirements.push(
            {
                label: 'An uppercase letter',
                isMet: (password) => /\p{Lu}/u.test(password),
            },
            {
                label: 'A lowercase letter',
                isMet: (password) => /\p{Ll}/u.test(password),
            },
        );
    } else if (isRequired('lower')) {
        requirements.push({
            label: 'A letter',
            isMet: (password) => /\p{L}/u.test(password),
        });
    }

    if (isRequired('digit')) {
        requirements.push({
            label: 'A number',
            isMet: (password) => /\p{N}/u.test(password),
        });
    }

    if (isRequired('special')) {
        requirements.push({
            label: 'A symbol',
            isMet: (password) => /[\p{Z}\p{S}\p{P}]/u.test(password),
        });
    }

    return requirements;
}

export default function Security({ passwordRules }: { passwordRules: string }) {
    const requirements = useMemo(
        () => passwordRequirements(passwordRules),
        [passwordRules],
    );

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const { data, errors } = passwordForm;

    const hasPassword = data.password !== '';
    const hasConfirmation = data.password_confirmation !== '';
    const passwordsMatch = data.password === data.password_confirmation;
    const canSubmit =
        data.current_password !== '' &&
        hasPassword &&
        hasConfirmation &&
        passwordsMatch;

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put(admin.settings.password.update.url(), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: (submitErrors) => {
                if (
                    submitErrors.password ||
                    submitErrors.password_confirmation
                ) {
                    passwordForm.reset('password', 'password_confirmation');
                }
                if (submitErrors.current_password) {
                    passwordForm.reset('current_password');
                }
            },
        });
    };

    const discardPasswordChanges = () => {
        passwordForm.reset();
        passwordForm.clearErrors();
    };

    return (
        <>
            <Head title="Security settings" />

            <AdminSettingsShell>
                <SettingsSection
                    title="Change password"
                    description="Use a long, unique password that you don't use anywhere else."
                >
                    <form onSubmit={submitPassword} noValidate>
                        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
                            <div className="space-y-5">
                                <SettingsField
                                    id="current_password"
                                    label="Current password"
                                    error={errors.current_password}
                                >
                                    <PasswordInput
                                        id="current_password"
                                        value={data.current_password}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'current_password',
                                                e.target.value,
                                            )
                                        }
                                        autoComplete="current-password"
                                        aria-invalid={!!errors.current_password}
                                        aria-describedby={
                                            errors.current_password
                                                ? 'current_password-error'
                                                : undefined
                                        }
                                        className={settingsInputClass}
                                    />
                                </SettingsField>

                                <SettingsField
                                    id="password"
                                    label="New password"
                                    error={errors.password}
                                >
                                    <PasswordInput
                                        id="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        autoComplete="new-password"
                                        passwordrules={passwordRules}
                                        aria-invalid={!!errors.password}
                                        aria-describedby={
                                            errors.password
                                                ? 'password-error'
                                                : 'password-requirements'
                                        }
                                        className={settingsInputClass}
                                    />
                                </SettingsField>

                                <SettingsField
                                    id="password_confirmation"
                                    label="Confirm new password"
                                    error={errors.password_confirmation}
                                    hint={
                                        hasPassword &&
                                        hasConfirmation && (
                                            <span
                                                aria-live="polite"
                                                className={`inline-flex items-center gap-1.5 ${
                                                    passwordsMatch
                                                        ? 'text-[#2F6F4E]'
                                                        : 'text-[#C6473B]'
                                                }`}
                                            >
                                                {passwordsMatch ? (
                                                    <Check
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <X
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {passwordsMatch
                                                    ? 'Passwords match'
                                                    : "Passwords don't match"}
                                            </span>
                                        )
                                    }
                                >
                                    <PasswordInput
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        autoComplete="new-password"
                                        passwordrules={passwordRules}
                                        aria-invalid={
                                            !!errors.password_confirmation ||
                                            (hasConfirmation && !passwordsMatch)
                                        }
                                        aria-describedby={
                                            errors.password_confirmation
                                                ? 'password_confirmation-error'
                                                : undefined
                                        }
                                        className={settingsInputClass}
                                    />
                                </SettingsField>
                            </div>

                            {requirements.length > 0 && (
                                <div className="self-start rounded-xl border border-[#1F2A24]/10 bg-[#FBF8F2] p-4">
                                    <p className="text-sm font-medium text-[#1F2A24]/85">
                                        Your new password needs
                                    </p>
                                    <ul
                                        id="password-requirements"
                                        aria-label="Password requirements"
                                        className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-1"
                                    >
                                        {requirements.map((requirement) => {
                                            const isMet = requirement.isMet(
                                                data.password,
                                            );

                                            return (
                                                <li
                                                    key={requirement.label}
                                                    className={`flex items-center gap-2 transition-colors ${
                                                        isMet
                                                            ? 'text-[#2F6F4E]'
                                                            : 'text-[#1F2A24]/60'
                                                    }`}
                                                >
                                                    {isMet ? (
                                                        <Check
                                                            className="size-3.5 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <Circle
                                                            className="size-3.5 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {requirement.label}
                                                    <span className="sr-only">
                                                        {isMet
                                                            ? '(met)'
                                                            : '(not met)'}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <SettingsFormFooter
                            isDirty={passwordForm.isDirty}
                            processing={passwordForm.processing}
                            recentlySuccessful={passwordForm.recentlySuccessful}
                            canSubmit={canSubmit}
                            submitLabel="Update password"
                            onDiscard={discardPasswordChanges}
                        />
                    </form>
                </SettingsSection>
            </AdminSettingsShell>
        </>
    );
}
