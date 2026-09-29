import { Head, Link, router, usePoll } from '@inertiajs/react';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Each poll re-requests this page's own URL. The server checks PayMongo and,
// once the payment settles, redirects to the payment page with a message.
const POLL_INTERVAL_MS = 3000;
const STOP_POLLING_AFTER_MS = 2 * 60 * 1000;

export default function Processing({ paymentsUrl }: { paymentsUrl: string }) {
    const [timedOut, setTimedOut] = useState(false);
    const [checking, setChecking] = useState(false);
    const { stop } = usePoll(POLL_INTERVAL_MS);
    const stopRef = useRef(stop);
    stopRef.current = stop;

    useEffect(() => {
        const timer = setTimeout(() => {
            stopRef.current();
            setTimedOut(true);
        }, STOP_POLLING_AFTER_MS);

        return () => clearTimeout(timer);
    }, []);

    const checkNow = () => {
        router.reload({
            onStart: () => setChecking(true),
            onFinish: () => setChecking(false),
        });
    };

    return (
        <>
            <Head title="Processing Payment" />
            <div className="flex min-h-screen items-center justify-center bg-[#FBF8F2] px-4 py-12">
                <div
                    className="w-full max-w-md rounded-[2rem] border border-[#1F2A24]/10 bg-white p-8 text-center shadow-xl shadow-[#1F2A24]/5"
                    aria-live="polite"
                >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-[#2F6F4E]">
                        {timedOut ? (
                            <Clock className="h-7 w-7" aria-hidden="true" />
                        ) : (
                            <Loader2
                                className="h-7 w-7 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                    </div>

                    <h1 className="font-serif text-xl font-semibold text-[#1F2A24]">
                        {timedOut
                            ? 'Still Confirming Your Payment'
                            : 'Confirming Your Payment'}
                    </h1>

                    <p className="mt-2 text-sm text-[#1F2A24]/70">
                        {timedOut
                            ? "GCash is taking longer than usual to confirm. If you completed the payment, it will still be recorded — you don't need to pay again."
                            : "We're checking with GCash. This page updates on its own — please don't close it or pay again."}
                    </p>

                    <div className="mt-6 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={checkNow}
                            disabled={checking}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-60"
                        >
                            {checking && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Check Again Now
                        </button>
                        <Link
                            href={paymentsUrl}
                            className="flex min-h-11 items-center justify-center text-sm font-medium text-[#2F6F4E] hover:underline"
                        >
                            Back to Payments
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
