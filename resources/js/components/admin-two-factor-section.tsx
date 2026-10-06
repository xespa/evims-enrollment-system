import { router, useForm } from '@inertiajs/react';
import {
    Check,
    Copy,
    KeyRound,
    Loader2,
    RefreshCw,
    ShieldCheck,
    ShieldOff,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { SettingsSection } from '@/components/admin-settings-section';
import { useConfirm } from '@/hooks/use-confirm';
import twoFactorRoutes from '@/routes/two-factor';

export type TwoFactorState = {
    isEnabled: boolean;
    /** Turned on, but the first code hasn't been confirmed yet. */
    isPending: boolean;
    isRequired: boolean;
    qrCodeSvg: string | null;
    setupKey: string | null;
};

function CopyButton({ text, label }: { text: string; label: string }) {
    const [isCopied, setIsCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            window.setTimeout(() => setIsCopied(false), 2000);
        } catch {
            setIsCopied(false);
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#1F2A24]/15 bg-white px-3 text-xs font-semibold text-[#1F2A24]/75 hover:bg-[#1F2A24]/5"
        >
            {isCopied ? (
                <Check className="size-3.5 text-[#2F6F4E]" aria-hidden="true" />
            ) : (
                <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span aria-live="polite">{isCopied ? 'Copied' : label}</span>
        </button>
    );
}

const primaryButton =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#1F2A24]/15 bg-white px-5 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5 disabled:opacity-50';

/**
 * Turning two-factor authentication on (scan, then confirm a code), and
 * managing recovery codes once it's on.
 */
export default function AdminTwoFactorSection({
    twoFactor,
    recoveryCodes,
}: {
    twoFactor: TwoFactorState;
    recoveryCodes?: string[];
}) {
    const [confirm, confirmDialog] = useConfirm();
    const [isBusy, setIsBusy] = useState(false);
    const confirmForm = useForm({ code: '' });

    const busyOptions = {
        preserveScroll: true,
        onStart: () => setIsBusy(true),
        onFinish: () => setIsBusy(false),
    };

    const turnOn = () =>
        router.post(twoFactorRoutes.enable.url(), {}, busyOptions);

    const cancelSetup = () =>
        router.delete(twoFactorRoutes.disable.url(), busyOptions);

    const turnOff = async () => {
        const confirmed = await confirm({
            title: 'Turn off two-factor authentication?',
            description:
                'Signing in will only need your password. Your current recovery codes will stop working.',
            confirmLabel: 'Turn Off',
            destructive: true,
        });
        if (confirmed) {
            router.delete(twoFactorRoutes.disable.url(), busyOptions);
        }
    };

    const regenerate = async () => {
        const confirmed = await confirm({
            title: 'Make new recovery codes?',
            description: 'Your old recovery codes will stop working.',
            confirmLabel: 'Make New Codes',
        });
        if (confirmed) {
            router.post(
                twoFactorRoutes.regenerateRecoveryCodes.url(),
                {},
                busyOptions,
            );
        }
    };

    const showRecoveryCodes = () =>
        router.reload({ only: ['recoveryCodes'], ...busyOptions });

    const submitCode = (e: FormEvent) => {
        e.preventDefault();
        confirmForm.post(twoFactorRoutes.confirm.url(), {
            preserveScroll: true,
            errorBag: 'confirmTwoFactorAuthentication',
            onSuccess: () => confirmForm.reset(),
        });
    };

    return (
        <SettingsSection
            title="Two-factor authentication"
            description="A code from an authenticator app on your phone is needed to sign in, as well as your password."
        >
            {confirmDialog}

            <div className="space-y-5 px-6 py-5">
                {twoFactor.isEnabled && (
                    <>
                        <p className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-sm font-semibold text-[#2F6F4E]">
                            <ShieldCheck
                                className="size-4"
                                aria-hidden="true"
                            />
                            On
                        </p>

                        <div className="rounded-xl border border-[#1F2A24]/10 bg-[#FBF8F2] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1F2A24]">
                                        <KeyRound
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        Recovery codes
                                    </h3>
                                    <p className="mt-0.5 text-sm text-[#1F2A24]/70">
                                        Each one signs you in once if you lose
                                        your phone. Keep them somewhere safe.
                                    </p>
                                </div>
                                {recoveryCodes && recoveryCodes.length > 0 && (
                                    <CopyButton
                                        text={recoveryCodes.join('\n')}
                                        label="Copy codes"
                                    />
                                )}
                            </div>

                            {recoveryCodes && recoveryCodes.length > 0 ? (
                                <ul className="mt-3 grid gap-1.5 rounded-lg bg-white p-3 font-mono text-sm text-[#1F2A24] sm:grid-cols-2">
                                    {recoveryCodes.map((code) => (
                                        <li key={code}>{code}</li>
                                    ))}
                                </ul>
                            ) : (
                                <button
                                    type="button"
                                    onClick={showRecoveryCodes}
                                    disabled={isBusy}
                                    className={`${secondaryButton} mt-3`}
                                >
                                    Show recovery codes
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={regenerate}
                                disabled={isBusy}
                                className={secondaryButton}
                            >
                                <RefreshCw
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Make new recovery codes
                            </button>
                            {!twoFactor.isRequired && (
                                <button
                                    type="button"
                                    onClick={turnOff}
                                    disabled={isBusy}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#C6473B]/40 bg-white px-5 text-sm font-semibold text-[#A3372D] transition-colors hover:bg-[#C6473B]/5 disabled:opacity-50"
                                >
                                    <ShieldOff
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Turn off
                                </button>
                            )}
                        </div>
                        {twoFactor.isRequired && (
                            <p className="text-xs text-[#1F2A24]/60">
                                Two-factor authentication is required for your
                                role, so it can't be turned off.
                            </p>
                        )}
                    </>
                )}

                {twoFactor.isPending && (
                    <ol className="space-y-5">
                        <li>
                            <p className="text-sm font-semibold text-[#1F2A24]">
                                1. Scan this code with your authenticator app
                            </p>
                            <p className="mt-0.5 text-sm text-[#1F2A24]/70">
                                For example Google Authenticator or Microsoft
                                Authenticator.
                            </p>
                            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                                {twoFactor.qrCodeSvg && (
                                    <div
                                        role="img"
                                        aria-label="QR code for your authenticator app"
                                        className="w-fit rounded-xl border border-[#1F2A24]/10 bg-white p-3 [&_svg]:size-44"
                                        // Generated on the server from the account's own secret.
                                        dangerouslySetInnerHTML={{
                                            __html: twoFactor.qrCodeSvg,
                                        }}
                                    />
                                )}
                                {twoFactor.setupKey && (
                                    <div className="min-w-0">
                                        <p className="text-xs text-[#1F2A24]/60">
                                            Can't scan it? Enter this key
                                            instead:
                                        </p>
                                        <p className="mt-1 font-mono text-sm break-all text-[#1F2A24]">
                                            {twoFactor.setupKey}
                                        </p>
                                        <div className="mt-2">
                                            <CopyButton
                                                text={twoFactor.setupKey}
                                                label="Copy key"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </li>
                        <li>
                            <form onSubmit={submitCode} noValidate>
                                <label
                                    htmlFor="two-factor-code"
                                    className="text-sm font-semibold text-[#1F2A24]"
                                >
                                    2. Enter the 6-digit code it shows
                                </label>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                    <input
                                        id="two-factor-code"
                                        value={confirmForm.data.code}
                                        onChange={(e) =>
                                            confirmForm.setData(
                                                'code',
                                                e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 6),
                                            )
                                        }
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        placeholder="123456"
                                        aria-invalid={!!confirmForm.errors.code}
                                        aria-describedby={
                                            confirmForm.errors.code
                                                ? 'two-factor-code-error'
                                                : undefined
                                        }
                                        className="min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 text-center font-mono text-lg tracking-[0.4em] text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] sm:w-44"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            confirmForm.processing ||
                                            confirmForm.data.code.length !== 6
                                        }
                                        className={primaryButton}
                                    >
                                        {confirmForm.processing && (
                                            <Loader2
                                                className="size-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        )}
                                        Confirm and turn on
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelSetup}
                                        disabled={isBusy}
                                        className={secondaryButton}
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {confirmForm.errors.code && (
                                    <p
                                        id="two-factor-code-error"
                                        role="alert"
                                        className="mt-1.5 text-xs text-[#C6473B]"
                                    >
                                        {confirmForm.errors.code}
                                    </p>
                                )}
                            </form>
                        </li>
                    </ol>
                )}

                {!twoFactor.isEnabled && !twoFactor.isPending && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-[#1F2A24]/75">
                            Off. Even if someone learns your password, they
                            won't be able to sign in without your phone.
                        </p>
                        <button
                            type="button"
                            onClick={turnOn}
                            disabled={isBusy}
                            className={`${primaryButton} shrink-0`}
                        >
                            {isBusy ? (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <ShieldCheck
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            )}
                            Turn on
                        </button>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
}
